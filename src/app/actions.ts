"use server";

import { supabaseServer as supabase } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "./auth-actions";
import { isValidIraqPhoneNumber, sanitizeInput } from "@/lib/validation";
import { headers } from "next/headers";

async function isAdmin(userId: number | undefined) {
  if (!userId) return false;
  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();
  if (error || !data) return false;
  return data.role === "admin";
}

export async function getCities() {
  const { data, error } = await supabase.from("cities").select("*").order("name_ku");
  if (error) console.error("Error fetching cities:", error);
  return data || [];
}

export async function getCategories() {
  const { data, error } = await supabase.from("categories").select("*").order("name_ku");
  if (error) console.error("Error fetching categories:", error);
  return data || [];
}

export async function getProfessionals(cityId?: string, categoryId?: string, searchQuery: string = "") {
  let query = supabase
    .from("professionals")
    .select(`
      id,
      name,
      phone,
      experience_years,
      photo_url,
      created_at,
      cities ( name_ku ),
      categories ( name_ku, icon ),
      favorites ( user_id ),
      reviews ( rating )
    `)
    .eq("is_approved", true);

  if (cityId) query = query.eq("city_id", parseInt(cityId));
  if (categoryId) query = query.eq("category_id", parseInt(categoryId));
  
  if (searchQuery) {
    const normalizedSearch = normalizeText(searchQuery);
    query = query.or(`name.ilike.%${normalizedSearch}%,phone.ilike.%${normalizedSearch}%`);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) {
    console.error("Error fetching professionals:", error);
    return [];
  }

  const session = await getSessionUser();

  return (data || []).map((p: any) => {
    let avgRating = 0;
    if (p.reviews && p.reviews.length > 0) {
       avgRating = p.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / p.reviews.length;
    }
    
    const isFavorite = session ? p.favorites?.some((f: any) => f.user_id === session.id) : false;

    const { favorites, reviews, ...rest } = p;

    return {
      ...rest,
      rating: avgRating,
      is_favorite: isFavorite
    };
  });
}

import { unstable_noStore as noStore } from "next/cache";

export async function getProfessionalById(id: string) {
  noStore();
  const { data, error } = await supabase
    .from("professionals")
    .select(`
      id, name, phone, experience_years, photo_url, created_at, telegram_id,
      degree, skills, work_locations,
      city_id, category_id,
      cities ( name_ku ),
      categories ( name_ku, icon ),
      favorites ( user_id ),
      reviews ( id, rating, comment, created_at, users ( name, photo_url ) )
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching professional details:", error);
    return null;
  }

  if (data) {
    try {
      const { data: images } = await supabase
        .from("portfolio_images")
        .select("id, image_url")
        .eq("professional_id", id)
        .order("created_at", { ascending: false });

      const session = await getSessionUser();
      
      let avgRating = 0;
      if (data.reviews && data.reviews.length > 0) {
         avgRating = data.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / data.reviews.length;
      }
      
      const isFavorite = session ? data.favorites?.some((f: any) => f.user_id === session.id) : false;

      const { favorites, ...rest } = data;

      return { 
        ...rest, 
        portfolio_images: images || [], 
        is_professional: true,
        rating: avgRating,
        is_favorite: isFavorite
      };
    } catch (e) {
      console.error(e);
      return { ...data, portfolio_images: [], is_professional: true };
    }
  }

  return null;
}

export async function getUserById(id: string) {
  noStore();
  const { data, error } = await supabase
    .from("users")
    .select(`
      id, name, phone, photo_url, created_at, telegram_id,
      city_id,
      cities ( name_ku )
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching user details:", error, "ID:", id);
    return null;
  }

  console.log("getUserById fetched:", data, "for ID:", id);
  return { ...data, is_professional: false };
}

export async function getProfessionalByTelegramId(telegramId: number) {
  const { data, error } = await supabase
    .from("professionals")
    .select("id, name, is_approved")
    .eq("telegram_id", telegramId)
    .single();

  if (error) return null;
  return data;
}

export async function registerProfessional(formData: {
  name: string;
  phone: string;
  experience_years: number;
  city_id: number;
  category_id: number;
  photo_url?: string | null;
  telegram_id?: number | null;
  user_id?: number | null;
  degree?: string;
  skills?: string;
  work_locations?: string;
  portfolio_images?: string[];
}) {
  const session = await getSessionUser();
  if (!session) return { success: false, error: "Unauthorized" };

  const { checkRateLimit } = await import("./auth-actions");
  const limitCheck = await checkRateLimit(session.id.toString(), "register_professional", 3, 60);
  if (!limitCheck.success) {
    return { success: false, error: `تکایە ${limitCheck.timeLeft || 60} چرکەی تر چاوەڕێ بکە پێش هەوڵدان بۆ ناردنی داواکاری نوێ.` };
  }

  const { portfolio_images, ...profData } = formData;

  const { data: newProf, error } = await supabase
    .from("professionals")
    .insert([
      {
        ...profData,
        name: sanitizeInput(profData.name),
        degree: profData.degree ? sanitizeInput(profData.degree) : null,
        skills: profData.skills ? sanitizeInput(profData.skills) : null,
        work_locations: profData.work_locations ? sanitizeInput(profData.work_locations) : null,
        telegram_id: session.telegram_id,
        user_id: session.id,
        phone: session.phone,
        is_approved: false,
      },
    ])
    .select("id")
    .single();

  if (error) {
    console.error("Error registering:", error);
    return { success: false, error: error.message };
  }

  // Insert portfolio images if provided
  if (portfolio_images && portfolio_images.length > 0 && newProf) {
    const imagesToInsert = portfolio_images.map((url) => ({
      professional_id: newProf.id,
      image_url: url,
    }));

    const { error: portfolioError } = await supabase
      .from("portfolio_images")
      .insert(imagesToInsert);

    if (portfolioError) {
      console.error("Error adding portfolio images during registration:", portfolioError);
    }
  }

  return { success: true };
}

export async function updateProfessionalProfile(id: string, formData: {
  name?: string;
  phone?: string;
  experience_years?: number;
  category_id?: number;
  city_id?: number;
  degree?: string;
  skills?: string;
  work_locations?: string;
  photo_url?: string;
}) {
  const session = await getSessionUser();
  if (!session) return { success: false, error: "Unauthorized" };

  // Fetch the current professional record to get their old photo_url
  const { data: currentProf } = await supabase
    .from("professionals")
    .select("photo_url")
    .eq("id", id)
    .single();

  const sanitizedData = {
    ...formData,
    name: formData.name ? sanitizeInput(formData.name) : undefined,
    degree: formData.degree ? sanitizeInput(formData.degree) : undefined,
    skills: formData.skills ? sanitizeInput(formData.skills) : undefined,
    work_locations: formData.work_locations ? sanitizeInput(formData.work_locations) : undefined,
  };

  let query = supabase.from("professionals").update(sanitizedData).eq("id", id);
  
  if (!(await isAdmin(session.id))) {
    query = query.eq("user_id", session.id);
  }

  const { error } = await query;

  if (error) {
    console.error("Error updating profile:", error);
    return { success: false, error: error.message };
  }

  // If update succeeded and a new photo was set, delete the old photo from storage
  if (formData.photo_url && currentProf?.photo_url && currentProf.photo_url !== formData.photo_url) {
    await deleteStorageFileByUrl(currentProf.photo_url);
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function addPortfolioImage(professional_id: string, image_url: string) {
  const session = await getSessionUser();
  if (!session) return { success: false, error: "Unauthorized" };

  // Check ownership
  if (!(await isAdmin(session.id))) {
    const { data: prof } = await supabase.from("professionals").select("user_id").eq("id", professional_id).single();
    if (prof?.user_id !== session.id) return { success: false, error: "Unauthorized" };
  }

  const { data, error } = await supabase
    .from("portfolio_images")
    .insert([{ professional_id, image_url }])
    .select();

  if (error) {
    console.error("Error adding portfolio image:", error);
    return { success: false, error: error.message };
  }
  revalidatePath("/", "layout");
  return { success: true, image: data?.[0] };
}

export async function deletePortfolioImage(imageId: number | string) {
  const session = await getSessionUser();
  if (!session) return { success: false, error: "Unauthorized" };

  // Need to find professional_id and image_url first to check ownership and delete from storage
  const { data: image } = await supabase.from("portfolio_images").select("professional_id, image_url").eq("id", imageId).single();
  if (!image) return { success: false, error: "Not found" };

  if (!(await isAdmin(session.id))) {
    const { data: prof } = await supabase.from("professionals").select("user_id").eq("id", image.professional_id).single();
    if (prof?.user_id !== session.id) return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("portfolio_images")
    .delete()
    .eq("id", imageId);

  if (error) {
    console.error("Error deleting portfolio image:", error);
    return { success: false, error: error.message };
  }

  // Delete from storage
  if (image.image_url) {
    await deleteStorageFileByUrl(image.image_url);
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function approveProfessional(id: string) {
  const session = await getSessionUser();
  if (!session || !(await isAdmin(session.id))) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("professionals")
    .update({ is_approved: true })
    .eq("id", id);
    
  if (error) throw new Error(error.message);
  return true;
}

export async function getPendingProfessionals() {
  const session = await getSessionUser();
  if (!session || !(await isAdmin(session.id))) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("professionals")
    .select(`
      id,
      name,
      phone,
      experience_years,
      photo_url,
      created_at,
      cities ( name_ku ),
      categories ( name_ku, icon )
    `)
    .eq("is_approved", false)
    .order("created_at", { ascending: false });

  if (error) console.error("Error fetching pending:", error);
  return data || [];
}

function normalizeText(text: string) {
  if (!text) return text;
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  
  let result = text;
  for (let i = 0; i < 10; i++) {
    result = result.split(arabicNumbers[i]).join(i.toString())
                   .split(persianNumbers[i]).join(i.toString());
  }
  return result;
}

export async function deleteStorageFileByUrl(url: string | null | undefined) {
  if (!url) return;
  try {
    if (!url.includes("/storage/v1/object/public/")) return;
    const parts = url.split("/storage/v1/object/public/");
    if (parts.length < 2) return;
    
    const bucketAndPath = parts[1];
    const slashIndex = bucketAndPath.indexOf("/");
    if (slashIndex === -1) return;
    
    const bucket = bucketAndPath.substring(0, slashIndex);
    const filePath = bucketAndPath.substring(slashIndex + 1);
    
    const { error } = await supabase.storage.from(bucket).remove([filePath]);
    if (error) {
      console.error(`Error deleting storage file (${url}):`, error.message);
    }
  } catch (e) {
    console.error("Error in deleteStorageFileByUrl:", e);
  }
}

export async function deleteProfessional(id: string) {
  const session = await getSessionUser();
  if (!session || !(await isAdmin(session.id))) throw new Error("Unauthorized");

  // 1. Get professional photo_url
  const { data: prof } = await supabase
    .from("professionals")
    .select("photo_url")
    .eq("id", id)
    .single();

  // 2. Get portfolio images
  const { data: portfolioImages } = await supabase
    .from("portfolio_images")
    .select("image_url")
    .eq("professional_id", id);

  // 3. Delete portfolio images first to prevent FK constraint issues
  await supabase.from("portfolio_images").delete().eq("professional_id", id);

  const { error } = await supabase
    .from("professionals")
    .delete()
    .eq("id", id);
    
  if (error) throw new Error(error.message);

  // 4. Delete files from storage
  if (prof?.photo_url) {
    await deleteStorageFileByUrl(prof.photo_url);
  }
  if (portfolioImages && portfolioImages.length > 0) {
    for (const img of portfolioImages) {
      await deleteStorageFileByUrl(img.image_url);
    }
  }

  return true;
}

export async function getAdminApprovedProfessionals(searchQuery: string = "") {
  const session = await getSessionUser();
  if (!session || !(await isAdmin(session.id))) throw new Error("Unauthorized");

  let query = supabase
    .from("professionals")
    .select(`
      id,
      name,
      phone,
      experience_years,
      photo_url,
      created_at,
      user_id,
      cities ( name_ku ),
      categories ( name_ku, icon )
    `)
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  if (searchQuery) {
    const normalizedSearch = normalizeText(searchQuery);
    query = query.or(`name.ilike.%${normalizedSearch}%,phone.ilike.%${normalizedSearch}%`);
  }

  const { data, error } = await query;
  if (error) console.error("Error fetching admin approved:", error);
  return data || [];
}

export async function getPendingProfessionalsSearch(searchQuery: string = "") {
  const session = await getSessionUser();
  if (!session || !(await isAdmin(session.id))) throw new Error("Unauthorized");

  let query = supabase
    .from("professionals")
    .select(`
      id,
      name,
      phone,
      experience_years,
      photo_url,
      created_at,
      user_id,
      cities ( name_ku ),
      categories ( name_ku, icon )
    `)
    .eq("is_approved", false)
    .order("created_at", { ascending: false });

  if (searchQuery) {
    const normalizedSearch = normalizeText(searchQuery);
    query = query.or(`name.ilike.%${normalizedSearch}%,phone.ilike.%${normalizedSearch}%`);
  }

  const { data, error } = await query;
  if (error) console.error("Error fetching pending search:", error);
  return data || [];
}

export async function sendMessage(formData: { name: string; phone: string; message: string }) {
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for") || "unknown-ip";
  
  const { checkRateLimit } = await import("./auth-actions");
  const limitCheck = await checkRateLimit(ip, "send_message", 3, 60);
  if (!limitCheck.success) {
    return { success: false, error: `تکایە ${limitCheck.timeLeft || 60} چرکەی تر چاوەڕێ بکە پێش ناردنی نامەی نوێ.` };
  }

  if (!isValidIraqPhoneNumber(formData.phone)) {
    return { success: false, error: "تکایە ژمارەیەکی مۆبایلی دروست بنووسە" };
  }

  const { error } = await supabase.from("messages").insert([
    {
      sender_name: sanitizeInput(formData.name),
      phone: normalizeText(formData.phone),
      message_text: sanitizeInput(formData.message),
    },
  ]);

  if (error) {
    console.error("Error sending message:", error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function getMessages() {
  const session = await getSessionUser();
  if (!session || !(await isAdmin(session.id))) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) console.error("Error fetching messages:", error);
  return data || [];
}

export async function postAnnouncement(title: string, content: string) {
  const session = await getSessionUser();
  if (!session || !(await isAdmin(session.id))) return { success: false, error: "Unauthorized" };

  const { error } = await supabase.from("announcements").insert([{ 
    title: sanitizeInput(title), 
    content: sanitizeInput(content) 
  }]);
  if (error) {
    console.error("Error posting announcement:", error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function getAdminAnnouncements() {
  const session = await getSessionUser();
  if (!session || !(await isAdmin(session.id))) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) console.error("Error fetching admin announcements:", error);
  return data || [];
}

// User Administration
export async function getAdminUsers(searchQuery: string = "") {
  const session = await getSessionUser();
  if (!session || !(await isAdmin(session.id))) throw new Error("Unauthorized");

  let query = supabase
    .from("users")
    .select(`
      id,
      name,
      phone,
      photo_url,
      is_blocked,
      created_at,
      cities ( name_ku )
    `)
    .eq("is_blocked", false)
    .order("created_at", { ascending: false });

  if (searchQuery.trim()) {
    query = query.or(`name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`);
  }

  const { data, error } = await query;
  if (error) console.error("Error fetching users:", error);
  return data || [];
}

export async function getBlockedUsers(searchQuery: string = "") {
  const session = await getSessionUser();
  if (!session || !(await isAdmin(session.id))) throw new Error("Unauthorized");

  let query = supabase
    .from("users")
    .select(`
      id,
      name,
      phone,
      photo_url,
      is_blocked,
      created_at,
      cities ( name_ku )
    `)
    .eq("is_blocked", true)
    .order("created_at", { ascending: false });

  if (searchQuery.trim()) {
    query = query.or(`name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`);
  }

  const { data, error } = await query;
  if (error) console.error("Error fetching blocked users:", error);
  return data || [];
}

export async function toggleBlockUser(id: string, isBlocked: boolean) {
  const session = await getSessionUser();
  if (!session || !(await isAdmin(session.id))) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("users")
    .update({ is_blocked: isBlocked })
    .eq("id", id);
  if (error) throw new Error(error.message);

  // If user is blocked, unapprove their professional profile (if exists)
  if (isBlocked) {
    await supabase
      .from("professionals")
      .update({ is_approved: false })
      .eq("user_id", id);
  }

  return true;
}

export async function updateUser(id: string, formData: {
  name: string;
  phone: string;
  city_id: number;
  photo_url?: string;
}) {
  const session = await getSessionUser();
  if (!session) return { success: false, error: "Unauthorized" };

  // Fetch the current user record to get their old photo_url
  const { data: currentUser } = await supabase
    .from("users")
    .select("photo_url")
    .eq("id", id)
    .single();

  const updateData = {
    name: sanitizeInput(formData.name),
    city_id: formData.city_id,
    photo_url: formData.photo_url
  };

  let query = supabase.from("users").update(updateData).eq("id", id);
  if (!(await isAdmin(session.id))) {
    query = query.eq("id", session.id);
  }

  const { error } = await query;
  if (error) {
    console.error("Error updating user:", error);
    return { success: false, error: error.message };
  }

  // If update succeeded and a new photo was set, delete the old photo from storage
  if (formData.photo_url && currentUser?.photo_url && currentUser.photo_url !== formData.photo_url) {
    await deleteStorageFileByUrl(currentUser.photo_url);
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function toggleFavorite(professionalId: string) {
  const session = await getSessionUser();
  if (!session) return { success: false, error: "Unauthorized" };

  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", session.id)
    .eq("professional_id", professionalId)
    .single();

  if (existing) {
    const { error } = await supabase.from("favorites").delete().eq("id", existing.id);
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase.from("favorites").insert([{ user_id: session.id, professional_id: professionalId }]);
    if (error) return { success: false, error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function addReview(professionalId: string, rating: number, comment: string) {
  const session = await getSessionUser();
  if (!session) return { success: false, error: "Unauthorized" };

  // Can't review yourself
  const { data: prof } = await supabase.from("professionals").select("user_id").eq("id", professionalId).single();
  if (prof?.user_id === session.id) return { success: false, error: "ناتوانیت هەڵسەنگاندن بۆ خۆت بکەیت" };

  // Check if already reviewed
  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("user_id", session.id)
    .eq("professional_id", professionalId)
    .single();

  if (existing) {
    return { success: false, error: "پێشتر هەڵسەنگاندنت کردووە" };
  }

  const { error } = await supabase.from("reviews").insert([{
    user_id: session.id,
    professional_id: professionalId,
    rating,
    comment: sanitizeInput(comment)
  }]);

  if (error) return { success: false, error: error.message };
  
  revalidatePath("/", "layout");
  return { success: true };
}

export async function deleteUser(id: string) {
  const session = await getSessionUser();
  if (!session || !(await isAdmin(session.id))) throw new Error("Unauthorized");

  // 1. Get user photo_url
  const { data: user } = await supabase
    .from("users")
    .select("photo_url")
    .eq("id", id)
    .single();

  // 2. Check if they have a professional profile
  const { data: prof } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", id)
    .single();

  // 3. Delete professional profile if it exists (which also cleans up their storage files!)
  if (prof) {
    await deleteProfessional(prof.id);
  }

  // 4. Delete user from database
  const { error } = await supabase
    .from("users")
    .delete()
    .eq("id", id);
    
  if (error) throw new Error(error.message);

  // 5. Delete user photo from storage
  if (user?.photo_url) {
    await deleteStorageFileByUrl(user.photo_url);
  }

  return true;
}

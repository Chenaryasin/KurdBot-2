"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

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
      categories ( name_ku, icon )
    `)
    .eq("is_approved", true);

  if (cityId) query = query.eq("city_id", parseInt(cityId));
  if (categoryId) query = query.eq("category_id", parseInt(categoryId));
  
  if (searchQuery) {
    const normalizedSearch = normalizeText(searchQuery);
    query = query.or(`name.ilike.%${normalizedSearch}%,phone.ilike.%${normalizedSearch}%`);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) console.error("Error fetching professionals:", error);
  
  return data || [];
}

export async function getProfessionalById(id: string) {
  const { data, error } = await supabase
    .from("professionals")
    .select(`
      id, name, phone, experience_years, photo_url, created_at, telegram_id,
      degree, skills, work_locations,
      city_id, category_id,
      cities ( name_ku ),
      categories ( name_ku, icon )
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching professional details:", error);
    return null;
  }
  
  // Fetch portfolio images
  const { data: images } = await supabase
    .from("portfolio_images")
    .select("id, image_url")
    .eq("professional_id", id)
    .order("created_at", { ascending: false });

  return { ...data, portfolio_images: images || [] };
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
}) {
  const { error } = await supabase.from("professionals").insert([
    {
      ...formData,
      phone: normalizeText(formData.phone), // گۆڕینی ژمارەکان بۆ ئینگلیزی
      is_approved: false, // ئەدمین دەبێت قبوڵی بکات
    },
  ]);

  if (error) {
    console.error("Error registering:", error);
    return { success: false, error: error.message };
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
  const { error } = await supabase
    .from("professionals")
    .update(formData)
    .eq("id", id);

  if (error) {
    console.error("Error updating profile:", error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function addPortfolioImage(professional_id: string, image_url: string) {
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
  const { error } = await supabase
    .from("portfolio_images")
    .delete()
    .eq("id", imageId);

  if (error) {
    console.error("Error deleting portfolio image:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function approveProfessional(id: string) {
  const { error } = await supabase
    .from("professionals")
    .update({ is_approved: true })
    .eq("id", id);
    
  if (error) throw new Error(error.message);
  return true;
}

export async function getPendingProfessionals() {
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

export async function deleteProfessional(id: string) {
  const { error } = await supabase
    .from("professionals")
    .delete()
    .eq("id", id);
    
  if (error) throw new Error(error.message);
  return true;
}

export async function getAdminApprovedProfessionals(searchQuery: string = "") {
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
  const { error } = await supabase.from("messages").insert([
    {
      sender_name: formData.name,
      phone: normalizeText(formData.phone),
      message_text: formData.message,
    },
  ]);

  if (error) {
    console.error("Error sending message:", error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function getMessages() {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) console.error("Error fetching messages:", error);
  return data || [];
}

export async function postAnnouncement(title: string, content: string) {
  const { error } = await supabase.from("announcements").insert([{ title, content }]);
  if (error) {
    console.error("Error posting announcement:", error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function getAdminAnnouncements() {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) console.error("Error fetching admin announcements:", error);
  return data || [];
}

// User Administration
export async function getAdminUsers(searchQuery: string = "") {
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
  const { error } = await supabase
    .from("users")
    .update({ is_blocked: isBlocked })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return true;
}

export async function deleteUser(id: string) {
  const { error } = await supabase
    .from("users")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  return true;
}

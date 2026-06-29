"use server";

import { supabase } from "@/lib/supabase";

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

export async function getProfessionals(cityId?: string, categoryId?: string) {
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

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) console.error("Error fetching professionals:", error);
  
  return data || [];
}

export async function registerProfessional(formData: {
  name: string;
  phone: string;
  experience_years: number;
  city_id: number;
  category_id: number;
  photo_url?: string | null;
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

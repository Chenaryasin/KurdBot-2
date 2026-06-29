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

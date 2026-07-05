"use server";

import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "kurdmaster_super_secret_key_123!";

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

export async function checkPhoneExists(phone: string) {
  const normPhone = normalizeText(phone);
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("phone", normPhone)
    .single();

  if (data) {
    return { exists: true };
  }
  return { exists: false };
}

export async function loginWithPassword(phone: string, password: string) {
  const normPhone = normalizeText(phone);
  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("phone", normPhone)
    .single();

  if (!user || error) {
    return { success: false, error: "هەژمار نەدۆزرایەوە" };
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    return { success: false, error: "وشەی نهێنی هەڵەیە" };
  }

  // Create JWT Token
  const token = jwt.sign(
    { id: user.id, name: user.name, phone: user.phone },
    JWT_SECRET,
    { expiresIn: "30d" }
  );

  // Set Cookie
  const cookieStore = await cookies();
  cookieStore.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });

  return { success: true };
}

export async function registerUser(data: { name: string; phone: string; city_id: number; password: string }) {
  const normPhone = normalizeText(data.phone);
  
  // Check if exists
  const check = await checkPhoneExists(normPhone);
  if (check.exists) {
    return { success: false, error: "ئەم ژمارەیە پێشتر تۆمارکراوە" };
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const { data: newUser, error } = await supabase
    .from("users")
    .insert([{
      name: data.name,
      phone: normPhone,
      city_id: data.city_id,
      password_hash: hashedPassword
    }])
    .select()
    .single();

  if (error || !newUser) {
    console.error("Register Error:", error);
    return { success: false, error: error?.message || "کێشەیەک ڕوویدا" };
  }

  // Auto login
  const token = jwt.sign(
    { id: newUser.id, name: newUser.name, phone: newUser.phone },
    JWT_SECRET,
    { expiresIn: "30d" }
  );

  const cookieStore = await cookies();
  cookieStore.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return { success: true };
}

export async function resetPassword(phone: string, newPassword: string) {
  const normPhone = normalizeText(phone);
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const { error } = await supabase
    .from("users")
    .update({ password_hash: hashedPassword })
    .eq("phone", normPhone);

  if (error) {
    return { success: false, error: "کێشەیەک لە گۆڕینی وشەی نهێنی ڕوویدا" };
  }

  return { success: true };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; name: string; phone: string };
    return decoded;
  } catch (e) {
    return null;
  }
}

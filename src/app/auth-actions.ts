"use server";

import { supabaseServer as supabase } from "@/lib/supabase-server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "kurdmaster_super_secret_key_123!";

function normalizeText(text: string) {
  if (!text) return text;
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  
  let result = text.trim().replace(/\s+/g, '');
  for (let i = 0; i < 10; i++) {
    result = result.split(arabicNumbers[i]).join(i.toString())
                   .split(persianNumbers[i]).join(i.toString());
  }
  
  if (result.startsWith("0")) {
    result = "+964" + result.substring(1);
  } else if (!result.startsWith("+")) {
    result = "+964" + result;
  }
  
  return result;
}

export async function loginWithTelegramData(initData: string) {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!BOT_TOKEN) {
    console.error("TELEGRAM_BOT_TOKEN is missing!");
    return { success: false, error: "Server configuration error" };
  }

  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    if (!hash) return { success: false, error: "Invalid data" };
    
    urlParams.delete('hash');
    
    // Sort params alphabetically and join them
    const params: string[] = [];
    urlParams.forEach((value, key) => {
      params.push(`${key}=${value}`);
    });
    params.sort();
    
    const dataCheckString = params.join('\n');
    
    const secretKey = crypto.createHmac('sha256', 'WebAppData')
      .update(BOT_TOKEN)
      .digest();
      
    const signature = crypto.createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (signature !== hash) {
      return { success: false, error: "Invalid signature" };
    }

    const userStr = urlParams.get('user');
    if (!userStr) return { success: false, error: "No user data" };
    
    const user = JSON.parse(decodeURIComponent(userStr));
    if (!user || !user.id) return { success: false, error: "Invalid user data" };
    
    // Optional: Check auth_date for expiration (e.g. 24 hours)
    const authDate = urlParams.get('auth_date');
    if (authDate) {
      const now = Math.floor(Date.now() / 1000);
      if (now - parseInt(authDate) > 86400) {
        return { success: false, error: "Data expired" };
      }
    }

    // Since signature is valid, we can trust user.id
    return loginWithTelegram(user.id);
  } catch (error) {
    console.error("Error verifying telegram data:", error);
    return { success: false, error: "Verification failed" };
  }
}

export async function loginWithTelegram(telegramId: number) {
  // Check if user exists in the database
  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("telegram_id", telegramId)
    .single();

  if (!user || error) {
    // User does not exist, they need to register
    return { success: true, registered: false, isBlocked: false };
  }

  if (user.is_blocked) {
    return { success: false, registered: true, isBlocked: true };
  }

  // User exists, log them in
  const token = jwt.sign(
    { id: user.id, name: user.name, phone: user.phone, telegram_id: user.telegram_id },
    JWT_SECRET,
    { expiresIn: "30d" }
  );

  const cookieStore = await cookies();
  cookieStore.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });

  return { success: true, registered: true };
}

export async function registerUserWithTelegram(data: { name: string; phone: string; city_id: number; telegram_id: number }) {
  const normPhone = normalizeText(data.phone);
  
  // Check if phone or telegram_id already exists
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .or(`phone.eq.${normPhone},telegram_id.eq.${data.telegram_id}`)
    .single();

  if (existingUser) {
    return { success: false, error: "ئەم ژمارەیە یان ئەم هەژمارەی تیلیگرام پێشتر تۆمارکراوە" };
  }

  // Create new user
  const { data: newUser, error } = await supabase
    .from("users")
    .insert([{
      name: data.name,
      phone: normPhone,
      city_id: data.city_id,
      telegram_id: data.telegram_id,
      password_hash: "telegram_auth" // dummy string as we no longer use passwords
    }])
    .select()
    .single();

  if (error || !newUser) {
    console.error("Register Error:", error);
    return { success: false, error: error?.message || "کێشەیەک ڕوویدا" };
  }

  // Auto login
  const token = jwt.sign(
    { id: newUser.id, name: newUser.name, phone: newUser.phone, telegram_id: newUser.telegram_id },
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

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; name: string; phone: string; telegram_id: number };
    return decoded;
  } catch (e) {
    return null;
  }
}

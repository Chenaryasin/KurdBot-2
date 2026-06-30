"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getProfessionalByTelegramId } from "./actions";

export default function HomePage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    async function checkUser() {
      if (typeof window !== "undefined" && (window as any).Telegram?.WebApp) {
        const tg = (window as any).Telegram.WebApp;
        tg.ready();
        tg.expand();
        const user = tg.initDataUnsafe?.user;
        
        if (user?.id) {
          // Check if admin
          if (user.id === 1932967171) {
            setIsAdmin(true);
          }
          
          // Check if has profile
          try {
            const profile = await getProfessionalByTelegramId(user.id);
            if (profile) {
              setHasProfile(true);
            }
          } catch (e) {
            // Ignore if columns don't exist yet
          }
        }
      }
    }
    checkUser();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 space-y-8 pb-10">
      
      {/* Header section */}
      <div className="text-center w-full">
        <div className="w-24 h-24 bg-blue-100 rounded-[2rem] mx-auto mb-6 flex items-center justify-center shadow-sm">
          <span className="text-4xl">🛠️</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Kurd Master</h1>
        <p className="text-gray-500 text-sm">باشترین پسپۆڕەکانی کوردستان لێرە بدۆزەرەوە</p>
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-sm space-y-4">
        
        <Link 
          href="/search"
          className="w-full bg-blue-600 text-white font-bold py-5 px-6 rounded-2xl flex items-center justify-between shadow-lg shadow-blue-200 active:scale-95 transition-transform"
        >
          <div className="flex flex-col text-right">
            <span className="text-xl">دۆزینەوەی پسپۆڕ</span>
            <span className="text-blue-100 text-xs font-medium">بەدوای وەستادا بگەڕێ بەپێی شار و پیشە</span>
          </div>
          <span className="text-3xl bg-blue-500 p-2 rounded-xl">🔍</span>
        </Link>

        {hasProfile ? (
          <Link 
            href="/profile/edit"
            className="w-full bg-white border-2 border-gray-100 text-gray-800 font-medium py-4 px-6 rounded-2xl flex items-center justify-between shadow-sm active:scale-95 transition-transform"
          >
            <div className="flex flex-col text-right">
              <span className="text-lg text-gray-800">دەستکاریکردنی پڕۆفایل</span>
              <span className="text-xs text-gray-400">زانیاری و وێنەی کارەکانت زیادبکە</span>
            </div>
            <span className="text-2xl bg-gray-50 p-2 rounded-xl">⚙️</span>
          </Link>
        ) : (
          <Link 
            href="/register"
            className="w-full bg-white border-2 border-gray-100 text-gray-800 font-medium py-4 px-6 rounded-2xl flex items-center justify-between shadow-sm active:scale-95 transition-transform"
          >
            <div className="flex flex-col text-right">
              <span className="text-lg text-gray-800">خۆتۆمارکردن</span>
              <span className="text-xs text-gray-400">وەک پسپۆڕ لە بوارێکدا خۆت تۆمار بکە</span>
            </div>
            <span className="text-2xl bg-gray-50 p-2 rounded-xl">💼</span>
          </Link>
        )}

        <Link 
          href="/contact"
          className="w-full bg-white border-2 border-gray-100 text-gray-800 font-medium py-4 px-6 rounded-2xl flex items-center justify-between shadow-sm active:scale-95 transition-transform"
        >
          <div className="flex flex-col text-right">
            <span className="text-lg text-gray-800">پەیوەندیکردن</span>
            <span className="text-xs text-gray-400">ناردنی پەیام بۆ بەڕێوەبەر (ئەدمین)</span>
          </div>
          <span className="text-2xl bg-gray-50 p-2 rounded-xl">✉️</span>
        </Link>

        {/* ئەم بەشە تەنها ئەدمین دەیبینێت */}
        {isAdmin && (
          <Link 
            href="/admin"
            className="w-full mt-4 bg-red-50 border border-red-200 text-red-700 font-medium py-4 px-6 rounded-2xl flex items-center justify-between shadow-sm active:scale-95 transition-transform"
          >
            <div className="flex flex-col text-right">
              <span className="text-lg font-bold">بەشی ئەدمین</span>
              <span className="text-xs text-red-500">پەسەندکردنی وەستاکان</span>
            </div>
            <span className="text-2xl bg-white p-2 rounded-xl border border-red-100">👑</span>
          </Link>
        )}
      </div>

      <div className="mt-auto pt-8 text-xs text-gray-400">
        دروستکراوە بۆ خزمەتی هاوڵاتیان
      </div>
    </div>
  );
}

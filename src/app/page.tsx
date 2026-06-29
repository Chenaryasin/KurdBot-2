"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [username, setUsername] = useState("");

  useEffect(() => {
    // ئەگەر لەناو تیلیگرام بکرێتەوە، دەتوانین ناوی بەکارهێنەر وەربگرین
    if (typeof window !== "undefined" && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      tg.ready();
      tg.expand();
      if (tg.initDataUnsafe?.user) {
        setUsername(tg.initDataUnsafe.user.first_name);
      }
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-b from-blue-50 to-white">
      <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-blue-200">
        <span className="text-4xl">🛠️</span>
      </div>
      
      <h1 className="text-2xl font-bold text-center mb-2 text-gray-800">
        بەخێربێیت {username ? `بەڕێز ${username}` : ""}
      </h1>
      <p className="text-gray-500 text-center mb-10 leading-relaxed text-sm">
        ئەو خزمەتگوزارییەی کە پێویستتە بە ئاسانی بیدۆزەرەوە، یان خۆت وەک پسپۆڕێک تۆمار بکە.
      </p>

      <div className="w-full flex flex-col gap-4">
        <Link 
          href="/search"
          className="w-full bg-blue-600 text-white font-medium py-4 px-6 rounded-2xl flex items-center justify-between shadow-md active:scale-95 transition-transform"
        >
          <div className="flex flex-col text-right">
            <span className="text-lg">دۆزینەوەی پسپۆڕ</span>
            <span className="text-xs text-blue-200">گەڕان بەدوای پسپۆڕ و خزمەتگوزارییەکان</span>
          </div>
          <span className="text-2xl bg-white/20 p-2 rounded-xl">🔍</span>
        </Link>

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
      </div>

      <div className="mt-auto pt-8 text-xs text-gray-400">
        دروستکراوە بۆ خزمەتی هاوڵاتیان
      </div>
    </div>
  );
}

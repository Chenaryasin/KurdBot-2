"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getProfessionalByTelegramId } from "./actions";

export default function HomePage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [username, setUsername] = useState("");

  useEffect(() => {
    async function checkUser() {
      if (typeof window !== "undefined" && (window as any).Telegram?.WebApp) {
        const tg = (window as any).Telegram.WebApp;
        tg.ready();
        tg.expand();
        const user = tg.initDataUnsafe?.user;
        
        if (user) {
          setUsername(user.first_name);
        }
        
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-6 space-y-8 pb-28">
      
      {/* Header section */}
      <div className="text-center w-full mt-4">
        <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-[2rem] mx-auto mb-6 flex items-center justify-center shadow-sm">
          <span className="text-4xl">🛠️</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-2 tracking-tight">Kurd Master</h1>
        
        {username ? (
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">بەخێربێیت، {username} 👋</h2>
        ) : null}
        
        <p className="text-gray-500 dark:text-gray-400 text-sm">باشترین پسپۆڕەکانی کوردستان لێرە بدۆزەرەوە</p>
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-sm space-y-4">
        
        <Link 
          href="/search"
          className="w-full bg-blue-600 dark:bg-blue-600 text-white font-bold py-5 px-6 rounded-2xl flex items-center justify-between shadow-lg shadow-blue-200 dark:shadow-none active:scale-95 transition-transform"
        >
          <div className="flex flex-col text-right">
            <span className="text-xl">دۆزینەوەی پسپۆڕ</span>
            <span className="text-blue-100 text-xs font-medium mt-1">بەدوای وەستادا بگەڕێ بەپێی شار و پیشە</span>
          </div>
          <span className="text-3xl bg-blue-500 p-2 rounded-xl">🔍</span>
        </Link>

        {!hasProfile && (
          <Link 
            href="/register"
            className="w-full bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 font-medium py-4 px-6 rounded-2xl flex items-center justify-between shadow-sm active:scale-95 transition-transform"
          >
            <div className="flex flex-col text-right">
              <span className="text-lg">خۆتۆمارکردن</span>
              <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">وەک پسپۆڕ لە بوارێکدا خۆت تۆمار بکە</span>
            </div>
            <span className="text-2xl bg-gray-50 dark:bg-gray-700 p-2 rounded-xl">💼</span>
          </Link>
        )}

        <Link 
          href="/contact"
          className="w-full bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 font-medium py-4 px-6 rounded-2xl flex items-center justify-between shadow-sm active:scale-95 transition-transform"
        >
          <div className="flex flex-col text-right">
            <span className="text-lg">پەیوەندیکردن بە ئێمە</span>
            <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">پێشنیار یان کێشەکانت بنێرە</span>
          </div>
          <span className="text-2xl bg-gray-50 dark:bg-gray-700 p-2 rounded-xl">💬</span>
        </Link>
      </div>

      {isAdmin && (
        <div className="w-full max-w-sm pt-4 border-t border-gray-200 dark:border-gray-700">
          <Link 
            href="/admin"
            className="w-full bg-gray-900 dark:bg-gray-700 text-white font-medium py-3 rounded-xl flex items-center justify-center shadow-md active:scale-95 transition-transform"
          >
            <span className="ml-2">بەشی ئەدمین</span>
            <span className="text-lg">👑</span>
          </Link>
        </div>
      )}

      <div className="mt-auto pt-8 text-xs text-gray-400">
        دروستکراوە بۆ خزمەتی هاوڵاتیان
      </div>
    </div>
  );
}

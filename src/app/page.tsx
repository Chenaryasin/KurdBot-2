"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Search, Tool } from "lucide-react";
import BannerSlider from "@/components/BannerSlider";

export default function HomePage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [username, setUsername] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function checkUser() {
      try {
        const { getSessionUser } = await import("./auth-actions");
        const user = await getSessionUser();
        if (user) {
          setUsername(user.name);
          
          if (user.role === "admin") { 
            setIsAdmin(true);
          }

          // Check if has professional profile
          const { supabase } = await import("@/lib/supabase");
          const { data } = await supabase
            .from("professionals")
            .select("id")
            .eq("user_id", user.id)
            .single();

          if (data) {
            setHasProfile(true);
          }
        }
      } catch (e) {
        // Ignore
      }
    }
    checkUser();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("searchFilters");
      const currentFilters = saved ? JSON.parse(saved) : {};
      sessionStorage.setItem(
        "searchFilters",
        JSON.stringify({ ...currentFilters, query: searchQuery })
      );
    }
    router.push("/search");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 p-4 pb-28 space-y-4">
      
      {/* Top Header Row */}
      <div className="flex items-center justify-between w-full pt-2 pb-1">
        {/* Right side: Greeting */}
        <div className="flex flex-col text-right">
          <h1 className="text-base font-bold text-gray-800 dark:text-gray-100 flex items-center gap-1">
            سڵاو {username || "بەکارهێنەر"} 👋
          </h1>
          <span className="text-xs text-gray-400 dark:text-gray-500 font-medium mt-0.5">
            بەخێربێیتەوە
          </span>
        </div>

        {/* Left side: Bell Icon (Announcements / Messages) */}
        <Link
          href="/announcements"
          className="w-10 h-10 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-full flex items-center justify-center shadow-sm text-gray-700 dark:text-gray-200 active:scale-95 transition-transform relative"
          aria-label="پەیامەکان"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        </Link>
      </div>

      {/* Banner Image Slider Section */}
      <BannerSlider />

      {/* Search Header & Box Section */}
      <div className="w-full space-y-2">
        <h2 className="text-base md:text-lg font-extrabold text-gray-900 dark:text-gray-100 text-right">
          چ جۆرە خزمەتگوزاریەکت دەوێت؟
        </h2>

        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بەدوای پسپۆڕ یان پیشەدا بگەڕێ..."
            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl py-3.5 pr-11 pl-16 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <button
            type="submit"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold active:scale-95 transition-transform"
          >
            گەڕان
          </button>
        </form>
      </div>

      {/* Action Buttons Section */}
      <div className="w-full space-y-3 pt-2">
        <Link 
          href="/search"
          className="w-full bg-primary text-white font-bold py-4 px-5 rounded-2xl flex items-center justify-between shadow-md shadow-blue-200 dark:shadow-none active:scale-95 transition-transform"
        >
          <div className="flex flex-col text-right">
            <span className="text-lg">دۆزینەوەی پسپۆڕ</span>
            <span className="text-blue-100 text-xs font-medium mt-0.5">بەدوای وەستادا بگەڕێ بەپێی شار و پیشە</span>
          </div>
          <span className="text-2xl bg-blue-500 p-2 rounded-xl">🔍</span>
        </Link>

        <Link 
          href="/contact"
          className="w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 font-medium py-3.5 px-5 rounded-2xl flex items-center justify-between shadow-sm active:scale-95 transition-transform"
        >
          <div className="flex flex-col text-right">
            <span className="text-base font-bold">پەیوەندیکردن بە ئێمە</span>
            <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">پێشنیار یان کێشەکانت بنێرە</span>
          </div>
          <span className="text-xl bg-gray-50 dark:bg-gray-700 p-2 rounded-xl">💬</span>
        </Link>
      </div>

      {isAdmin && (
        <div className="w-full pt-4 border-t border-gray-200 dark:border-gray-700">
          <Link 
            href="/admin"
            className="w-full bg-gray-900 dark:bg-gray-700 text-white font-medium py-3 rounded-xl flex items-center justify-center shadow-md active:scale-95 transition-transform"
          >
            <span className="ml-2 font-bold text-sm">بەشی ئەدمین</span>
            <span className="text-lg">👑</span>
          </Link>
        </div>
      )}

      <div className="mt-auto pt-6 text-center text-xs text-gray-400">
        دروستکراوە بۆ خزمەتی هاوڵاتیان
      </div>
    </div>
  );
}

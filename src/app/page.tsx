"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Search, Layers } from "lucide-react";
import BannerSlider from "@/components/BannerSlider";
import { getCategories } from "./actions";

const QUICK_CATEGORIES = [
  { name: "پزیشک", icon: "🩺", keywords: ["پزیشک", "ددان"] },
  { name: "ئەندازیار", icon: "📐", keywords: ["ئەندازیار"] },
  { name: "پارێزەر", icon: "⚖️", keywords: ["پارێزەر"] },
  { name: "کارەباچی", icon: "⚡", keywords: ["کارەبا"] },
  { name: "بۆریچی", icon: "🔧", keywords: ["بۆڕی", "بۆری"] },
  { name: "تەکسی", icon: "🚕", keywords: ["تەکسی", "شوفێر"] },
  { name: "فۆتۆگرافەر", icon: "📸", keywords: ["فۆتۆ"] },
  { name: "فیتەر", icon: "👨‍🔧", keywords: ["فیتەر", "میکانیک"] },
];

export default function HomePage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [username, setUsername] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const { getSessionUser } = await import("./auth-actions");
        const user = await getSessionUser();
        if (user) {
          setUsername(user.name);
          if (user.role === "admin") {
            setIsAdmin(true);
          }

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

      try {
        const catData = await getCategories();
        setCategories(catData);
      } catch (e) {
        // Ignore
      }
    }
    loadData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "searchFilters",
        JSON.stringify({ city: "", category: "", query: searchQuery })
      );
    }
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const handleQuickCategoryClick = (item: (typeof QUICK_CATEGORIES)[0]) => {
    const matchedCat = categories.find((c) =>
      item.keywords.some((kw) => c.name_ku?.includes(kw))
    );

    const catId = matchedCat ? matchedCat.id.toString() : "";

    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "searchFilters",
        JSON.stringify({ city: "", category: catId, query: "" })
      );
    }

    if (catId) {
      router.push(`/search?category=${catId}`);
    } else {
      router.push(`/search?q=${encodeURIComponent(item.name)}`);
    }
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

        {/* Left side: Bell Icon */}
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

      {/* Quick Categories Grid Section */}
      <div className="w-full pt-1">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-blue-500" />
            بەشە سەرەکییەکان
          </h3>
          <Link
            href="/search"
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            هەمووی ببینە
          </Link>
        </div>

        <div className="grid grid-cols-4 gap-2.5">
          {QUICK_CATEGORIES.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickCategoryClick(cat)}
              className="flex flex-col items-center justify-center p-2.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/80 rounded-2xl shadow-sm hover:shadow-md active:scale-95 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-700/60 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                {cat.icon}
              </div>
              <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 text-center mt-2 truncate w-full">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons Section */}
      <div className="w-full space-y-3 pt-1">
        <Link
          href="/search"
          className="w-full bg-primary text-white font-bold py-4 px-5 rounded-2xl flex items-center justify-between shadow-md shadow-blue-200 dark:shadow-none active:scale-95 transition-transform"
        >
          <div className="flex flex-col text-right">
            <span className="text-lg">دۆزینەوەی پسپۆڕ</span>
            <span className="text-blue-100 text-xs font-medium mt-0.5">
              بەدوای وەستادا بگەڕێ بەپێی شار و پیشە
            </span>
          </div>
          <span className="text-2xl bg-blue-500 p-2 rounded-xl">🔍</span>
        </Link>

        <Link
          href="/contact"
          className="w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 font-medium py-3.5 px-5 rounded-2xl flex items-center justify-between shadow-sm active:scale-95 transition-transform"
        >
          <div className="flex flex-col text-right">
            <span className="text-base font-bold">پەیوەندیکردن بە ئێمە</span>
            <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              پێشنیار یان کێشەکانت بنێرە
            </span>
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

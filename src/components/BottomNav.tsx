"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Settings, MessageSquare, User } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function BottomNav() {
  const pathname = usePathname();
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    async function checkProfile() {
      if (typeof window !== "undefined" && (window as any).Telegram?.WebApp) {
        const tg = (window as any).Telegram.WebApp;
        const tgId = tg.initDataUnsafe?.user?.id?.toString();
        if (tgId) {
          const { data } = await supabase
            .from("professionals")
            .select("id")
            .eq("telegram_id", tgId)
            .single();
          if (data) {
            setProfileId(data.id.toString());
          }
        }
      }
    }
    checkProfile();
  }, []);

  const navItems = [
    {
      name: "پڕۆفایل",
      href: "/my-profile",
      icon: User,
    },
    {
      name: "پەیامەکان",
      href: "/announcements",
      icon: MessageSquare,
    },
    {
      name: "ڕێکخستن",
      href: "/settings",
      icon: Settings,
    },
    {
      name: "سەرەکی",
      href: "/",
      icon: Home,
    },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-50">
      <div className="bg-gray-900 dark:bg-gray-800 rounded-3xl h-16 flex items-center justify-between px-6 shadow-2xl relative">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href || (item.name === "پڕۆفایل" && pathname.startsWith("/profile"));
          const Icon = item.icon;
          
          return (
            <Link
              key={index}
              href={item.href}
              className="relative flex flex-col items-center justify-center w-12 h-full z-10"
            >
              <div 
                className={`transition-all duration-300 absolute flex flex-col items-center justify-center
                  ${isActive ? "-translate-y-6" : "translate-y-0"}`}
              >
                <div className={`p-3 rounded-full flex items-center justify-center transition-colors duration-300
                  ${isActive ? "bg-blue-500 text-white shadow-lg border-4 border-gray-50 dark:border-gray-900" : "bg-transparent text-gray-400"}`}>
                  <Icon size={isActive ? 24 : 22} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

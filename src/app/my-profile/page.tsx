"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function MyProfilePage() {
  const router = useRouter();

  useEffect(() => {
    async function checkProfile() {
      if (typeof window !== "undefined" && (window as any).Telegram?.WebApp) {
        const tg = (window as any).Telegram.WebApp;
        const tgId = tg.initDataUnsafe?.user?.id?.toString();
        
        if (tgId) {
          const { data, error } = await supabase
            .from("professionals")
            .select("id")
            .eq("telegram_id", tgId)
            .single();
            
          if (data && !error) {
            router.replace(`/profile/${data.id}`);
            return;
          }
        }
      }
      
      // If no profile found or not in Telegram, go to register
      router.replace("/register");
    }
    checkProfile();
  }, [router]);

  return (
    <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
}

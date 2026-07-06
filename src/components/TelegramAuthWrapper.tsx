"use client";

import { useEffect, useState } from "react";
import { loginWithTelegram, loginWithTelegramData } from "@/app/auth-actions";
import { useRouter, usePathname } from "next/navigation";

export default function TelegramAuthWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      if (typeof window !== "undefined" && (window as any).Telegram?.WebApp) {
        const tg = (window as any).Telegram.WebApp;
        tg.ready();
        
        let res: any = null;
        
        // 1. Try secure Telegram Data validation
        if (tg.initData) {
          res = await loginWithTelegramData(tg.initData);
        } 
        // 2. Fallback to unsafe validation for local development only
        else if (process.env.NODE_ENV === "development" && tg.initDataUnsafe?.user) {
          console.warn("Using unsafe login for local development");
          res = await loginWithTelegram(tg.initDataUnsafe.user.id);
        }

        if (res && res.success !== false) {
          if (res.isBlocked) {
             setChecking(false);
             document.body.innerHTML = `
               <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background-color:#fef2f2;color:#991b1b;font-family:sans-serif;padding:20px;text-align:center;">
                 <span style="font-size:48px;margin-bottom:16px;">⛔</span>
                 <h1 style="font-size:24px;font-weight:bold;margin-bottom:8px;">هەژمارەکەت ڕاگیراوە</h1>
                 <p style="font-size:16px;color:#7f1d1d;">بەهۆی سەرپێچیکردن لە ڕێنماییەکان، هەژمارەکەت لەلایەن ئەدمینەوە ڕاگیراوە.</p>
               </div>
             `;
             return;
          }

          if (!res.registered) {
             if (pathname !== '/register') {
               router.replace("/register");
             }
          } else {
             if (pathname === '/register') {
               router.replace("/");
             }
          }
        }
      }
      setChecking(false);
    }
    checkAuth();
  }, [pathname, router]);

  if (checking) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <>{children}</>;
}

"use client";

import { useEffect, useState } from "react";
import { loginWithTelegram } from "@/app/auth-actions";
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
        const user = tg.initDataUnsafe?.user;
        
        if (user && user.id) {
          const res = await loginWithTelegram(user.id);
          
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
             // Not registered, redirect to register
             if (pathname !== '/register') {
               router.replace("/register");
             }
          } else {
             // Registered, prevent access to register page
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

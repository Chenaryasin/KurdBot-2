"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { User, Phone, LogOut, Briefcase } from "lucide-react";
import { logout } from "../auth-actions";

export default function MyProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const { getSessionUser } = await import("../auth-actions");
        const sessionUser = await getSessionUser();
        
        if (sessionUser) {
          setUser(sessionUser);
          
          const { data } = await supabase
            .from("professionals")
            .select("id")
            .eq("user_id", sessionUser.id)
            .single();
            
          if (data) {
            setProfessionalId(data.id.toString());
          }
        } else {
          router.replace("/login");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  const handleLogout = async () => {
    if (confirm("دڵنیایت لە دەرچوون لە هەژمارەکەت؟")) {
      await logout();
      router.push("/login");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 pb-28">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 pt-8 pb-6 px-4 shadow-sm rounded-b-3xl relative">
        <div className="absolute top-4 right-4">
          <Link href="/" className="w-10 h-10 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center shadow-sm text-xl border border-gray-100 dark:border-gray-600 active:scale-95 transition-transform">
            🔙
          </Link>
        </div>
        <div className="flex flex-col items-center mt-6">
          <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-[2rem] flex items-center justify-center shadow-sm border border-blue-200 dark:border-blue-800 text-4xl mb-4 text-blue-500">
            👤
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">{user.name}</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium" dir="ltr">{user.phone}</p>
        </div>
      </div>

      <div className="px-4 mt-8 space-y-4">
        
        {professionalId ? (
          <Link 
            href={`/profile/${professionalId}`}
            className="w-full bg-white dark:bg-gray-800 border-2 border-blue-100 dark:border-blue-900/30 text-gray-800 dark:text-gray-200 font-medium py-4 px-6 rounded-2xl flex items-center justify-between shadow-sm active:scale-95 transition-transform"
          >
            <div className="flex flex-col text-right">
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">پڕۆفایلی وەستایەتی</span>
              <span className="text-xs text-gray-500 mt-1">بینین و دەستکاریکردنی زانیارییەکانت وەک پسپۆڕ</span>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-xl text-blue-500">
              <Briefcase size={24} />
            </div>
          </Link>
        ) : (
          <Link 
            href="/become-professional"
            className="w-full bg-blue-600 dark:bg-blue-600 text-white font-bold py-5 px-6 rounded-2xl flex items-center justify-between shadow-lg shadow-blue-200 dark:shadow-none active:scale-95 transition-transform"
          >
            <div className="flex flex-col text-right">
              <span className="text-xl">وەک پسپۆڕ خۆت تۆماربکە</span>
              <span className="text-blue-100 text-xs font-medium mt-1">زانیارییەکانت تۆماربکە بۆ ئەوەی خەڵک بتدۆزێتەوە</span>
            </div>
            <div className="bg-blue-500 p-3 rounded-xl">
              <Briefcase size={24} />
            </div>
          </Link>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mt-6">
          <div className="p-4 flex items-center justify-between border-b border-gray-50 dark:border-gray-700">
            <div className="flex flex-col text-right">
              <span className="text-sm font-bold text-gray-800 dark:text-gray-200">ناوی تەواو</span>
              <span className="text-xs text-gray-500 mt-1">{user.name}</span>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl text-gray-400">
              <User size={20} />
            </div>
          </div>
          
          <div className="p-4 flex items-center justify-between">
            <div className="flex flex-col text-right">
              <span className="text-sm font-bold text-gray-800 dark:text-gray-200">ژمارەی مۆبایل</span>
              <span className="text-xs text-gray-500 mt-1" dir="ltr">{user.phone}</span>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl text-gray-400">
              <Phone size={20} />
            </div>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="w-full mt-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-sm border border-red-100 dark:border-red-900/30 active:scale-95 transition-transform"
        >
          <LogOut size={20} />
          <span>دەرچوون (Logout)</span>
        </button>

      </div>
    </div>
  );
}

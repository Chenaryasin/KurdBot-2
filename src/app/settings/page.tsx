"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 p-4 pb-28">
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6 mt-2">ڕێکخستنەکان</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="font-bold text-gray-700 dark:text-gray-300 mb-4 border-b border-gray-100 dark:border-gray-700 pb-3">دۆخی ڕووناکی ڕووکار</h2>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setTheme("light")}
            className={`flex items-center gap-4 p-4 rounded-2xl transition-colors ${theme === "light" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800" : "bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 border border-transparent"}`}
          >
            <Sun size={24} />
            <span className="font-bold">دۆخی ڕووناک (Light)</span>
          </button>
          
          <button
            onClick={() => setTheme("dark")}
            className={`flex items-center gap-4 p-4 rounded-2xl transition-colors ${theme === "dark" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800" : "bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 border border-transparent"}`}
          >
            <Moon size={24} />
            <span className="font-bold">دۆخی تاریک (Dark)</span>
          </button>

          <button
            onClick={() => setTheme("system")}
            className={`flex items-center gap-4 p-4 rounded-2xl transition-colors ${theme === "system" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800" : "bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 border border-transparent"}`}
          >
            <Monitor size={24} />
            <span className="font-bold">بەپێی سیستەم (System)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

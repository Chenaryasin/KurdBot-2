"use client";

import { useState, useEffect } from "react";
import { registerUserWithTelegram } from "../auth-actions";
import { getCities } from "../actions";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [cities, setCities] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    city_id: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [telegramId, setTelegramId] = useState<number | null>(null);
  const [isTelegram, setIsTelegram] = useState(false);
  const [isPhoneShared, setIsPhoneShared] = useState(false);

  useEffect(() => {
    getCities().then(setCities);
    
    if (typeof window !== "undefined" && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      tg.ready();
      
      // If initData is present, we are inside a real Telegram App
      if (tg.initData) {
        setIsTelegram(true);
      }
      
      const user = tg.initDataUnsafe?.user;
      if (user?.id) {
        setTelegramId(user.id);
        if (user.first_name) {
          setFormData(prev => ({ ...prev, name: `${user.first_name} ${user.last_name || ""}`.trim() }));
        }
      }
    }
  }, []);

  const handleRequestContact = () => {
    if (typeof window !== "undefined" && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      tg.requestContact((shared: boolean, response: any) => {
        if (shared) {
          const contactPhone = response?.responseUnsafe?.contact?.phone_number;
          if (contactPhone) {
            setFormData(prev => ({ ...prev, phone: contactPhone }));
            setIsPhoneShared(true);
            setError("");
          } else {
            setError("کێشە لە خوێندنەوەی ژمارەکەت ڕوویدا لە تێلێگرامەوە.");
          }
        } else {
          setError("پێویستە ژمارەکەت هاوبەش بکەیت بۆ بەردەوامبوون.");
        }
      });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telegramId) {
      setError("کێشە لە پەیوەندی بە تیلیگرامەوە هەیە. تکایە ئەپەکە لەناو تیلیگرام بکەرەوە.");
      return;
    }
    
    setLoading(true);
    setError("");

    const result = await registerUserWithTelegram({
      name: formData.name,
      phone: formData.phone,
      city_id: parseInt(formData.city_id),
      telegram_id: telegramId
    });

    if (result.success) {
      router.push("/");
    } else {
      setError(result.error || "کێشەیەک ڕوویدا");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-6 relative">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-[2rem] shadow-xl p-8 border border-gray-100 dark:border-gray-700">
        
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-[1.5rem] flex items-center justify-center shadow-inner border border-blue-200 dark:border-blue-800">
            <span className="text-4xl">📝</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100 mb-2">دروستکردنی هەژمار</h1>
        <p className="text-gray-500 dark:text-gray-400 text-center mb-8 text-sm">
          تکایە زانیارییەکانت پڕبکەرەوە بۆ بەکارهێنانی ئەپەکە
        </p>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm font-medium mb-6 text-center border border-red-100 dark:border-red-900/30">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 px-1">ناوی تەواو</label>
            <input 
              required
              type="text"
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-gray-900 dark:text-gray-100"
              placeholder="نمونە: ئەحمەد"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 px-1">ژمارەی مۆبایل</label>
            {isTelegram ? (
              isPhoneShared ? (
                <div className="w-full bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/30 rounded-2xl p-4 flex items-center justify-between text-green-700 dark:text-green-400">
                  <span className="font-mono text-lg" dir="ltr">{formData.phone}</span>
                  <span className="flex items-center gap-1.5 text-sm font-bold bg-green-100 dark:bg-green-900/40 px-3 py-1 rounded-full">
                    ✓ پشتڕاستکراوە
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestContact}
                  className="w-full bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold py-4 px-6 rounded-2xl border border-dashed border-blue-300 dark:border-blue-800 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                >
                  <span>📱 هاوبەشکردنی ژمارەی تێلێگرامەکەم</span>
                </button>
              )
            ) : (
              <input 
                required
                type="tel"
                dir="ltr"
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-right text-gray-900 dark:text-gray-100"
                placeholder="0750 123 4567"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 px-1">شار</label>
            <select 
              required
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-gray-900 dark:text-gray-100"
              value={formData.city_id}
              onChange={(e) => setFormData({...formData, city_id: e.target.value})}
            >
              <option value="">هەڵبژێرە...</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>{c.name_ku}</option>
              ))}
            </select>
          </div>

          <button 
            type="submit" 
            disabled={loading || (isTelegram && !isPhoneShared)}
            className="mt-4 w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 dark:shadow-none active:scale-95 transition-transform disabled:opacity-70"
          >
            {loading ? "چاوەڕێ بکە..." : "دروستکردنی هەژمار"}
          </button>
        </form>
      </div>
    </div>
  );
}

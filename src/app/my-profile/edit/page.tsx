"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Camera } from "lucide-react";

export default function EditUserProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [cityId, setCityId] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [cities, setCities] = useState<any[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const { getSessionUser } = await import("../../auth-actions");
        const sessionUser = await getSessionUser();
        if (!sessionUser) {
          router.replace("/");
          return;
        }

        setUserId(sessionUser.id);

        const { data: userData } = await supabase
          .from("users")
          .select("*")
          .eq("id", sessionUser.id)
          .single();

        if (userData) {
          setName(userData.name || "");
          setPhone(userData.phone || "");
          setCityId(userData.city_id ? userData.city_id.toString() : "");
          setPhotoUrl(userData.photo_url || "");
        }

        const { data: citiesData } = await supabase.from("cities").select("*");
        if (citiesData) setCities(citiesData);

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("قەبارەی وێنەکە نابێت لە ٥ مێگابایت زیاتر بێت");
      return;
    }

    try {
      setUploadingImage(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `user_${userId}_${Math.random()}.${fileExt}`;
      const filePath = `user_profiles/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("profiles")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("profiles")
        .getPublicUrl(filePath);

      setPhotoUrl(data.publicUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("کێشەیەک ڕوویدا لە بارکردنی وێنەکە");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({
          name,
          phone,
          city_id: parseInt(cityId),
          photo_url: photoUrl
        })
        .eq("id", userId);

      if (error) throw error;
      
      router.push("/my-profile");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("کێشەیەک ڕوویدا لە سەیڤکردنی زانیارییەکان");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">چاوەڕێ بکە...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 pb-28">
      <div className="flex items-center gap-3 mb-6 mt-2">
        <Link href="/my-profile" className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm text-xl border border-gray-100 dark:border-gray-700 flex-shrink-0 active:scale-95 transition-transform">
          🔙
        </Link>
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">دەستکاریکردنی پڕۆفایل</h1>
      </div>

      <form onSubmit={handleSave} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 flex flex-col gap-5">
        
        {/* Profile Image Upload */}
        <div className="flex flex-col items-center mb-2">
          <div className="relative w-28 h-28">
            <div className="w-full h-full bg-blue-50 dark:bg-blue-900/30 rounded-[2rem] flex items-center justify-center shadow-inner border-4 border-white dark:border-gray-800 overflow-hidden relative group">
              {photoUrl ? (
                <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl text-blue-300">👤</span>
              )}
              {uploadingImage && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-3 rounded-xl shadow-lg border-2 border-white dark:border-gray-800 hover:bg-blue-700 active:scale-95 transition-all"
            >
              <Camera size={20} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
          <p className="text-xs text-gray-400 mt-4 text-center">بۆ گۆڕینی وێنەکە کلیک لە هێمای کامێراکە بکە</p>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">ناوی سیانی</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" 
            required 
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">ژمارە مۆبایل</label>
          <input 
            type="text" 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)} 
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" 
            dir="ltr"
            required 
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">شار</label>
          <select 
            value={cityId} 
            onChange={(e) => setCityId(e.target.value)} 
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" 
            required
          >
            <option value="">-- هەڵبژێرە --</option>
            {cities.map(city => (
              <option key={city.id} value={city.id}>{city.name_ku}</option>
            ))}
          </select>
        </div>

        <button 
          type="submit" 
          disabled={saving || uploadingImage} 
          className="w-full mt-4 bg-blue-600 text-white font-bold py-4 rounded-xl shadow-md active:scale-95 transition-transform disabled:opacity-70 disabled:active:scale-100 flex justify-center items-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>چاوەڕێ بکە...</span>
            </>
          ) : (
            "سەیڤکردنی زانیارییەکان"
          )}
        </button>
      </form>
    </div>
  );
}

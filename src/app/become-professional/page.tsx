"use client";

import { useState, useEffect, useCallback } from "react";
import { getCities, getCategories, registerProfessional } from "../actions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import imageCompression from 'browser-image-compression';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '@/lib/cropImage';
import { showAlert } from "@/lib/alerts";

export default function RegisterPage() {
  const router = useRouter();
  const [cities, setCities] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    experience_years: "",
    city_id: "",
    category_id: "",
    degree: "",
    skills: "",
    work_locations: ""
  });
  const [file, setFile] = useState<File | null>(null);
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [telegramId, setTelegramId] = useState<string>("");
  const [userId, setUserId] = useState<number | null>(null);

  // Cropper states
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const imageDataUrl = await readFile(file);
      setImageSrc(imageDataUrl as string);
    }
  };

  const readFile = (file: File) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(reader.result), false);
      reader.readAsDataURL(file);
    });
  };

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels);
      setFile(croppedFile);
      setPreviewSrc(URL.createObjectURL(croppedFile));
      setImageSrc(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancel = async () => {
    if (uploadedImages.length > 0) {
      setLoading(true);
      try {
        const { deleteStorageFileByUrl } = await import("../actions");
        for (const url of uploadedImages) {
          await deleteStorageFileByUrl(url);
        }
      } catch (err) {
        console.error("Cleanup uploaded files error:", err);
      }
    }
    router.back();
  };

  const handleUploadPortfolio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    try {
      setUploadingPortfolio(true);
      
      const options = {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `portfolio/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from("profiles")
        .upload(filePath, compressedFile);
        
      if (error) throw error;
      
      const { data: urlData } = supabase.storage
        .from("profiles")
        .getPublicUrl(filePath);
        
      setPortfolioImages(prev => [...prev, urlData.publicUrl]);
      setUploadedImages(prev => [...prev, urlData.publicUrl]);
    } catch (error: any) {
      showAlert("کێشە لە بارکردنی وێنەی کارەکەتدا هەیە: " + error.message);
    } finally {
      setUploadingPortfolio(false);
    }
  };

  const handleDeletePortfolioImage = async (url: string) => {
    setPortfolioImages(prev => prev.filter(imgUrl => imgUrl !== url));
    try {
      const { deleteStorageFileByUrl } = await import("../actions");
      await deleteStorageFileByUrl(url);
      setUploadedImages(prev => prev.filter(imgUrl => imgUrl !== url));
    } catch (e) {
      console.error("Delete uploaded image error:", e);
    }
  };

  useEffect(() => {
    async function loadData() {
      const { getSessionUser } = await import("../auth-actions");
      const user = await getSessionUser();
      if (user) {
        setUserId(user.id);
        setFormData(prev => ({ ...prev, name: user.name, phone: user.phone }));

        // Redirect if already registered/pending/suspended as professional
        const { data: existingProf } = await supabase
          .from("professionals")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (existingProf) {
          router.replace("/my-profile");
          return;
        }
      }
      
      if (typeof window !== "undefined" && (window as any).Telegram?.WebApp) {
        const tg = (window as any).Telegram.WebApp;
        tg.ready();
        const tgUser = tg.initDataUnsafe?.user;
        if (tgUser?.id) {
          setTelegramId(tgUser.id.toString());
        }
      }
      
      setCities(await getCities());
      setCategories(await getCategories());
    }
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let photo_url = null;

    if (file) {
      const options = {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data, error } = await supabase.storage.from('profiles').upload(fileName, compressedFile);
      
      if (!error && data) {
        photo_url = supabase.storage.from('profiles').getPublicUrl(fileName).data.publicUrl;
      } else {
        showAlert("کێشەیەک لە وێنەکەدا هەیە: " + (error?.message || "نەتوانرا ئەپلۆد بکرێت"));
        setLoading(false);
        return;
      }
    }
    let tgId = null;
    if (typeof window !== "undefined" && (window as any).Telegram?.WebApp) {
      tgId = (window as any).Telegram.WebApp.initDataUnsafe?.user?.id;
    }

    const result = await registerProfessional({
      name: formData.name,
      phone: formData.phone,
      experience_years: parseInt(formData.experience_years || "0"),
      city_id: parseInt(formData.city_id),
      category_id: parseInt(formData.category_id),
      photo_url: photo_url,
      telegram_id: tgId,
      user_id: userId,
      degree: formData.degree || undefined,
      skills: formData.skills || undefined,
      work_locations: formData.work_locations || undefined,
      portfolio_images: portfolioImages
    });

    setLoading(false);
    if (result.success) {
      setUploadedImages([]); // Clear uploaded tracking state so cancel handler doesn't delete them
      setSuccess(true);
    } else {
      showAlert(result.error || "کێشەیەک ڕوویدا لە کاتی ناردنی زانیارییەکان. تکایە دووبارە هەوڵ بدەرەوە.");
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-green-50">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-200">
          <span className="text-4xl text-white">✓</span>
        </div>
        <h1 className="text-2xl font-bold text-center mb-2 text-gray-800">سەرکەوتوو بوو!</h1>
        <p className="text-gray-500 text-center mb-8 leading-relaxed text-sm">
          زانیارییەکانت بە سەرکەوتوویی نێردرا بۆ ئەدمین. پاش پێداچوونەوە لەبەشی گەڕان بۆ بەکارهێنەران دەردەکەوێت.
        </p>
        <button 
          onClick={() => router.push("/")}
          className="bg-green-600 text-white font-medium py-3 px-8 rounded-xl shadow-md active:scale-95 transition-transform"
        >
          گەڕانەوە بۆ سەرەتا
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 p-4 pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 mt-2">
        <button type="button" onClick={handleCancel} className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm text-xl border border-gray-100 dark:border-gray-700 active:scale-95 transition-transform">
          🔙
        </button>
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">خۆتۆمارکردن</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-4">
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ناوی تەواو یان ناوی کلینیک</label>
          <input 
            required
            type="text"
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 outline-none focus:border-blue-500 transition-colors text-gray-900 dark:text-gray-100"
            placeholder="نمونە: وەستا دارا"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ژمارەی مۆبایل</label>
          <input 
            required
            readOnly
            type="tel"
            dir="ltr"
            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 outline-none cursor-not-allowed text-right text-gray-400 dark:text-gray-500"
            value={formData.phone}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">چەند ساڵ ئەزموونت هەیە؟</label>
          <select 
            required
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 outline-none focus:border-blue-500 transition-colors text-gray-900 dark:text-gray-100"
            value={formData.experience_years}
            onChange={(e) => setFormData({...formData, experience_years: e.target.value})}
          >
            <option value="">هەڵبژێرە...</option>
            {Array.from({ length: 51 }, (_, i) => (
              <option key={i} value={i.toString()}>{i} ساڵ</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">شار</label>
          <select 
            required
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 outline-none focus:border-blue-500 transition-colors text-gray-900 dark:text-gray-100"
            value={formData.city_id}
            onChange={(e) => setFormData({...formData, city_id: e.target.value})}
          >
            <option value="">هەڵبژێرە...</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>{c.name_ku}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">پیشە</label>
          <select 
            required
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 outline-none focus:border-blue-500 transition-colors text-gray-900 dark:text-gray-100"
            value={formData.category_id}
            onChange={(e) => setFormData({...formData, category_id: e.target.value})}
          >
            <option value="">هەڵبژێرە...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.name_ku}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
            <span>🎓 بڕوانامە</span>
            <span className="text-xs font-normal text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">ئارەزوومەندانە</span>
          </label>
          <input 
            type="text"
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 outline-none focus:border-blue-500 transition-colors text-gray-900 dark:text-gray-100 placeholder-gray-400"
            placeholder="نموونە: بەکالۆریۆس لە تەلارسازی"
            value={formData.degree}
            onChange={(e) => setFormData({...formData, degree: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
            <span>🛠️ شارەزاییەکانت</span>
            <span className="text-xs font-normal text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">ئارەزوومەندانە</span>
          </label>
          <textarea 
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 outline-none focus:border-blue-500 transition-colors text-gray-900 dark:text-gray-100 placeholder-gray-400 resize-none"
            placeholder="نموونە: بۆیاخکردن، دیکۆراتی ناوەوە..."
            rows={3}
            value={formData.skills}
            onChange={(e) => setFormData({...formData, skills: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
            <span>📍 شوێنی کارکردنت</span>
            <span className="text-xs font-normal text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">ئارەزوومەندانە</span>
          </label>
          <input 
            type="text"
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 outline-none focus:border-blue-500 transition-colors text-gray-900 dark:text-gray-100 placeholder-gray-400"
            placeholder="نموونە: سلێمانی، هەولێر"
            value={formData.work_locations}
            onChange={(e) => setFormData({...formData, work_locations: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">وێنەی پڕۆفایل (ئارەزوومەندانە)</label>
          <div className="flex flex-col gap-3">
            {previewSrc && (
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-blue-500 shadow-sm mx-auto">
                <img src={previewSrc} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="relative">
               <input 
                 type="file"
                 accept="image/*"
                 onChange={onFileChange}
                 className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 outline-none focus:border-blue-500 transition-colors text-gray-900 dark:text-gray-100 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50 cursor-pointer"
               />
            </div>
          </div>
        </div>

        {/* Portfolio Images Upload Section */}
        <div className="mt-2 flex flex-col gap-3 border-t border-gray-100 dark:border-gray-700 pt-4">
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
            <span>📸 وێنەی کارەکانت (پۆرتفۆلیۆ - ئارەزوومەندانە)</span>
          </label>
          <p className="text-xs text-gray-400 dark:text-gray-500">وێنەی کارەکانت باربکە بۆ ئەوەی خەڵک و ئەدمین کارەکانت ببینن.</p>

          <div className="grid grid-cols-3 gap-2 mt-2">
            {portfolioImages.map((url, idx) => (
              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 group">
                <img src={url} alt="Work" className="w-full h-full object-cover" />
                <button 
                  type="button"
                  onClick={() => handleDeletePortfolioImage(url)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity text-xs"
                >
                  ✕
                </button>
              </div>
            ))}
            
            <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              {uploadingPortfolio ? (
                <span className="text-[10px] font-bold text-center">باردەکات...</span>
              ) : (
                <>
                  <span className="text-2xl mb-1">+</span>
                  <span className="text-[10px] font-bold text-center px-1">وێنە زیادبکە</span>
                </>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleUploadPortfolio} disabled={uploadingPortfolio} />
            </label>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="mt-6 w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-md active:scale-95 transition-transform disabled:opacity-70"
        >
          {loading ? "چاوەڕێ بکە..." : "خۆتۆمارکردن"}
        </button>

      </form>

      {/* Cropper Modal */}
      {imageSrc && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          <div className="relative flex-1">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>
          <div className="p-6 bg-white dark:bg-gray-900 flex justify-between items-center z-[100] rounded-t-3xl border-t border-gray-100 dark:border-gray-800 pb-10">
            <button 
              type="button"
              onClick={() => setImageSrc(null)}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl font-bold active:scale-95 transition-transform"
            >
              هەڵوەشاندنەوە
            </button>
            <button 
              type="button"
              onClick={handleCropSave}
              className="px-8 py-3 bg-blue-600 dark:bg-blue-600 text-white rounded-xl font-bold shadow-md active:scale-95 transition-transform"
            >
              بڕین و پاشەکەوت
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

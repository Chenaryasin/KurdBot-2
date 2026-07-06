"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { 
  getProfessionalByTelegramId, 
  getProfessionalById, 
  updateProfessionalProfile, 
  addPortfolioImage,
  getCities,
  getCategories 
} from "../../../actions";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import Cropper from 'react-easy-crop';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EditProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  
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
  
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [photoUrl, setPhotoUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert("قەبارەی وێنەکە نابێت لە ٥ مێگابایت زیاتر بێت");
        return;
      }
      const reader = new FileReader();
      reader.addEventListener('load', () => setImageSrc(reader.result?.toString() || null));
      reader.readAsDataURL(file);
    }
  };

  const handleCropSave = async () => {
    if (!imageSrc || !croppedAreaPixels || !profile) return;

    try {
      setUploadingImage(true);
      const { getCroppedImg } = await import('@/lib/cropImage');
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels);

      const fileExt = "jpg";
      const fileName = `user_${profile.user_id}_${Math.random()}.${fileExt}`;
      const filePath = `user_profiles/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("profiles")
        .upload(filePath, croppedFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("profiles")
        .getPublicUrl(filePath);

      setPhotoUrl(data.publicUrl);
      setImageSrc(null); // close cropper
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("کێشەیەک ڕوویدا لە بارکردنی وێنەکە");
    } finally {
      setUploadingImage(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      // Load filters
      setCities(await getCities());
      setCategories(await getCategories());

      // Check auth & load profile
      if (typeof window !== "undefined" && (window as any).Telegram?.WebApp) {
        const tg = (window as any).Telegram.WebApp;
        tg.ready();
        const user = tg.initDataUnsafe?.user;
        
        let isAuthorized = false;
        
        if (id) {
          const fullProfile = await getProfessionalById(id as string);
          
          if (fullProfile) {
            setProfile(fullProfile);
            setFormData({
              name: fullProfile.name || "",
              phone: fullProfile.phone || "",
              experience_years: fullProfile.experience_years?.toString() || "",
              city_id: fullProfile.city_id?.toString() || "",
              category_id: fullProfile.category_id?.toString() || "",
              degree: fullProfile.degree || "",
              skills: fullProfile.skills || "",
              work_locations: fullProfile.work_locations || ""
            });
            setPhotoUrl(fullProfile.photo_url || "");
            
            if (user?.id) {
              const tgId = user.id.toString();
              // Admin logic
              if (tgId === "1932967171") {
                isAuthorized = true;
              } else if (fullProfile.telegram_id && fullProfile.telegram_id.toString() === tgId) {
                // Owner logic
                isAuthorized = true;
              }
            }
          }
        }
        
        setAuthorized(isAuthorized);
      }
      setLoading(false);
    }
    loadData();
  }, [id]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    
    const updateData: any = {
      name: formData.name,
      phone: formData.phone,
      degree: formData.degree,
      skills: formData.skills,
      work_locations: formData.work_locations,
      photo_url: photoUrl
    };

    if (formData.experience_years) updateData.experience_years = parseInt(formData.experience_years);
    if (formData.city_id) updateData.city_id = parseInt(formData.city_id);
    if (formData.category_id) updateData.category_id = parseInt(formData.category_id);

    const res = await updateProfessionalProfile(profile.id, updateData);
    if (res.success) {
      alert("زانیارییەکان بە سەرکەوتوویی نوێکرانەوە!");
    } else {
      alert("کێشەیەک ڕوویدا لە نوێکردنەوە.");
    }
    setSaving(false);
  };

  const handleUploadPortfolio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !profile) return;
    const file = e.target.files[0];
    
    if (file.size > 5 * 1024 * 1024) {
      alert("قەبارەی وێنەکە نابێت لە ٥ مێگابایت زیاتر بێت!");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `portfolio_${profile.id}_${Math.random()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('portfolio')
        .upload(fileName, file);

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('portfolio')
        .getPublicUrl(fileName);

      const imageUrl = publicUrlData.publicUrl;
      
      await addPortfolioImage(profile.id, imageUrl);
      
      // Refresh profile
      const updatedProfile = await getProfessionalById(profile.id);
      setProfile(updatedProfile);
      
    } catch (error: any) {
      alert("کێشە لە ئەپلۆدکردندا: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500 bg-gray-50 dark:bg-gray-900">خەریکی هێنانە...</div>;
  }

  if (!authorized || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50 dark:bg-gray-900">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">دەسەڵاتت نییە!</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">تۆ ناتوانیت دەستکاری ئەم پڕۆفایلە بکەیت.</p>
        <button onClick={() => router.back()} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold">گەڕانەوە</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 p-4 pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 mt-2">
        <button onClick={() => router.back()} className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm text-xl border border-gray-100 dark:border-gray-700 flex-shrink-0 active:scale-95 transition-transform">
          🔙
        </button>
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">دەستکاریکردنی پڕۆفایل</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-5">
        
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
        {/* Core Info */}
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">ناوی تەواو</label>
          <input 
            type="text" 
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">ژمارەی مۆبایل</label>
          <input 
            type="tel" 
            dir="ltr"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">پیشە</label>
          <select 
            value={formData.category_id}
            onChange={(e) => setFormData({...formData, category_id: e.target.value})}
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled>پیشەیەک هەڵبژێرە</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.icon} {cat.name_ku}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">شار</label>
          <select 
            value={formData.city_id}
            onChange={(e) => setFormData({...formData, city_id: e.target.value})}
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled>شارێک هەڵبژێرە</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>{city.name_ku}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">چەند ساڵ ئەزموونت هەیە؟</label>
          <input 
            type="number" 
            min="0"
            value={formData.experience_years}
            onChange={(e) => setFormData({...formData, experience_years: e.target.value})}
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
          />
        </div>

        {/* Texts */}
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">🎓 بڕوانامە</label>
          <textarea 
            rows={3}
            placeholder="بۆ نمونە: دبلۆم لە تەکنەلۆژیا"
            value={formData.degree}
            onChange={(e) => setFormData({...formData, degree: e.target.value})}
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">🛠️ شارەزاییەکان</label>
          <textarea 
            rows={3}
            placeholder="شارەزاییت لە چییە؟ باسی بکە..."
            value={formData.skills}
            onChange={(e) => setFormData({...formData, skills: e.target.value})}
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">🏢 شوێنەکانی کارکردن</label>
          <textarea 
            rows={3}
            placeholder="بۆ نمونە: ناو بازاڕ، گەڕەکی بەختیاری..."
            value={formData.work_locations}
            onChange={(e) => setFormData({...formData, work_locations: e.target.value})}
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <button 
          onClick={handleSave}
          disabled={saving}
          className={`w-full text-white font-bold py-4 rounded-xl mt-2 transition-all ${
            saving ? "bg-gray-400 dark:bg-gray-600" : "bg-blue-600 dark:bg-blue-600 active:scale-95 shadow-md shadow-blue-200 dark:shadow-none"
          }`}
        >
          {saving ? "خەریکە..." : "پاشەکەوتکردنی زانیارییەکان"}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 mt-6 flex flex-col gap-4">
        <h2 className="font-bold text-gray-800 dark:text-gray-100 text-lg flex justify-between items-center">
          <span>📸 وێنەی کارەکانت (پۆرتفۆلیۆ)</span>
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">وێنەی ئەو کارانە دابنێ کە پێشتر کردووتە بۆ ئەوەی خەڵک زیاتر متمانەت پێ بکات.</p>

        <div className="grid grid-cols-3 gap-2 mt-2">
          {profile.portfolio_images?.map((img: any) => (
            <div key={img.id} className="aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              <img src={img.image_url} alt="Work" className="w-full h-full object-cover" />
            </div>
          ))}
          
          <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            {uploading ? (
              <span className="text-xs font-bold">چاوەڕێ...</span>
            ) : (
              <>
                <span className="text-2xl mb-1">+</span>
                <span className="text-xs font-bold text-center px-1">وێنە زیادبکە</span>
              </>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleUploadPortfolio} disabled={uploading} />
          </label>
        </div>
      </div>

      {/* Cropper Modal */}
      {imageSrc && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black">
          <div className="flex-1 relative">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={1}
              aspect={1}
              cropShape="round"
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className="p-4 bg-gray-900 flex gap-4 pb-8">
            <button
              onClick={() => setImageSrc(null)}
              className="flex-1 bg-gray-700 text-white py-3 rounded-xl font-bold"
            >
              پاشگەزبوونەوە
            </button>
            <button
              onClick={handleCropSave}
              className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold"
            >
              بڕین و دانان
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

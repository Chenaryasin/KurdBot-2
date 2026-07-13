"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { 
  getProfessionalByTelegramId, 
  getProfessionalById, 
  updateProfessionalProfile, 
  addPortfolioImage,
  deletePortfolioImage,
  getCities,
  getCategories 
} from "../../../actions";
import { createClient } from "@supabase/supabase-js";
import { useParams, useRouter } from "next/navigation";
import { showAlert, showConfirm } from "@/lib/alerts";
import { Camera } from "lucide-react";
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '@/lib/cropImage';
import imageCompression from 'browser-image-compression';

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
  
  const [pendingAddImages, setPendingAddImages] = useState<string[]>([]);
  const [pendingDeleteImages, setPendingDeleteImages] = useState<number[]>([]);

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
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        showAlert("قەبارەی وێنەکە نابێت لە ٥ مێگابایت زیاتر بێت");
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

      const options = {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(croppedFile as File, options);

      const fileExt = "jpg";
      const fileName = `user_${profile.user_id}_${Math.random()}.${fileExt}`;
      const filePath = `user_profiles/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("profiles")
        .upload(filePath, compressedFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("profiles")
        .getPublicUrl(filePath);

      // Add to tracked uploaded images list
      setUploadedImages(prev => [...prev, data.publicUrl]);
      setPhotoUrl(data.publicUrl);
      setImageSrc(null); // close cropper
    } catch (error) {
      showAlert("کێشەیەک ڕوویدا لە بارکردنی وێنەکە");
    } finally {
      setUploadingImage(false);
    }
  };

  const cleanUpUnusedImages = async (currentSavedUrl: string, currentSavedPortfolioUrls: string[]) => {
    console.log("--- CLEANUP STORAGE DIAGNOSTIC ---");
    console.log("uploadedImages in state:", uploadedImages);
    console.log("currentSavedUrl (profile photo):", currentSavedUrl);
    console.log("currentSavedPortfolioUrls (portfolio):", currentSavedPortfolioUrls);
    
    // Delete any image we uploaded during this session that was not saved
    const unsaved = uploadedImages.filter(url => {
      const isProfilePhoto = url === currentSavedUrl;
      const isPortfolioPhoto = currentSavedPortfolioUrls.includes(url);
      console.log(`URL: ${url} -> isProfile: ${isProfilePhoto}, isPortfolio: ${isPortfolioPhoto}`);
      return !isProfilePhoto && !isPortfolioPhoto;
    });

    console.log("unsaved URLs marked for deletion:", unsaved);
    console.log("----------------------------------");

    for (const url of unsaved) {
      const { deleteStorageFileByUrl } = await import("../../../actions");
      await deleteStorageFileByUrl(url);
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

  const handleCancel = async () => {
    // User is leaving without saving, delete ALL images we uploaded during this session
    setSaving(true);
    try {
      for (const url of uploadedImages) {
        const { deleteStorageFileByUrl } = await import("../../../actions");
        await deleteStorageFileByUrl(url);
      }
    } catch (e) {
      console.error(e);
    }
    router.back();
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    
    // Process pending additions
    for (const url of pendingAddImages) {
      await addPortfolioImage(profile.id, url);
    }
    
    // Process pending deletions
    for (const id of pendingDeleteImages) {
      await deletePortfolioImage(id);
    }
    
    // Clean up other temporary images we uploaded during this session
    await cleanUpUnusedImages(photoUrl, pendingAddImages);

    // Clear pending states
    setPendingAddImages([]);
    setPendingDeleteImages([]);
    
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
      // Reload profile to ensure we have the absolute latest IDs for new images
      const latestProfile = await getProfessionalById(profile.id);
      setProfile(latestProfile);
      setUploadedImages([]); // Clear uploadedImages so back button won't delete them
      showAlert("زانیارییەکان بە سەرکەوتوویی نوێکرانەوە!");
    } else {
      showAlert("کێشەیەک ڕوویدا لە نوێکردنەوە.");
    }
    setSaving(false);
  };

  const handleUploadPortfolio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !profile) return;
    const file = e.target.files[0];
    
    if (file.size > 5 * 1024 * 1024) {
      showAlert("قەبارەی وێنەکە نابێت لە ٥ مێگابایت زیاتر بێت!");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `portfolio_${profile.id}_${Math.random()}.${fileExt}`;
      
      const options = {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);

      const { data, error } = await supabase.storage
        .from('portfolio')
        .upload(fileName, compressedFile);

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('portfolio')
        .getPublicUrl(fileName);

      const imageUrl = publicUrlData.publicUrl;
      
      // Add to tracked uploaded images list
      setUploadedImages(prev => [...prev, imageUrl]);
      
      // Instead of adding immediately, add to pending list
      setPendingAddImages(prev => [...prev, imageUrl]);
      
      // Optimistically update UI
      setProfile((prev: any) => ({
        ...prev,
        portfolio_images: [{ id: `pending-${Math.random()}`, image_url: imageUrl, isPending: true }, ...(prev.portfolio_images || [])]
      }));
      
    } catch (error: any) {
      showAlert("کێشە لە ئەپلۆدکردندا: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePortfolioImage = async (imageId: number | string) => {
    showConfirm("دڵنیایت لە سڕینەوەی ئەم وێنەیە؟", async (confirmed) => {
      if (!confirmed) return;
      
      // If it's a pending image, just remove it from pending Add list
      if (String(imageId).startsWith('pending-')) {
        const imgObj = profile.portfolio_images.find((img: any) => img.id === imageId);
        if (imgObj) {
          setPendingAddImages(prev => prev.filter(url => url !== imgObj.image_url));
        }
      } else {
        // Mark for deletion on save
        setPendingDeleteImages((prev: any) => [...prev, imageId]);
      }
      
      // Optimistically update UI
      setProfile((prev: any) => ({
        ...prev,
        portfolio_images: prev.portfolio_images.filter((img: any) => img.id !== imageId)
      }));
    });
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
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 p-4 pb-32">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 mt-2">
        <button onClick={handleCancel} className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm text-xl border border-gray-100 dark:border-gray-700 flex-shrink-0 active:scale-95 transition-transform">
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
            readOnly
            type="tel" 
            dir="ltr"
            value={formData.phone}
            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-400 dark:text-gray-500 cursor-not-allowed focus:outline-none text-right"
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
            <option value="" disabled>شارەکەت هەڵبژێرە</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>{city.name_ku}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">چەند ساڵ ئەزموونت هەیە؟</label>
          <input 
            type="number" 
            dir="ltr"
            min="0"
            value={formData.experience_years}
            onChange={(e) => setFormData({...formData, experience_years: e.target.value})}
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
          />
        </div>

        {/* Extra Info */}
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
            <span>🎓 بڕوانامە</span>
            <span className="text-xs font-normal text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">ئارەزوومەندانە</span>
          </label>
          <input 
            type="text" 
            placeholder="نموونە: بەکالۆریۆس لە تەلارسازی"
            value={formData.degree}
            onChange={(e) => setFormData({...formData, degree: e.target.value})}
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
            <span>🛠️ شارەزاییەکانت</span>
            <span className="text-xs font-normal text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">ئارەزوومەندانە</span>
          </label>
          <textarea 
            placeholder="نموونە: بۆیاخکردن، دیکۆراتی ناوەوە..."
            value={formData.skills}
            onChange={(e) => setFormData({...formData, skills: e.target.value})}
            rows={3}
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
            <span>📍 شوێنی کارکردنت</span>
            <span className="text-xs font-normal text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">ئارەزوومەندانە</span>
          </label>
          <input 
            type="text" 
            placeholder="نموونە: سلێمانی، هەولێر"
            value={formData.work_locations}
            onChange={(e) => setFormData({...formData, work_locations: e.target.value})}
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
          />
        </div>

        <button 
          onClick={handleSave}
          disabled={saving}
          className={`w-full py-4 mt-2 rounded-xl text-white font-bold text-lg transition-all ${
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
            <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 group">
              <img src={img.image_url} alt="Work" className="w-full h-full object-cover" />
              <button 
                onClick={() => handleDeletePortfolioImage(img.id)}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
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
              type="button"
              disabled={uploadingImage}
              onClick={() => setImageSrc(null)}
              className="flex-1 bg-gray-700 text-white py-3 rounded-xl font-bold disabled:opacity-50"
            >
              پاشگەزبوونەوە
            </button>
            <button
              type="button"
              disabled={uploadingImage}
              onClick={handleCropSave}
              className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploadingImage ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>پڕۆسێس دەکات...</span>
                </>
              ) : (
                "بڕین و دانان"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

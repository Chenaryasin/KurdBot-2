"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Camera } from "lucide-react";
import Cropper from 'react-easy-crop';
import { getSessionUser } from "../../../../auth-actions";
import { getUserById } from "../../../../actions";
import { showAlert } from "@/lib/alerts";

export default function AdminEditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [cityId, setCityId] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [cities, setCities] = useState<any[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const sessionUser = await getSessionUser();
        // Simple admin check
        if (!sessionUser || (sessionUser.phone !== "07502458972" && sessionUser.phone !== "+9647502458972")) {
          router.replace("/");
          return;
        }

        if (!userId) return;

        const userData = await getUserById(userId);

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
  }, [router, userId]);

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
        showAlert("قەبارەی وێنەکە نابێت لە ٥ مێگابایت زیاتر بێت");
        return;
      }
      const reader = new FileReader();
      reader.addEventListener('load', () => setImageSrc(reader.result?.toString() || null));
      reader.readAsDataURL(file);
    }
  };

  const handleCropSave = async () => {
    if (!imageSrc || !croppedAreaPixels || !userId) return;

    try {
      setUploadingImage(true);
      const { getCroppedImg } = await import('@/lib/cropImage');
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels);

      const fileExt = "jpg";
      const fileName = `user_${userId}_${Math.random()}.${fileExt}`;
      const filePath = `user_profiles/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("profiles")
        .upload(filePath, croppedFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("profiles")
        .getPublicUrl(filePath);

      // Add the new public URL to our tracked uploaded images state
      setUploadedImages(prev => [...prev, data.publicUrl]);
      setPhotoUrl(data.publicUrl);
      setImageSrc(null); // close cropper
    } catch (error) {
      showAlert("کێشەیەک ڕوویدا لە بارکردنی وێنەکە");
    } finally {
      setUploadingImage(false);
    }
  };

  const cleanUpUnusedImages = async (currentSavedUrl: string) => {
    // Delete any image we uploaded during this session that is not the one we ended up saving
    const unsaved = uploadedImages.filter(url => url !== currentSavedUrl);
    for (const url of unsaved) {
      const { deleteStorageFileByUrl } = await import("../../../../actions");
      await deleteStorageFileByUrl(url);
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
      
      // Clean up other temporary images we uploaded during this session
      await cleanUpUnusedImages(photoUrl);

      router.back();
      router.refresh();
    } catch (error) {
      showAlert("کێشەیەک ڕوویدا لە سەیڤکردنی زانیارییەکان");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    // Admin is leaving without saving, delete ALL images we uploaded during this session
    setSaving(true);
    try {
      for (const url of uploadedImages) {
        const { deleteStorageFileByUrl } = await import("../../../../actions");
        await deleteStorageFileByUrl(url);
      }
    } catch (e) {
      console.error(e);
    }
    router.back();
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">چاوەڕێ بکە...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 pb-28">
      <div className="flex items-center gap-3 mb-6 mt-2">
        <button type="button" onClick={handleCancel} className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm text-xl border border-gray-100 dark:border-gray-700 flex-shrink-0 active:scale-95 transition-transform">
          🔙
        </button>
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">دەستکاریکردنی بەکارهێنەر</h1>
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

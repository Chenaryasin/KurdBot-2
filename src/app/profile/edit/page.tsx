"use client";

import { useEffect, useState } from "react";
import { getProfessionalByTelegramId, getProfessionalById, updateProfessionalProfile, addPortfolioImage } from "../../actions";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EditProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    degree: "",
    skills: "",
    work_locations: ""
  });
  
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function loadData() {
      // Get Telegram ID
      if (typeof window !== "undefined" && (window as any).Telegram?.WebApp) {
        const tg = (window as any).Telegram.WebApp;
        tg.ready();
        const user = tg.initDataUnsafe?.user;
        
        if (user?.id) {
          const authData = await getProfessionalByTelegramId(user.id);
          if (authData) {
            const fullProfile = await getProfessionalById(authData.id);
            if (fullProfile) {
              setProfile(fullProfile);
              setFormData({
                degree: fullProfile.degree || "",
                skills: fullProfile.skills || "",
                work_locations: fullProfile.work_locations || ""
              });
            }
          }
        } else {
          // For testing outside telegram, you might mock a user ID here if needed
          // const testProfile = await getProfessionalById("some-id"); 
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const res = await updateProfessionalProfile(profile.id, formData);
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
    return <div className="min-h-screen flex items-center justify-center text-gray-500">خەریکی هێنانە...</div>;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">پڕۆفایلت نییە!</h2>
        <p className="text-gray-500 mb-6">پێدەچێت خۆت تۆمار نەکردبێت، یان ئەکاونتەکەت بە تیلیگرامەکەتەوە نەبەسترابێتەوە.</p>
        <Link href="/" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold">گەڕانەوە</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-4 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-xl border border-gray-100 flex-shrink-0">
          🔙
        </Link>
        <h1 className="text-xl font-bold text-gray-800">دەستکاریکردنی پڕۆفایل</h1>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-5">
        
        {/* Texts */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">🎓 بڕوانامە</label>
          <input 
            type="text" 
            placeholder="بۆ نمونە: دبلۆم لە تەکنەلۆژیا"
            value={formData.degree}
            onChange={(e) => setFormData({...formData, degree: e.target.value})}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">🛠️ شارەزاییەکان</label>
          <textarea 
            rows={3}
            placeholder="شارەزاییت لە چییە؟ باسی بکە..."
            value={formData.skills}
            onChange={(e) => setFormData({...formData, skills: e.target.value})}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">🏢 شوێنەکانی کارکردن</label>
          <input 
            type="text" 
            placeholder="بۆ نمونە: ناو بازاڕ، گەڕەکی بەختیاری..."
            value={formData.work_locations}
            onChange={(e) => setFormData({...formData, work_locations: e.target.value})}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button 
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl mt-2 active:scale-95 transition-transform shadow-md shadow-blue-200"
        >
          {saving ? "خەریکە..." : "پاشەکەوتکردنی زانیارییەکان"}
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mt-6 flex flex-col gap-4">
        <h2 className="font-bold text-gray-800 text-lg flex justify-between items-center">
          <span>📸 وێنەی کارەکانت (پۆرتفۆلیۆ)</span>
        </h2>
        <p className="text-xs text-gray-500">وێنەی ئەو کارانە دابنێ کە پێشتر کردووتە بۆ ئەوەی خەڵک زیاتر متمانەت پێ بکات.</p>

        <div className="grid grid-cols-3 gap-2 mt-2">
          {profile.portfolio_images?.map((img: any) => (
            <div key={img.id} className="aspect-square rounded-xl overflow-hidden border border-gray-200">
              <img src={img.image_url} alt="Work" className="w-full h-full object-cover" />
            </div>
          ))}
          
          <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-50 transition-colors">
            {uploading ? (
              <span className="text-xs font-bold">چاوەڕێ...</span>
            ) : (
              <>
                <span className="text-2xl mb-1">+</span>
                <span className="text-xs font-bold">وێنە زیادبکە</span>
              </>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleUploadPortfolio} disabled={uploading} />
          </label>
        </div>
      </div>
    </div>
  );
}

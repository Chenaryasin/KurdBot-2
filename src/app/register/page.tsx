"use client";

import { useEffect, useState } from "react";
import { getCities, getCategories, registerProfessional, normalizeText } from "../actions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();
  const [cities, setCities] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    experience_years: "",
    city_id: "",
    category_id: ""
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadFilters() {
      setCities(await getCities());
      setCategories(await getCategories());
    }
    loadFilters();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let photo_url = null;

    if (file) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data, error } = await supabase.storage.from('profiles').upload(fileName, file);
      
      if (!error && data) {
        photo_url = supabase.storage.from('profiles').getPublicUrl(fileName).data.publicUrl;
      } else {
        alert("کێشەیەک لە وێنەکەدا هەیە: " + (error?.message || "نەتوانرا ئەپلۆد بکرێت"));
        setLoading(false);
        return;
      }
    }
    
    const result = await registerProfessional({
      name: formData.name,
      phone: formData.phone,
      experience_years: parseInt(normalizeText(formData.experience_years) || "0"),
      city_id: parseInt(formData.city_id),
      category_id: parseInt(formData.category_id),
      photo_url: photo_url
    });

    setLoading(false);
    if (result.success) {
      setSuccess(true);
    } else {
      alert("کێشەیەک ڕوویدا لە کاتی ناردنی زانیارییەکان. تکایە دووبارە هەوڵ بدەرەوە.");
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
    <div className="flex flex-col min-h-screen bg-gray-50 p-4 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-xl border border-gray-100">
          🔙
        </Link>
        <h1 className="text-xl font-bold text-gray-800">خۆتۆمارکردن</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4">
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ناوی تەواو یان ناوی کلینیک</label>
          <input 
            required
            type="text"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-blue-500 transition-colors text-gray-900"
            placeholder="نمونە: وەستا دارا"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ژمارەی مۆبایل</label>
          <input 
            required
            type="tel"
            dir="ltr"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-blue-500 transition-colors text-right text-gray-900"
            placeholder="07XX XXX XXXX"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">چەند ساڵ ئەزموونت هەیە؟</label>
          <input 
            required
            type="text"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-blue-500 transition-colors text-gray-900"
            placeholder="نمونە: 5"
            value={formData.experience_years}
            onChange={(e) => setFormData({...formData, experience_years: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">شار</label>
          <select 
            required
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-blue-500 transition-colors text-gray-900"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">پیشە</label>
          <select 
            required
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-blue-500 transition-colors text-gray-900"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">وێنەی پڕۆفایل (ئارەزوومەندانە)</label>
          <div className="relative">
             <input 
               type="file"
               accept="image/*"
               onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
               className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-blue-500 transition-colors text-gray-900 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
             />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="mt-4 w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-md active:scale-95 transition-transform disabled:opacity-70"
        >
          {loading ? "چاوەڕێ بکە..." : "خۆتۆمارکردن"}
        </button>

      </form>
    </div>
  );
}

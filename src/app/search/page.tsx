"use client";

import { useEffect, useState } from "react";
import { getCities, getCategories, getProfessionals } from "../actions";
import Link from "next/link";

export default function SearchPage() {
  const [cities, setCities] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  
  const [selectedCity, setSelectedCity] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("searchFilters");
      if (saved) return JSON.parse(saved).city || "";
    }
    return "";
  });
  
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("searchFilters");
      if (saved) return JSON.parse(saved).category || "";
    }
    return "";
  });
  
  const [searchQuery, setSearchQuery] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("searchFilters");
      if (saved) return JSON.parse(saved).query || "";
    }
    return "";
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFilters() {
      const cityData = await getCities();
      const catData = await getCategories();
      setCities(cityData);
      setCategories(catData);
    }
    loadFilters();
  }, []);

  useEffect(() => {
    async function loadPros() {
      setLoading(true);
      const data = await getProfessionals(selectedCity, selectedCategory, searchQuery);
      setProfessionals(data);
      setLoading(false);
    }
    
    if (typeof window !== "undefined") {
      sessionStorage.setItem("searchFilters", JSON.stringify({
        city: selectedCity,
        category: selectedCategory,
        query: searchQuery
      }));
    }
    
    // Debounce search slightly
    const delay = setTimeout(() => {
      loadPros();
    }, 300);
    
    return () => clearTimeout(delay);
  }, [selectedCity, selectedCategory, searchQuery]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 p-4 pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 mt-2">
        <Link href="/" className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm text-xl border border-gray-100 dark:border-gray-700 flex-shrink-0 active:scale-95 transition-transform">
          🔙
        </Link>
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">دۆزینەوەی پسپۆڕ</h1>
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 flex flex-col gap-4">
        
        {/* Search Input */}
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">گەڕان</label>
          <input 
            type="text" 
            placeholder="ناوی وەستا یان ژمارە مۆبایل..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 mb-1 text-center">شار</label>
            <select 
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-3 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-center"
            >
              <option value="">هەموو شارەکان</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>{c.name_ku}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 mb-1 text-center">پیشە</label>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-3 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-center"
            >
              <option value="">هەموو پیشەکان</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name_ku}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="text-center text-gray-400 py-10">خەریکی گەڕانە...</div>
        ) : professionals.length === 0 ? (
          <div className="text-center text-gray-400 py-10 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
            هیچ پسپۆڕێک نەدۆزرایەوە لەم بەشەدا
          </div>
        ) : (
          professionals.map((prof) => (
            <div key={prof.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 hover:border-blue-200 dark:hover:border-blue-800 transition-all">
              <Link href={`/profile/${prof.id}`} className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden active:scale-95 transition-transform block cursor-pointer">
                {prof.photo_url ? (
                  <img src={prof.photo_url} alt={prof.name} className="w-full h-full object-cover" />
                ) : (
                  prof.categories?.icon || '👤'
                )}
              </Link>
              
              <div className="flex-1 text-center">
                <Link href={`/profile/${prof.id}`} className="block">
                  <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{prof.name}</h3>
                </Link>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center justify-center gap-2">
                  <span>📍 {prof.cities?.name_ku}</span>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <span>⭐ {prof.experience_years} ساڵ ئەزموون</span>
                </div>
                
                <a 
                  href={`tel:${prof.phone}`}
                  className="mt-3 bg-green-500 text-white py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <span>پەیوەندی بکە</span>
                  <span className="font-mono text-xs mt-0.5" dir="ltr">{prof.phone}</span>
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

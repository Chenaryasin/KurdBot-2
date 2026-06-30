"use client";

import { useEffect, useState } from "react";
import { getCities, getCategories, getProfessionals } from "../actions";
import Link from "next/link";

export default function SearchPage() {
  const [cities, setCities] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
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
    
    // Debounce search slightly
    const delay = setTimeout(() => {
      loadPros();
    }, 300);
    
    return () => clearTimeout(delay);
  }, [selectedCity, selectedCategory, searchQuery]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-4 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-xl border border-gray-100 flex-shrink-0">
          🔙
        </Link>
        <h1 className="text-xl font-bold text-gray-800">دۆزینەوەی پسپۆڕ</h1>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 mb-6 flex flex-col gap-4">
        
        {/* Search Input */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">گەڕان</label>
          <input 
            type="text" 
            placeholder="ناوی وەستا یان ژمارە مۆبایل..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-400 mb-1 text-center">شار</label>
            <select 
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center appearance-none"
            >
              <option value="">هەموو شارەکان</option>
              {cities.map(c => <option key={c.id} value={c.id}>{c.name_ku}</option>)}
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-400 mb-1 text-center">پیشە</label>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center appearance-none"
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
          <div className="text-center text-gray-400 py-10 bg-white rounded-2xl border border-dashed border-gray-200">
            هیچ پسپۆڕێک نەدۆزرایەوە لەم بەشەدا
          </div>
        ) : (
          professionals.map((prof) => (
            <Link href={`/profile/${prof.id}`} key={prof.id} className="block active:scale-95 transition-transform">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:border-blue-200 hover:shadow-md transition-all">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                  {prof.photo_url ? (
                    <img src={prof.photo_url} alt={prof.name} className="w-full h-full object-cover" />
                  ) : (
                    prof.categories?.icon || '👤'
                  )}
                </div>
                
                <div className="flex-1 text-center">
                  <h3 className="font-bold text-gray-800">{prof.name}</h3>
                  <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-2">
                    <span>📍 {prof.cities?.name_ku}</span>
                    <span className="text-gray-300">|</span>
                    <span>⭐ {prof.experience_years} ساڵ ئەزموون</span>
                  </div>
                  
                  <div className="mt-3 bg-green-500 text-white py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 pointer-events-none">
                    <span>پڕۆفایل ببینە</span>
                    <span>🔍</span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

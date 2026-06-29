"use client";

import { useEffect, useState } from "react";
import { getCities, getCategories, getProfessionals } from "../actions";
import Link from "next/link";

export default function SearchPage() {
  const [cities, setCities] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFilters() {
      const fetchedCities = await getCities();
      const fetchedCategories = await getCategories();
      setCities(fetchedCities);
      setCategories(fetchedCategories);
    }
    loadFilters();
  }, []);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getProfessionals(selectedCity, selectedCategory);
      setProfessionals(data);
      setLoading(false);
    }
    loadData();
  }, [selectedCity, selectedCategory]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-4 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-xl border border-gray-100">
          🔙
        </Link>
        <h1 className="text-xl font-bold text-gray-800">دۆزینەوەی پسپۆڕ</h1>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex gap-3">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">شار</label>
          <select 
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-sm outline-none focus:border-blue-500 text-gray-900"
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
          >
            <option value="">هەموو شارەکان</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>{c.name_ku}</option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">پیشە</label>
          <select 
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-sm outline-none focus:border-blue-500 text-gray-900"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">هەموو پیشەکان</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.name_ku}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="text-center text-gray-400 py-10">خەریکی گەڕانە...</div>
        ) : professionals.length === 0 ? (
          <div className="text-center text-gray-400 py-10 bg-white rounded-2xl border border-dashed border-gray-200">
            هیچ پسپۆڕێک نەدۆزرایەوە لەم بەشەدا!
          </div>
        ) : (
          professionals.map((prof) => (
            <div key={prof.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                {prof.photo_url ? (
                  <img src={prof.photo_url} alt={prof.name} className="w-full h-full object-cover" />
                ) : (
                  prof.categories?.icon || '👤'
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 text-lg">{prof.name}</h3>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <span>📍 {prof.cities?.name_ku}</span>
                  <span className="text-gray-300">|</span>
                  <span>⭐ {prof.experience_years} ساڵ ئەزموون</span>
                </p>
                <div className="mt-3">
                  <a 
                    href={`tel:${prof.phone}`}
                    className="inline-flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-medium w-full active:scale-95 transition-transform"
                  >
                    📞 پەیوەندی بکە
                  </a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

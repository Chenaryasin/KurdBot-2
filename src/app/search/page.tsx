"use client";

import { useEffect, useState } from "react";
import { getCities, getCategories, getProfessionals, toggleFavorite } from "../actions";
import Link from "next/link";
import ProfessionalCard from "@/components/ProfessionalCard";
import SkeletonCard from "@/components/SkeletonCard";

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
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const PAGE_SIZE = 15;

  useEffect(() => {
    async function loadFilters() {
      const cityData = await getCities();
      const catData = await getCategories();
      setCities(cityData);
      setCategories(catData);
    }
    loadFilters();
  }, []);

  const loadPros = async (isInitial: boolean = false) => {
    if (isInitial) {
      setLoading(true);
      const data = await getProfessionals(selectedCity, selectedCategory, searchQuery, 1, PAGE_SIZE);
      setProfessionals(data);
      setHasMore(data.length === PAGE_SIZE);
      setPage(1);
      setLoading(false);
    } else {
      if (loadingMore || !hasMore) return;
      setLoadingMore(true);
      const nextPage = page + 1;
      const data = await getProfessionals(selectedCity, selectedCategory, searchQuery, nextPage, PAGE_SIZE);
      if (data.length > 0) {
        setProfessionals(prev => [...prev, ...data]);
        setPage(nextPage);
      }
      setHasMore(data.length === PAGE_SIZE);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("searchFilters", JSON.stringify({
        city: selectedCity,
        category: selectedCategory,
        query: searchQuery
      }));
    }
    
    // Debounce search slightly
    const delay = setTimeout(() => {
      loadPros(true);
    }, 300);
    
    return () => clearTimeout(delay);
  }, [selectedCity, selectedCategory, searchQuery]);

  useEffect(() => {
    if (loading || loadingMore || !hasMore) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadPros(false);
      }
    }, { threshold: 0.1 });

    const target = document.getElementById("infinite-scroll-trigger");
    if (target) observer.observe(target);

    return () => observer.disconnect();
  }, [loading, loadingMore, hasMore, page, selectedCity, selectedCategory, searchQuery]);

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
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : professionals.length === 0 ? (
          <div className="text-center text-gray-400 py-10 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
            هیچ پسپۆڕێک نەدۆزرایەوە لەم بەشەدا
          </div>
        ) : (
          professionals.map((prof) => (
            <ProfessionalCard 
              key={prof.id} 
              prof={prof} 
              isFavorite={prof.is_favorite} 
              onToggleFavorite={async (id) => {
                const res = await toggleFavorite(id);
                if (res.success) {
                  setProfessionals(prev => prev.map(p => p.id === id ? { ...p, is_favorite: !p.is_favorite } : p));
                }
              }} 
            />
          ))
        )}

        {loadingMore && (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}

        {hasMore && !loading && (
          <div id="infinite-scroll-trigger" className="h-14 flex items-center justify-center text-gray-400 text-sm animate-pulse">
            بۆ بینینی زیاتر بڕۆ خوارەوە...
          </div>
        )}
      </div>
    </div>
  );
}

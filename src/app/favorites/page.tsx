"use client";

import { useEffect, useState } from "react";
import { getProfessionals, toggleFavorite } from "../actions";
import Link from "next/link";
import ProfessionalCard from "@/components/ProfessionalCard";
import SkeletonCard from "@/components/SkeletonCard";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFavorites() {
      setLoading(true);
      // Fetching all and filtering is fine for this scale, or we could add a dedicated action
      const data = await getProfessionals();
      setFavorites(data.filter((p: any) => p.is_favorite));
      setLoading(false);
    }
    loadFavorites();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 p-4 pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 mt-2">
        <Link href="/" className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm text-xl border border-gray-100 dark:border-gray-700 flex-shrink-0 active:scale-95 transition-transform">
          🔙
        </Link>
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">دڵخوازەکانم</h1>
      </div>

      <div className="flex flex-col gap-4">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : favorites.length === 0 ? (
          <div className="text-center text-gray-400 py-10 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
            هیچ وەستایەکت سەیڤ نەکردووە
          </div>
        ) : (
          favorites.map((prof) => (
            <ProfessionalCard 
              key={prof.id} 
              prof={prof} 
              isFavorite={prof.is_favorite} 
              onToggleFavorite={async (id) => {
                const res = await toggleFavorite(id);
                if (res.success) {
                  setFavorites(prev => prev.filter(p => p.id !== id));
                }
              }} 
            />
          ))
        )}
      </div>
    </div>
  );
}

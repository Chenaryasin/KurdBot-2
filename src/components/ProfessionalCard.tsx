"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, Star, PhoneCall, MessageCircle } from "lucide-react";

interface ProfessionalCardProps {
  prof: any;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => Promise<void>;
}

export default function ProfessionalCard({ prof, isFavorite = false, onToggleFavorite }: ProfessionalCardProps) {
  const [loadingFav, setLoadingFav] = useState(false);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (onToggleFavorite) {
      setLoadingFav(true);
      await onToggleFavorite(prof.id);
      setLoadingFav(false);
    }
  };

  return (
    <div className="glass-card p-4 rounded-2xl flex flex-col gap-4 hover-scale relative group overflow-hidden">
      {/* Favorite Button */}
      {onToggleFavorite && (
        <button 
          onClick={handleFavoriteClick}
          disabled={loadingFav}
          className={`absolute top-3 left-3 w-8 h-8 flex items-center justify-center rounded-full z-10 transition-colors backdrop-blur-sm ${
            isFavorite 
              ? "bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50" 
              : "bg-gray-100/50 dark:bg-black/20 hover:bg-gray-200/80 dark:hover:bg-black/40"
          }`}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-500 dark:text-gray-400"}`} />
        </button>
      )}

      <div className="flex items-center gap-4">
        <Link href={`/profile/${prof.id}`} className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 overflow-hidden active:scale-95 transition-transform block cursor-pointer border border-blue-200/50 dark:border-blue-700/50">
          {prof.photo_url ? (
            <img src={prof.photo_url} alt={prof.name} className="w-full h-full object-cover" />
          ) : (
            prof.categories?.icon || '👤'
          )}
        </Link>
        
        <div className="flex-1 text-right">
          <Link href={`/profile/${prof.id}`} className="block">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg hover:text-primary transition-colors">{prof.name}</h3>
          </Link>
          
          <div className="flex items-center justify-end gap-1 mt-1 text-yellow-500">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300 ml-1">
              ({prof.rating ? prof.rating.toFixed(1) : "نوێ"})
            </span>
            <Star className={`w-3.5 h-3.5 ${prof.rating >= 1 ? "fill-current" : "opacity-30"}`} />
            <Star className={`w-3.5 h-3.5 ${prof.rating >= 2 ? "fill-current" : "opacity-30"}`} />
            <Star className={`w-3.5 h-3.5 ${prof.rating >= 3 ? "fill-current" : "opacity-30"}`} />
            <Star className={`w-3.5 h-3.5 ${prof.rating >= 4 ? "fill-current" : "opacity-30"}`} />
            <Star className={`w-3.5 h-3.5 ${prof.rating >= 5 ? "fill-current" : "opacity-30"}`} />
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center justify-end gap-2">
            <span>📍 {prof.cities?.name_ku}</span>
            <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
            <span>{prof.experience_years} ساڵ ئەزموون</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-2">
        <a 
          href={`tel:${prof.phone}`}
          className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-colors active-scale"
        >
          <PhoneCall className="w-4 h-4" /> پەیوەندی
        </a>
        <a 
          href={`https://wa.me/${prof.phone.replace('+', '')}`}
          target="_blank"
          className="flex-1 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 text-green-600 dark:text-green-400 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-colors active-scale border border-green-100 dark:border-green-800/30"
        >
          <MessageCircle className="w-4 h-4" /> وەتسئاپ
        </a>
      </div>
    </div>
  );
}

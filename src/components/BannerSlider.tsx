"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getBanners } from "@/app/actions";

export interface Banner {
  id: number;
  title?: string;
  image_url: string;
  link_url?: string;
}

const DEFAULT_BANNERS: Banner[] = [
  {
    id: -1,
    title: "باشترین وەستا و پسپۆڕەکانی کوردستان",
    image_url: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=1200&q=80",
    link_url: "/search",
  },
  {
    id: -2,
    title: "خزمەتگوزاری سەریع و باوەڕپێنەکراو",
    image_url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80",
    link_url: "/search",
  },
];

export default function BannerSlider() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    async function loadBanners() {
      try {
        const data = await getBanners();
        if (data && data.length > 0) {
          setBanners(data);
        } else {
          setBanners(DEFAULT_BANNERS);
        }
      } catch (e) {
        setBanners(DEFAULT_BANNERS);
      } finally {
        setLoading(false);
      }
    }
    loadBanners();
  }, []);

  // Auto slide every 4 seconds
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || banners.length <= 1) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (diff > 50) {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    } else if (diff < -50) {
      setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    }
    touchStartX.current = null;
  };

  if (loading) {
    return (
      <div className="w-full h-44 rounded-3xl shimmer border border-gray-150 dark:border-gray-800 shadow-sm my-4" />
    );
  }

  const currentBanner = banners[currentIndex];

  const content = (
    <div
      className="relative w-full h-44 rounded-3xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-800 my-4 group transition-all duration-300"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="flex w-full h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(${currentIndex * 100}%)` }}
      >
        {banners.map((banner, index) => (
          <div key={banner.id || index} className="w-full h-full flex-shrink-0 relative">
            <img
              src={banner.image_url}
              alt={banner.title || "Banner"}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-4">
              {banner.title && (
                <h3 className="text-white font-bold text-base md:text-lg drop-shadow-md">
                  {banner.title}
                </h3>
              )}
            </div>
          </div>
        ))}
      </div>

      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 bg-black/30 backdrop-blur-md px-2.5 py-1 rounded-full">
          {banners.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentIndex ? "w-5 bg-white" : "w-2 bg-white/50"
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );

  if (currentBanner?.link_url) {
    return (
      <Link href={currentBanner.link_url} className="block w-full">
        {content}
      </Link>
    );
  }

  return content;
}

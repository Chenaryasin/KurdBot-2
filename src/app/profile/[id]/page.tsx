"use client";

import { useEffect, useState } from "react";
import { getProfessionalById } from "../../actions";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function ProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      if (id) {
        const data = await getProfessionalById(id as string);
        setProfile(data);
      }
      setLoading(false);
    }
    loadProfile();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">خەریکی هێنانە...</div>;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-500 gap-4">
        <div>پڕۆفایل نەدۆزرایەوە!</div>
        <button onClick={() => router.back()} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold">گەڕانەوە</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      {/* Cover & Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 pt-8 pb-16 px-4 rounded-b-[40px] relative">
        <button onClick={() => router.back()} className="absolute top-6 left-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-xl text-white active:scale-95 transition-transform">
          🔙
        </button>
        <div className="text-center text-white mt-4">
          <p className="text-blue-100 text-sm mb-1">{profile.categories?.icon} {profile.categories?.name_ku}</p>
          <h1 className="text-3xl font-bold">{profile.name}</h1>
        </div>
      </div>

      {/* Profile Info Card */}
      <div className="px-4 -mt-10">
        <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-100 relative">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-white p-1 rounded-full shadow-md">
            {profile.photo_url ? (
              <img src={profile.photo_url} alt={profile.name} className="w-full h-full object-cover rounded-full bg-blue-50" />
            ) : (
              <div className="w-full h-full bg-blue-50 rounded-full flex items-center justify-center text-4xl">
                {profile.categories?.icon || '👤'}
              </div>
            )}
          </div>
          
          <div className="mt-12 text-center">
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">📍 {profile.cities?.name_ku}</span>
              <span className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">⭐ {profile.experience_years} ساڵ ئەزموون</span>
            </div>

            <a 
              href={`tel:${profile.phone}`}
              className="w-full bg-green-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-transform shadow-md shadow-green-200 text-lg"
            >
              <span>پەیوەندی بکە</span>
              <span dir="ltr" className="font-mono">{profile.phone}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Extended Info */}
      <div className="px-4 mt-6 flex flex-col gap-4">
        
        {profile.degree && (
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-2">
              <span>🎓</span> بڕوانامە
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{profile.degree}</p>
          </div>
        )}

        {profile.skills && (
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-2">
              <span>🛠️</span> شارەزاییەکان
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{profile.skills}</p>
          </div>
        )}

        {profile.work_locations && (
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-2">
              <span>🏢</span> شوێنەکانی کارکردن
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{profile.work_locations}</p>
          </div>
        )}

        {/* Portfolio Gallery */}
        {profile.portfolio_images && profile.portfolio_images.length > 0 && (
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mt-2">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
              <span>📸</span> وێنەی کارەکان
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {profile.portfolio_images.map((img: any) => (
                <div key={img.id} className="aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
                  <img src={img.image_url} alt="Portfolio" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

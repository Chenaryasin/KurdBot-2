"use client";

import { useEffect, useState } from "react";
import { getUserById } from "../../../actions";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function AdminUserProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      if (id) {
        const data = await getUserById(id as string);
        setProfile(data);
      }
      setLoading(false);
    }
    loadProfile();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500 bg-gray-50 dark:bg-gray-900">چاوەڕێ بکە...</div>;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-4">بەکارهێنەر نەدۆزرایەوە</h2>
        <button onClick={() => router.back()} className="bg-blue-600 text-white px-6 py-2 rounded-xl">گەڕانەوە</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Cover & Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 pt-8 pb-16 px-4 rounded-b-[40px] relative">
        <button onClick={() => router.back()} className="absolute top-6 left-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-xl text-white active:scale-95 transition-transform">
          🔙
        </button>
        <Link href={`/admin/users/${id}/edit`} className="absolute top-6 right-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-xl text-white active:scale-95 transition-transform">
          ✏️
        </Link>
        <div className="text-center text-white mt-4">
          <p className="text-indigo-200 text-sm mb-1">{profile.is_professional ? "وەستا/پسپۆڕ" : "بەکارهێنەر"}</p>
          <h1 className="text-3xl font-bold">{profile.name}</h1>
        </div>
      </div>

      {/* Profile Info Card */}
      <div className="px-4 -mt-10">
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-md border border-gray-100 dark:border-gray-700 relative flex flex-col items-center">
          <div className="absolute -top-12 w-24 h-24 bg-white dark:bg-gray-800 p-1 rounded-full shadow-md">
            {profile.photo_url ? (
              <img src={profile.photo_url} alt={profile.name} className="w-full h-full object-cover rounded-full bg-indigo-50 dark:bg-gray-700" />
            ) : (
              <div className="w-full h-full bg-indigo-50 dark:bg-gray-700 rounded-full flex items-center justify-center text-4xl">
                👤
              </div>
            )}
          </div>
          
          <div className="mt-14 text-center w-full">
            <div className="flex flex-col gap-3 items-center w-full mb-6">
              <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-xl text-sm font-medium w-full justify-center">
                <span>📍 شار:</span>
                <span>{profile.cities?.name_ku || "نەزانراو"}</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl text-sm font-medium w-full justify-center">
                <span>📱 مۆبایل:</span>
                <span dir="ltr">{profile.phone}</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl text-sm font-medium w-full justify-center">
                <span>📅 بەرواری تۆماربوون:</span>
                <span dir="ltr">{new Date(profile.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            <a 
              href={`tel:${profile.phone}`}
              className="w-full bg-green-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-transform shadow-md shadow-green-200 text-lg"
            >
              <span>پەیوەندی بکە</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

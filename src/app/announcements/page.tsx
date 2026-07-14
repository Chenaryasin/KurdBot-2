"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Bell, Clock } from "lucide-react";

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnnouncements() {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (!error && data) {
        setAnnouncements(data);
      }
      setLoading(false);
    }
    loadAnnouncements();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 p-4 pb-28">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shadow-sm">
          <Bell size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">پەیامەکان</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">ئاگاداری و پەیامەکانی ئەدمین</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-3">
              <div className="h-5 shimmer rounded w-1/3 mr-auto"></div>
              <div className="space-y-2 mt-2">
                <div className="h-3 shimmer rounded w-full mr-auto"></div>
                <div className="h-3 shimmer rounded w-5/6 mr-auto"></div>
                <div className="h-3 shimmer rounded w-2/3 mr-auto"></div>
              </div>
              <div className="h-3 shimmer rounded w-1/4 mr-auto mt-2"></div>
            </div>
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-20 text-gray-500 dark:text-gray-400 flex flex-col items-center">
          <Bell size={48} className="mb-4 opacity-20" />
          <p>هیچ پەیامێک نییە لەئێستادا</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">{announcement.title}</h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm whitespace-pre-wrap mb-4">
                {announcement.content}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 border-t border-gray-50 dark:border-gray-700 pt-3">
                <Clock size={14} />
                <span>{new Date(announcement.created_at).toLocaleDateString("ku-IQ", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

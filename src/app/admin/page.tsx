"use client";

import { useEffect, useState } from "react";
import { 
  getPendingProfessionalsSearch, 
  getAdminApprovedProfessionals, 
  approveProfessional, 
  deleteProfessional,
  getMessages,
  getAdminAnnouncements,
  postAnnouncement,
  getSuspendedProfessionalsSearch,
  toggleSuspendProfessional,
  toggleBlockProfessional,
  getAdminBanners,
  addBanner,
  toggleBannerActive,
  deleteBanner
} from "../actions";
import Link from "next/link";
import { Send, Clock, Play, Image as ImageIcon, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { showAlert, showConfirm } from "@/lib/alerts";
import SkeletonCard from "@/components/SkeletonCard";

export default function AdminPage() {
  type TabType = "approved" | "pending" | "messages" | "announcements" | "users" | "blocked" | "suspended" | "banners";

  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [pending, setPending] = useState<any[]>([]);
  const [approved, setApproved] = useState<any[]>([]);
  const [suspended, setSuspended] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [blockedList, setBlockedList] = useState<any[]>([]);
  const [bannersList, setBannersList] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);

  // Banner Form States
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerLinkUrl, setBannerLinkUrl] = useState("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerFilePreview, setBannerFilePreview] = useState<string | null>(null);
  const [addingBanner, setAddingBanner] = useState(false);

  // Restore tab state on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTab = sessionStorage.getItem("adminActiveTab") as any;
      if (["approved", "pending", "messages", "announcements", "users", "blocked", "suspended", "banners"].includes(savedTab)) {
        setActiveTab(savedTab);
      }
    }
  }, []);

  const changeTab = (tab: TabType) => {
    setActiveTab(tab);
    setSearchQuery("");
    if (typeof window !== "undefined") {
      sessionStorage.setItem("adminActiveTab", tab);
    }
  };

  async function loadData() {
    setLoading(true);
    if (activeTab === "pending") {
      const data = await getPendingProfessionalsSearch(searchQuery);
      setPending(data);
    } else if (activeTab === "approved") {
      const data = await getAdminApprovedProfessionals(searchQuery);
      setApproved(data);
    } else if (activeTab === "suspended") {
      const data = await getSuspendedProfessionalsSearch(searchQuery);
      setSuspended(data);
    } else if (activeTab === "messages") {
      const data = await getMessages();
      setMessages(data);
    } else if (activeTab === "announcements") {
      const data = await getAdminAnnouncements();
      setAnnouncements(data);
    } else if (activeTab === "users") {
      const { getAdminUsers } = await import("../actions");
      const data = await getAdminUsers(searchQuery);
      setUsersList(data);
    } else if (activeTab === "blocked") {
      const { getBlockedUsers } = await import("../actions");
      const data = await getBlockedUsers(searchQuery);
      setBlockedList(data);
    } else if (activeTab === "banners") {
      const data = await getAdminBanners();
      setBannersList(data);
    }
    setLoading(false);
  }

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle.trim() || !announcementContent.trim()) return;
    
    setPostingAnnouncement(true);
    const res = await postAnnouncement(announcementTitle, announcementContent);
    setPostingAnnouncement(false);
    
    if (res.success) {
      setAnnouncementTitle("");
      setAnnouncementContent("");
      loadData();
    } else {
      showAlert("هەڵەیەک ڕوویدا لە ناردنی پەیامەکە: " + res.error);
    }
  };

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setBannerFile(file);
      setBannerFilePreview(URL.createObjectURL(file));
    }
  };

  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerFile) {
      showAlert("تکایە وێنەیەک بۆ باڵۆنەکە هەڵبژێرە");
      return;
    }

    setAddingBanner(true);
    try {
      const imageCompression = (await import("browser-image-compression")).default;
      const { supabase } = await import("@/lib/supabase");

      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1200, useWebWorker: true };
      const compressedFile = await imageCompression(bannerFile, options);

      const fileExt = bannerFile.name.split(".").pop() || "jpg";
      const fileName = `banners/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("profiles")
        .upload(fileName, compressedFile);

      if (uploadError) {
        throw new Error("هەڵە لە بارکردنی وێنە: " + uploadError.message);
      }

      const { data: publicUrlData } = supabase.storage
        .from("profiles")
        .getPublicUrl(fileName);

      const res = await addBanner({
        title: bannerTitle,
        image_url: publicUrlData.publicUrl,
        link_url: bannerLinkUrl,
      });

      if (res.success) {
        setBannerTitle("");
        setBannerLinkUrl("");
        setBannerFile(null);
        setBannerFilePreview(null);
        loadData();
        showAlert("باڵۆنەکە بە سەرکەوتوویی زیادکرا!");
      } else {
        showAlert("کێشەیەک ڕوویدا: " + res.error);
      }
    } catch (err: any) {
      showAlert(err.message || "کێشەیەک ڕوویدا لە بارکردنی وێنەکە");
    } finally {
      setAddingBanner(false);
    }
  };

  const handleToggleBanner = async (id: number, currentStatus: boolean) => {
    try {
      await toggleBannerActive(id, !currentStatus);
      loadData();
    } catch (e: any) {
      showAlert("کێشەیەک ڕوویدا: " + e.message);
    }
  };

  const handleDeleteBannerItem = async (id: number) => {
    showConfirm("دڵنیایت لە سڕینەوەی ئەم باڵۆنە؟", async (confirmed) => {
      if (confirmed) {
        try {
          await deleteBanner(id);
          loadData();
        } catch (e: any) {
          showAlert("کێشەیەک ڕوویدا لە سڕینەوەی باڵۆنەکە.");
        }
      }
    });
  };

  // Reload when tab or search query changes
  useEffect(() => {
    const delay = setTimeout(() => loadData(), 300);
    return () => clearTimeout(delay);
  }, [activeTab, searchQuery]);

  const handleApprove = async (id: string) => {
    showConfirm("دڵنیایت لە قبوڵکردنی ئەم وەستایە؟", async (confirmed) => {
      if (confirmed) {
        try {
          await approveProfessional(id);
          loadData();
        } catch (error) {
          showAlert("کێشەیەک ڕوویدا لە قبوڵکردنەکە.");
        }
      }
    });
  };

  const handleSuspend = async (id: string, isSuspended: boolean) => {
    const actionText = isSuspended ? "ڕاگرتن" : "چالاککردنەوە";
    showConfirm(`دڵنیایت لە ${actionText}ی کاتیی ئەم پسپۆڕە؟`, async (confirmed) => {
      if (confirmed) {
        try {
          await toggleSuspendProfessional(id, isSuspended);
          loadData();
        } catch (error) {
          showAlert(`کێشەیەک ڕوویدا لە ${actionText}ەکە.`);
        }
      }
    });
  };

  const handleDelete = async (id: string) => {
    showConfirm("دڵنیایت لە سڕینەوەی ئەم کەسە بە یەکجاری؟ ئەم کارە هەڵناوەشێتەوە!", async (confirmed) => {
      if (confirmed) {
        try {
          await deleteProfessional(id);
          loadData();
        } catch (error) {
          showAlert("کێشەیەک ڕوویدا لە سڕینەوەکە.");
        }
      }
    });
  };

  const handleDeleteUser = async (id: string) => {
    showConfirm("دڵنیایت لە سڕینەوەی ئەم بەکارهێنەرە بە یەکجاری؟ هەموو زانیارییەکانی دەسڕێتەوە!", async (confirmed) => {
      if (confirmed) {
        try {
          const { deleteUser } = await import("../actions");
          await deleteUser(id);
          loadData();
        } catch (error) {
          showAlert("کێشەیەک ڕوویدا لە سڕینەوەی بەکارهێنەرەکە.");
        }
      }
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 p-4 pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 mt-2">
        <Link href="/" className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm text-xl border border-gray-100 dark:border-gray-700 flex-shrink-0 active:scale-95 transition-transform">
          🔙
        </Link>
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">پەڕەی ئەدمین</h1>
      </div>

      {/* Tabs Navigation */}
      <div className="grid grid-cols-4 gap-2 bg-white dark:bg-gray-800 rounded-xl p-2 mb-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <button 
          onClick={() => changeTab("approved")}
          className={`py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === "approved" ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" : "text-gray-500 dark:text-gray-400"}`}
        >
          بەشداربوان
        </button>
        <button 
          onClick={() => changeTab("pending")}
          className={`py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === "pending" ? "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300" : "text-gray-500 dark:text-gray-400"}`}
        >
          چاوەڕوانی
        </button>
        <button 
          onClick={() => changeTab("suspended")}
          className={`py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === "suspended" ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300" : "text-gray-500 dark:text-gray-400"}`}
        >
          ڕاگیراوەکان
        </button>
        <button 
          onClick={() => changeTab("banners")}
          className={`py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === "banners" ? "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300" : "text-gray-500 dark:text-gray-400"}`}
        >
          باڵۆنەکان
        </button>
        <button 
          onClick={() => changeTab("users")}
          className={`py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === "users" ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300" : "text-gray-500 dark:text-gray-400"}`}
        >
          بەکارهێنەران
        </button>
        <button 
          onClick={() => changeTab("messages")}
          className={`py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === "messages" ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300" : "text-gray-500 dark:text-gray-400"}`}
        >
          کۆنتێر
        </button>
        <button 
          onClick={() => changeTab("announcements")}
          className={`py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === "announcements" ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300" : "text-gray-500 dark:text-gray-400"}`}
        >
          بڵاوکراوە
        </button>
        <button 
          onClick={() => changeTab("blocked")}
          className={`py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === "blocked" ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300" : "text-gray-500 dark:text-gray-400"}`}
        >
          بلۆککراوەکان
        </button>
      </div>

      {/* Search Bar for user lists */}
      {(activeTab === "approved" || activeTab === "pending" || activeTab === "users" || activeTab === "blocked" || activeTab === "suspended") && (
        <div className="mb-4">
          <input 
            type="text"
            placeholder="گەڕان بەپێی ناو یان ژمارە مۆبایل..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>
      )}

      {/* Content Area */}
      {loading ? (
        <div className="flex flex-col gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : activeTab === "banners" ? (
        // BANNERS TAB
        <div className="flex flex-col gap-6">
          {/* Add New Banner Form */}
          <form onSubmit={handleAddBanner} className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              <ImageIcon size={18} className="text-cyan-600 dark:text-cyan-400" />
              زیادکردنی وێنەی باڵۆن / سڵایدر نوێ
            </h2>

            {/* Image File Selector */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">
                وێنەی باڵۆن (پێویستە)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleBannerFileChange}
                className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-cyan-50 file:text-cyan-700 dark:file:bg-cyan-900/30 dark:file:text-cyan-300 hover:file:bg-cyan-100"
                required
              />
              {bannerFilePreview && (
                <div className="mt-3 w-full h-36 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 relative">
                  <img src={bannerFilePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <input
              type="text"
              placeholder="سەردێڕ یان ناونیشانی باڵۆن (ئارەزوومەندانە)..."
              value={bannerTitle}
              onChange={(e) => setBannerTitle(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />

            <input
              type="text"
              placeholder="کۆدی بەستەر یان لینکی خاوەن (ئارەزوومەندانە، نموونە: /search)..."
              value={bannerLinkUrl}
              onChange={(e) => setBannerLinkUrl(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              dir="ltr"
            />

            <button
              type="submit"
              disabled={addingBanner}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 rounded-xl shadow-md active:scale-95 transition-transform disabled:opacity-70 text-sm"
            >
              {addingBanner ? "خەریکی بارکردنە..." : "زیادکردنی باڵۆن"}
            </button>
          </form>

          {/* Banners List */}
          <div>
            <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-3">لیستی باڵۆنە چالاکەکان</h3>
            {bannersList.length === 0 ? (
              <div className="text-center text-gray-400 py-8 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-sm">
                هیچ باڵۆنێک زیاد نەکراوە!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bannersList.map((banner) => (
                  <div key={banner.id} className="bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-3">
                    <div className="w-full h-32 rounded-xl overflow-hidden relative bg-gray-100 dark:bg-gray-900">
                      <img src={banner.image_url} alt={banner.title || "Banner"} className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg text-white ${banner.is_active ? "bg-green-500" : "bg-gray-500"}`}>
                          {banner.is_active ? "چالاک" : "ناچالاک"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 px-1">
                      <h4 className="font-bold text-sm text-gray-800 dark:text-gray-100">
                        {banner.title || "بێ سەردێڕ"}
                      </h4>
                      {banner.link_url && (
                        <p className="text-xs text-gray-400 truncate" dir="ltr">
                          🔗 {banner.link_url}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                      <button
                        onClick={() => handleToggleBanner(banner.id, banner.is_active)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-transform active:scale-95 flex items-center justify-center gap-1 ${
                          banner.is_active
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                            : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        }`}
                      >
                        {banner.is_active ? "ناچالاککردن" : "چالاککردن"}
                      </button>

                      <button
                        onClick={() => handleDeleteBannerItem(banner.id)}
                        className="py-2 px-4 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-xl text-xs font-bold active:scale-95 transition-transform flex items-center justify-center gap-1"
                      >
                        <Trash2 size={14} />
                        سڕینەوە
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : activeTab === "announcements" ? (
        // ANNOUNCEMENTS TAB
        <div className="flex flex-col gap-6">
          <form onSubmit={handlePostAnnouncement} className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Send size={18} className="text-purple-600 dark:text-purple-400" />
              ناردنی پەیامی نوێ بۆ بەکارهێنەران
            </h2>
            <input
              type="text"
              placeholder="سەردێڕی پەیام..."
              value={announcementTitle}
              onChange={(e) => setAnnouncementTitle(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 mb-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              required
            />
            <textarea
              placeholder="ناوەڕۆکی پەیامەکەت بنووسە..."
              value={announcementContent}
              onChange={(e) => setAnnouncementContent(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 mb-3 h-32 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              required
            />
            <button
              type="submit"
              disabled={postingAnnouncement}
              className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl shadow-md active:scale-95 transition-transform disabled:opacity-70 text-sm"
            >
              {postingAnnouncement ? "چاوەڕێ بکە..." : "بڵاوکردنەوە"}
            </button>
          </form>

          <div>
            <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-3">پەیامەکانی پێشوو</h3>
            {announcements.length === 0 ? (
              <div className="text-center text-gray-400 py-6 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                هیچ پەیامێک نییە!
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-2">
                    <div className="flex justify-between items-start border-b border-gray-100 dark:border-gray-700 pb-2">
                      <h3 className="font-bold text-gray-800 dark:text-gray-100">{announcement.title}</h3>
                      <span className="text-xs text-gray-400 flex items-center gap-1" dir="ltr">
                        <Clock size={12} />
                        {new Date(announcement.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="mt-2 text-gray-800 dark:text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                      {announcement.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : activeTab === "users" ? (
        // USERS TAB
        <div className="flex flex-col gap-3">
          {usersList.length === 0 ? (
            <p className="text-center text-gray-500 py-10">هیچ بەکارهێنەرێک نەدۆزرایەوە</p>
          ) : (
            usersList.map((user) => (
              <div key={user.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold overflow-hidden flex-shrink-0">
                    {user.photo_url ? (
                      <img src={user.photo_url} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user.name.charAt(0)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm truncate">{user.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5" dir="ltr" style={{ textAlign: "right" }}>
                      📞 {user.phone}
                    </p>
                    {user.cities && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        📍 {user.cities.name_ku}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${user.role === "admin" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"}`}>
                      {user.role === "admin" ? "ئەدمین" : "بەکارهێنەر"}
                    </span>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                  <button 
                    onClick={async () => {
                      showConfirm("دڵنیایت لە ڕاگرتنی (بلۆککردن)ی ئەم بەکارهێنەرە؟", async (confirmed) => {
                        if (confirmed) {
                          const { toggleBlockUser } = await import("../actions");
                          await toggleBlockUser(user.id, true);
                          loadData();
                        }
                      });
                    }}
                    className="flex-1 py-2 bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 rounded-lg text-xs font-bold transition-colors"
                  >
                    بلۆککردن
                  </button>
                  <button 
                    onClick={() => handleDeleteUser(user.id)}
                    className="flex-1 py-2 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-lg text-xs font-bold transition-colors"
                  >
                    سڕینەوە
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : activeTab === "blocked" ? (
        // BLOCKED USERS TAB
        <div className="flex flex-col gap-3">
          {blockedList.length === 0 ? (
            <p className="text-center text-gray-500 py-10">هیچ بەکارهێنەرێکی بلۆککراو نییە</p>
          ) : (
            blockedList.map((user) => (
              <div key={user.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-red-100 dark:border-red-900/40">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 font-bold overflow-hidden flex-shrink-0">
                    {user.photo_url ? (
                      <img src={user.photo_url} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user.name.charAt(0)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm truncate">{user.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5" dir="ltr" style={{ textAlign: "right" }}>
                      📞 {user.phone}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                      بلۆککراو
                    </span>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                  <button 
                    onClick={async () => {
                      showConfirm("دڵنیایت لە لابردنی بلۆکی ئەم بەکارهێنەرە؟", async (confirmed) => {
                        if (confirmed) {
                          const { toggleBlockUser } = await import("../actions");
                          await toggleBlockUser(user.id, false);
                          loadData();
                        }
                      });
                    }}
                    className="flex-1 py-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-lg text-xs font-bold transition-colors shadow-sm"
                  >
                    لابردنی بلۆک
                  </button>
                  <button 
                    onClick={() => handleDeleteUser(user.id)}
                    className="flex-1 py-2 bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400 rounded-lg text-xs font-medium transition-colors"
                  >
                    سڕینەوە
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : activeTab === "messages" ? (
        // MESSAGES TAB
        messages.length === 0 ? (
          <div className="text-center text-gray-400 py-10 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-sm">
            هیچ پەیامێک نییە!
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((msg) => (
              <div key={msg.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-2">
                <div className="flex justify-between items-start border-b border-gray-100 dark:border-gray-700 pb-2">
                  <h3 className="font-bold text-gray-800 dark:text-gray-100">{msg.sender_name}</h3>
                  <span className="text-xs text-gray-400" dir="ltr">{new Date(msg.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1" dir="ltr" style={{textAlign: "right"}}>📞 {msg.phone}</p>
                <div className="mt-2 text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 p-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.message_text}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        // PROFESSIONALS TABS (Approved, Pending, or Suspended)
        (activeTab === "approved" ? approved : activeTab === "suspended" ? suspended : pending).length === 0 ? (
          <div className="text-center text-gray-400 py-10 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-sm">
            هیچ کەسێک نەدۆزرایەوە!
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {(activeTab === "approved" ? approved : activeTab === "suspended" ? suspended : pending).map((prof) => (
              <div key={prof.id} className={`bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border flex flex-col gap-3 relative overflow-hidden ${
                activeTab === "pending" ? "border-orange-100 dark:border-orange-900/50" : 
                activeTab === "suspended" ? "border-amber-100 dark:border-amber-900/50" : 
                "border-gray-100 dark:border-gray-700"
              }`}>
                <div className={`absolute top-0 right-0 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl ${
                  activeTab === "pending" ? "bg-orange-500" : 
                  activeTab === "suspended" ? "bg-amber-500" : 
                  "bg-blue-500"
                }`}>
                  {activeTab === "pending" ? "چاوەڕێی قبوڵکردن" : activeTab === "suspended" ? "ڕاگرتنی کاتی" : "پەسەندکراو"}
                </div>
                
                <div className="mt-2 flex gap-3 items-start">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-xl flex-shrink-0 overflow-hidden">
                    {prof.photo_url ? (
                      <img src={prof.photo_url} alt={prof.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">{prof.name}</h3>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1">
                      <p className="bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded-md inline-block mb-1 border border-gray-100 dark:border-gray-700">
                        🆔 ئایدی: <span dir="ltr" className="font-mono text-blue-600 dark:text-blue-400 font-bold">{prof.phone}</span>
                      </p>
                      <p>📍 شار: {prof.cities?.name_ku}</p>
                      <p>💼 پیشە: {prof.categories?.icon} {prof.categories?.name_ku}</p>
                      <p>⭐ ئەزموون: {prof.experience_years} ساڵ</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                  {activeTab === "pending" && (
                    <button 
                      onClick={() => handleApprove(prof.id)}
                      className="flex-1 bg-green-500 text-white py-2 rounded-xl text-sm font-bold active:scale-95 transition-transform"
                    >
                      قبوڵکردن
                    </button>
                  )}
                  {activeTab === "approved" && (
                    <button 
                      onClick={() => handleSuspend(prof.id, true)}
                      className="flex-1 bg-amber-500 text-white py-2 rounded-xl text-sm font-bold active:scale-95 transition-transform"
                    >
                      ڕاگرتنی کاتی
                    </button>
                  )}
                  {activeTab === "suspended" && (
                    <button 
                      onClick={() => handleSuspend(prof.id, false)}
                      className="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-sm font-bold active:scale-95 transition-transform"
                    >
                      چالاککردنەوە
                    </button>
                  )}
                  <button 
                    onClick={async () => {
                      showConfirm("دڵنیایت لە ڕاگرتنی (بلۆککردن)ی ئەم بەکارهێنەرە؟", async (confirmed) => {
                        if (confirmed) {
                          await toggleBlockProfessional(prof.id);
                          loadData();
                        }
                      });
                    }}
                    className="flex-1 bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 py-2 rounded-xl text-sm font-bold active:scale-95 transition-transform"
                  >
                    بلۆککردن
                  </button>
                  <button 
                    onClick={() => handleDelete(prof.id)}
                    className="flex-1 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-900/30 py-2 rounded-xl text-sm font-bold active:scale-95 transition-transform"
                  >
                    سڕینەوە
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

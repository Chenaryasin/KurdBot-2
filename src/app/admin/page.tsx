"use client";

import { useEffect, useState } from "react";
import { 
  getPendingProfessionalsSearch, 
  getAdminApprovedProfessionals, 
  approveProfessional, 
  deleteProfessional,
  getMessages,
  getAdminAnnouncements,
  postAnnouncement
} from "../actions";
import Link from "next/link";
import { Send, Clock } from "lucide-react";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"approved" | "pending" | "messages" | "announcements">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [pending, setPending] = useState<any[]>([]);
  const [approved, setApproved] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);

  // Restore tab state on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTab = sessionStorage.getItem("adminActiveTab") as any;
      if (savedTab === "approved" || savedTab === "pending" || savedTab === "messages" || savedTab === "announcements") {
        setActiveTab(savedTab);
      }
    }
  }, []);

  const changeTab = (tab: "approved" | "pending" | "messages" | "announcements") => {
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
    } else if (activeTab === "messages") {
      const data = await getMessages();
      setMessages(data);
    } else if (activeTab === "announcements") {
      const data = await getAdminAnnouncements();
      setAnnouncements(data);
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
      alert("هەڵەیەک ڕوویدا لە ناردنی پەیامەکە: " + res.error);
    }
  };

  // Reload when tab or search query changes
  useEffect(() => {
    // Add a slight debounce for search
    const delay = setTimeout(() => loadData(), 300);
    return () => clearTimeout(delay);
  }, [activeTab, searchQuery]);

  const handleApprove = async (id: string) => {
    if (confirm("دڵنیایت لە قبوڵکردنی ئەم وەستایە؟")) {
      try {
        await approveProfessional(id);
        loadData();
      } catch (error) {
        alert("کێشەیەک ڕوویدا لە قبوڵکردنەکە.");
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("دڵنیایت لە سڕینەوەی ئەم کەسە بە یەکجاری؟ ئەم کارە هەڵناوەشێتەوە!")) {
      try {
        await deleteProfessional(id);
        loadData();
      } catch (error) {
        alert("کێشەیەک ڕوویدا لە سڕینەوەکە.");
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-4 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link href="/" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-xl border border-gray-100 flex-shrink-0">
          🔙
        </Link>
        <h1 className="text-xl font-bold text-gray-800">پەڕەی ئەدمین</h1>
      </div>

      {/* Tabs */}
      <div className="flex bg-white rounded-xl p-1 mb-4 shadow-sm border border-gray-100 flex-wrap">
        <button 
          onClick={() => changeTab("approved")}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === "approved" ? "bg-blue-100 text-blue-700" : "text-gray-500"}`}
        >
          بەشداربوان
        </button>
        <button 
          onClick={() => changeTab("pending")}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === "pending" ? "bg-orange-100 text-orange-700" : "text-gray-500"}`}
        >
          چاوەڕوانی
        </button>
        <button 
          onClick={() => changeTab("messages")}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === "messages" ? "bg-green-100 text-green-700" : "text-gray-500"}`}
        >
          کۆنتێر
        </button>
        <button 
          onClick={() => changeTab("announcements")}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === "announcements" ? "bg-purple-100 text-purple-700" : "text-gray-500"}`}
        >
          بڵاوکراوەکان
        </button>
      </div>

      {/* Search Bar (Only for Approved and Pending) */}
      {(activeTab === "approved" || activeTab === "pending") && (
        <div className="mb-4">
          <input 
            type="text"
            placeholder="گەڕان بەپێی ناو یان ژمارە مۆبایل..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>
      )}

      {/* Content Area */}
      {loading ? (
        <div className="text-center text-gray-400 py-10">خەریکی گەڕانە...</div>
      ) : activeTab === "announcements" ? (
        <div className="flex flex-col gap-6">
          <form onSubmit={handlePostAnnouncement} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Send size={18} className="text-purple-600" />
              ناردنی پەیامی نوێ بۆ بەکارهێنەران
            </h2>
            <input
              type="text"
              placeholder="سەردێڕی پەیام..."
              value={announcementTitle}
              onChange={(e) => setAnnouncementTitle(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 mb-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
            <textarea
              placeholder="ناوەڕۆکی پەیامەکەت بنووسە..."
              value={announcementContent}
              onChange={(e) => setAnnouncementContent(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 mb-3 h-32 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
            <button
              type="submit"
              disabled={postingAnnouncement}
              className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl shadow-md active:scale-95 transition-transform disabled:opacity-70"
            >
              {postingAnnouncement ? "چاوەڕێ بکە..." : "بڵاوکردنەوە"}
            </button>
          </form>

          <div>
            <h3 className="font-bold text-gray-700 mb-3">پەیامەکانی پێشوو</h3>
            {announcements.length === 0 ? (
              <div className="text-center text-gray-400 py-6 bg-white rounded-2xl border border-dashed border-gray-200">
                هیچ پەیامێک نییە!
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
                    <div className="flex justify-between items-start border-b pb-2">
                      <h3 className="font-bold text-gray-800">{announcement.title}</h3>
                      <span className="text-xs text-gray-400 flex items-center gap-1" dir="ltr">
                        <Clock size={12} />
                        {new Date(announcement.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="mt-2 text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                      {announcement.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : activeTab === "messages" ? (
        // MESSAGES TAB
        messages.length === 0 ? (
          <div className="text-center text-gray-400 py-10 bg-white rounded-2xl border border-dashed border-gray-200">
            هیچ پەیامێک نییە!
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((msg) => (
              <div key={msg.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
                <div className="flex justify-between items-start border-b pb-2">
                  <h3 className="font-bold text-gray-800">{msg.sender_name}</h3>
                  <span className="text-xs text-gray-400" dir="ltr">{new Date(msg.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1" dir="ltr" style={{textAlign: "right"}}>📞 {msg.phone}</p>
                <div className="mt-2 text-gray-800 bg-gray-50 p-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.message_text}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        // PROFESSIONALS TABS (Approved or Pending)
        (activeTab === "approved" ? approved : pending).length === 0 ? (
          <div className="text-center text-gray-400 py-10 bg-white rounded-2xl border border-dashed border-gray-200">
            هیچ کەسێک نەدۆزرایەوە!
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {(activeTab === "approved" ? approved : pending).map((prof) => (
              <div key={prof.id} className={`bg-white p-4 rounded-2xl shadow-sm border flex flex-col gap-3 relative overflow-hidden ${activeTab === "pending" ? "border-orange-100" : "border-gray-100"}`}>
                <div className={`absolute top-0 right-0 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl ${activeTab === "pending" ? "bg-orange-500" : "bg-blue-500"}`}>
                  {activeTab === "pending" ? "چاوەڕێی قبوڵکردن" : "پەسەندکراو"}
                </div>
                
                <div className="mt-2 flex gap-3 items-start">
                  <Link href={`/profile/${prof.id}`} className="block flex-shrink-0 active:scale-95 transition-transform">
                    {prof.photo_url ? (
                      <img src={prof.photo_url} alt={prof.name} className="w-16 h-16 rounded-xl object-cover border border-gray-100 shadow-sm" />
                    ) : (
                      <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center text-3xl border border-blue-100">
                        {prof.categories?.icon || '👤'}
                      </div>
                    )}
                  </Link>
                  <div className="w-full">
                    <div className="flex justify-between items-center w-full">
                      <h3 className="font-bold text-gray-800 text-lg">{prof.name}</h3>
                    </div>
                    <div className="text-sm text-gray-600 mt-2 space-y-1">
                      <p className="bg-gray-50 px-2 py-1 rounded-md inline-block mb-1 border border-gray-100">
                        🆔 ئایدی: <span dir="ltr" className="font-mono text-blue-600 font-bold">{prof.phone}</span>
                      </p>
                      <p>📍 شار: {prof.cities?.name_ku}</p>
                      <p>💼 پیشە: {prof.categories?.icon} {prof.categories?.name_ku}</p>
                      <p>⭐ ئەزموون: {prof.experience_years} ساڵ</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t flex gap-2">
                  {activeTab === "pending" && (
                    <button 
                      onClick={() => handleApprove(prof.id)}
                      className="flex-1 bg-green-500 text-white py-2 rounded-xl text-sm font-bold active:scale-95 transition-transform"
                    >
                      قبوڵکردن
                    </button>
                  )}
                  <button 
                    onClick={() => handleDelete(prof.id)}
                    className="flex-1 bg-red-50 text-red-600 border border-red-200 py-2 rounded-xl text-sm font-bold active:scale-95 transition-transform"
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

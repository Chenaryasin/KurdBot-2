"use client";

import { useState } from "react";
import Link from "next/link";
import { sendMessage } from "../actions";

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: "", phone: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await sendMessage(formData);
    
    if (result.success) {
      setSuccess(true);
    } else {
      alert("کێشەیەک ڕوویدا لە ناردنی پەیامەکە: " + result.error);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-4 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-xl border border-gray-100 flex-shrink-0">
          🔙
        </Link>
        <h1 className="text-xl font-bold text-gray-800">پەیوەندیکردن</h1>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
        <p className="text-gray-600 text-sm mb-6 leading-relaxed">
          ئەگەر هەر پرسیارێک، ڕەخنەیەک، یان کێشەیەکت هەیە، دەتوانیت لە ڕێگەی ئەم فۆڕمەوە پەیامەکەت بەڕێ بکەیت بۆ بەڕێوەبەر (ئەدمین).
        </p>

        {success ? (
          <div className="bg-green-50 border border-green-200 p-6 rounded-2xl text-center">
            <div className="text-4xl mb-2">✅</div>
            <h3 className="font-bold text-green-800 mb-2">پەیامەکەت نێردرا!</h3>
            <p className="text-green-600 text-sm mb-4">سوپاس بۆ پەیوەندیکردنەکەت، بە زووترین کات دەیخوێنینەوە.</p>
            <Link href="/" className="inline-block bg-green-600 text-white font-medium py-3 px-6 rounded-xl text-sm">
              گەڕانەوە بۆ سەرەتا
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">ناوی تەواو</label>
              <input 
                type="text" 
                required 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ناوت لێرە بنووسە"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">ژمارەی مۆبایل</label>
              <input 
                type="tel" 
                dir="ltr"
                required 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                placeholder="0750 000 0000"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">پەیامەکەت</label>
              <textarea 
                required 
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="پەیامەکەت لێرە بنووسە..."
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full text-white font-bold py-4 rounded-xl mt-2 transition-all ${
                loading ? "bg-gray-400" : "bg-blue-600 active:scale-95 shadow-md shadow-blue-200"
              }`}
            >
              {loading ? "چاوەڕێ بکە..." : "ناردنی پەیام"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { getPendingProfessionals, approveProfessional } from "../actions";

export default function AdminPage() {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    const data = await getPendingProfessionals();
    setPending(data);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id: string) => {
    if (confirm("دڵنیایت لە قبوڵکردنی ئەم وەستایە؟")) {
      try {
        await approveProfessional(id);
        // Refresh list
        loadData();
      } catch (error) {
        alert("کێشەیەک ڕوویدا لە قبوڵکردنەکە.");
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-4 pb-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">پەڕەی ئەدمین - وەستا چاوەڕوانکراوەکان</h1>

      {loading ? (
        <div className="text-center text-gray-400 py-10">خەریکی گەڕانە...</div>
      ) : pending.length === 0 ? (
        <div className="text-center text-gray-400 py-10 bg-white rounded-2xl border border-dashed border-gray-200">
          هیچ وەستایەک لە چاوەڕوانیدا نییە!
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {pending.map((prof) => (
            <div key={prof.id} className="bg-white p-4 rounded-2xl shadow-sm border border-red-100 flex flex-col gap-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                چاوەڕێی قبوڵکردن
              </div>
              
              <div className="mt-2">
                <h3 className="font-bold text-gray-800 text-lg">{prof.name}</h3>
                <div className="text-sm text-gray-600 mt-2 space-y-1">
                  <p>📞 مۆبایل: <span dir="ltr" className="font-mono">{prof.phone}</span></p>
                  <p>📍 شار: {prof.cities?.name_ku}</p>
                  <p>💼 پیشە: {prof.categories?.icon} {prof.categories?.name_ku}</p>
                  <p>⭐ ئەزموون: {prof.experience_years} ساڵ</p>
                </div>
              </div>

              <div className="mt-2 flex gap-2">
                <button 
                  onClick={() => handleApprove(prof.id)}
                  className="flex-1 bg-green-500 text-white py-2 rounded-xl text-sm font-bold active:scale-95 transition-transform"
                >
                  قبوڵکردن (Approve)
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

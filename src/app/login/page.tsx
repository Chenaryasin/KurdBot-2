"use client";

import { useState } from "react";
import { checkPhoneExists, loginWithPassword } from "../auth-actions";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState(1); // 1: Phone, 2: Password
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setLoading(true);
    setError("");

    const res = await checkPhoneExists(phone);
    if (res.exists) {
      setStep(2);
    } else {
      setError("هیچ هەژمارێک لەسەر ئەم ژمارەیە نییە، تکایە ئەکاونت دروستبکە");
    }
    setLoading(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError("");

    const res = await loginWithPassword(phone, password);
    if (res.success) {
      router.push("/");
    } else {
      setError(res.error || "هەڵەیەک ڕوویدا");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-6">
          چوونەژوورەوە
        </h1>

        {step === 1 ? (
          <form onSubmit={handlePhoneSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ژمارەی مۆبایل
              </label>
              <input
                type="tel"
                dir="ltr"
                placeholder="0750 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border ${error ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                required
              />
              {error && <p className="mt-2 text-sm text-red-500 font-medium">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? "چاوەڕێبە..." : "بەردەوام بە"}
            </button>
            
            <div className="text-center mt-6">
              <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                ئەکاونتت نییە؟ دروستکردنی ئەکاونت
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                وشەی نهێنی
              </label>
              <input
                type="password"
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border ${error ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                required
              />
              {error && <p className="mt-2 text-sm text-red-500 font-medium">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? "چاوەڕێبە..." : "چوونەژوورەوە"}
            </button>

            <div className="flex justify-between items-center mt-6 text-sm">
              <button 
                type="button" 
                onClick={() => setStep(1)} 
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                گۆڕینی ژمارە
              </button>
              <Link href={`/forgot-password?phone=${phone}`} className="text-red-500 hover:text-red-600 font-medium">
                وشەی نهێنیت بیرچووە؟
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

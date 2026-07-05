"use client";

import { useState, useEffect } from "react";
import { registerUser } from "../auth-actions";
import { getCities } from "../actions";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function RegisterPage() {
  const router = useRouter();
  
  // Steps: 1: Details, 2: OTP, 3: Password
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [cities, setCities] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    city_id: ""
  });
  
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    getCities().then(setCities);
  }, []);

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible'
      });
    }
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      setupRecaptcha();
      const appVerifier = (window as any).recaptchaVerifier;
      
      const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
      const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
      
      let phoneNumber = formData.phone.trim().replace(/\s+/g, '');
      for (let i = 0; i < 10; i++) {
        phoneNumber = phoneNumber.split(arabicNumbers[i]).join(i.toString())
                               .split(persianNumbers[i]).join(i.toString());
      }

      if (phoneNumber.startsWith("0")) {
        phoneNumber = "+964" + phoneNumber.substring(1);
      } else if (!phoneNumber.startsWith("+")) {
        phoneNumber = "+964" + phoneNumber;
      }

      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(confirmation);
      setStep(2);
    } catch (err: any) {
      console.error(err);
      setError(`کێشە: ${err.message || 'نەتوانرا کۆد بنێردرێت'}`);
    }

    setLoading(false);
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    setLoading(true);
    setError("");

    try {
      await confirmationResult.confirm(otp);
      // OTP Verified successfully!
      setStep(3);
    } catch (err: any) {
      console.error(err);
      setError(`کۆدەکە هەڵەیە: ${err.message || 'بەسەرچووە'}`);
    }
    setLoading(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("وشە نهێنییەکان وەک یەک نین");
      return;
    }
    if (password.length < 6) {
      setError("وشەی نهێنی دەبێت لانی کەم ٦ پیت/ژمارە بێت");
      return;
    }

    setLoading(true);
    setError("");

    const res = await registerUser({
      name: formData.name,
      phone: formData.phone,
      city_id: parseInt(formData.city_id),
      password: password
    });

    if (res.success) {
      router.push("/");
    } else {
      setError(res.error || "کێشەیەک ڕوویدا");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-6">
          دروستکردنی هەژماری نوێ
        </h1>

        <div id="recaptcha-container"></div>

        {step === 1 && (
          <form onSubmit={handleDetailsSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ناوی تەواو</label>
              <input
                type="text"
                placeholder="ناوی سیانیت بنووسە"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ژمارەی مۆبایل</label>
              <input
                type="tel"
                dir="ltr"
                placeholder="0750 123 4567"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">شار</label>
              <select
                value={formData.city_id}
                onChange={(e) => setFormData({...formData, city_id: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">شارەکەت هەڵبژێرە</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>{city.name_ku}</option>
                ))}
              </select>
            </div>

            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl mt-4 transition-colors disabled:opacity-50"
            >
              {loading ? "چاوەڕێبە..." : "ناردنی کۆدی دڵنیایی"}
            </button>

            <div className="text-center mt-4">
              <Link href="/login" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 text-sm font-medium">
                پێشتر هەژمارت هەیە؟ چوونەژوورەوە
              </Link>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                کۆدێکی ٦ ژمارەییمان نارد بۆ <span dir="ltr" className="font-bold">{formData.phone}</span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">کۆدی دڵنیایی (OTP)</label>
              <input
                type="text"
                dir="ltr"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-3 text-center tracking-widest text-xl rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={6}
                required
              />
              {error && <p className="mt-2 text-sm text-red-500 font-medium">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? "چاوەڕێبە..." : "پشتڕاستکردنەوە"}
            </button>

            <button 
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-gray-500 hover:text-gray-700 text-sm mt-4 font-medium"
            >
              گۆڕینی ژمارە
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-green-600 font-bold mb-1">ژمارەکەت بە سەرکەوتوویی پشتڕاستکرایەوە! ✅</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">تکایە وشەیەکی نهێنی بۆ هەژمارەکەت دابنێ</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">وشەی نهێنی نوێ</label>
              <input
                type="password"
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">دڵنیابوونەوەی وشەی نهێنی</label>
              <input
                type="password"
                dir="ltr"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl mt-4 transition-colors disabled:opacity-50"
            >
              {loading ? "چاوەڕێبە..." : "تەواوکردنی دروستکردن"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

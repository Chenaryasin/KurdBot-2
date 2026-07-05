"use client";

import { Suspense, useState, useEffect } from "react";
import { resetPassword, checkPhoneExists, loginWithPassword } from "../auth-actions";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { auth } from "@/lib/firebase";

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPhone = searchParams.get("phone") || "";
  
  // Steps: 1: Phone, 2: OTP, 3: New Password
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [phone, setPhone] = useState(initialPhone);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible'
      });
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // 1. Check if user exists
    const check = await checkPhoneExists(phone);
    if (!check.exists) {
      setError("هیچ هەژمارێک بەم ژمارەیە نییە");
      setLoading(false);
      return;
    }

    try {
      setupRecaptcha();
      const appVerifier = (window as any).recaptchaVerifier;
      
      let phoneNumber = phone;
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
      setError("کێشەیەک لە ناردنی کۆدەکە ڕوویدا، دڵنیابە لە دروستی ژمارەکەت.");
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
      setStep(3);
    } catch (err) {
      console.error(err);
      setError("کۆدەکە هەڵەیە یان بەسەرچووە.");
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

    const res = await resetPassword(phone, password);
    if (res.success) {
      // Auto login after reset
      await loginWithPassword(phone, password);
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
          گێڕانەوەی وشەی نهێنی
        </h1>

        <div id="recaptcha-container"></div>

        {step === 1 && (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
              ژمارە مۆبایلەکەت بنووسە بۆ ئەوەی کۆدی گۆڕینی وشەی نهێنیت بۆ بنێرین.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ژمارەی مۆبایل</label>
              <input
                type="tel"
                dir="ltr"
                placeholder="0750 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
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
                گەڕانەوە بۆ چوونەژوورەوە
              </Link>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                کۆدێکی ٦ ژمارەییمان نارد بۆ <span dir="ltr" className="font-bold">{phone}</span>
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
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">تکایە وشەیەکی نهێنی نوێ دابنێ</p>
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
              {loading ? "چاوەڕێبە..." : "گۆڕینی وشەی نهێنی"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div>چاوەڕێبە...</div>}>
      <ForgotPasswordContent />
    </Suspense>
  );
}

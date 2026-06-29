import type { Metadata } from "next";
import { Noto_Kufi_Arabic } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const notoKufi = Noto_Kufi_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-kufi",
});

export const metadata: Metadata = {
  title: "خزمەتگوزارییەکانم",
  description: "دۆزینەوەی باشترین وەستا و پسپۆڕەکان لە کوردستان و عێراق",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ku" dir="rtl">
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      <body
        className={`${notoKufi.variable} antialiased bg-gray-50 text-gray-900 font-sans`}
      >
        <main className="max-w-md mx-auto min-h-screen bg-white shadow-xl relative overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}

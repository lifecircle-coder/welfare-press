import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'block', // Use 'block' to prevent layout shift by hiding text until font is ready
});

export const metadata: Metadata = {
  title: "복지뉴스 - 전국민을 위한 복지 전문 뉴스",
  description: "어르신, 육아, 일자리 등 다양한 복지 정보를 제공합니다.",
};

import VisitorTracker from "@/components/VisitorTracker";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* Preconnect to Supabase for faster API calls */}
        <link rel="preconnect" href="https://wvocjgtnsjdzonhyzbic.supabase.co" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} font-sans flex flex-col min-h-screen bg-gray-50`}>
        <VisitorTracker />
        {children}
      </body>
    </html>
  );
}

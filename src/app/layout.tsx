import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap', // Reverting to swap as 'block' caused visual issues for the user
});

export const metadata: Metadata = {
  metadataBase: new URL("https://thebok.co.kr"),
  title: {
    default: "THE 복(福)지 : 복지신문 - 전국민을 위한 복지 전문 뉴스",
    template: "%s | THE 복(福)지"
  },
  description: "어르신, 청년, 육아, 일자리 등 전 연령층을 위한 맞춤형 복지 정책과 최신 뉴스 정보를 제공합니다.",
  keywords: ["복지신문", "복지뉴스", "청년정책", "노인복지", "육아지원", "일자리정보", "주거지원"],
  authors: [{ name: "THE 복지 편집팀" }],
  creator: "THE 복지",
  publisher: "THE 복지",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "THE 복(福)지 : 복지신문",
    description: "전국민을 위한 복지 전문 뉴스. 어르신, 청년, 육아, 일자리 등 다양한 복지 정보를 한눈에 확인하세요.",
    url: "https://thebok.co.kr",
    siteName: "THE 복(福)지",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "/logo.svg", // 기본 공유 이미지 (SVG)
        width: 1200,
        height: 630,
        alt: "THE 복(福)지 로고",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "THE 복(福)지 : 복지신문",
    description: "전국민을 위한 복지 전문 뉴스",
    images: ["/logo.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "2U7-3FigWK-r7CpCEKcRfxXYTrQeNd55wNyDqZUqB_M",
    other: {
      "naver-site-verification": "4b4c529cffd43ccda111b368ef5bfdc4b6179fd3",
    },
  },
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
        <link rel="preconnect" href="https://thebok.co.kr" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} font-sans flex flex-col min-h-screen bg-gray-50`}>
        <VisitorTracker />
        {children}
      </body>
      {/* ============================================================ */}
      {/* Google Tag Manager (GTM-PB5L2XHF) - Next.js 공식 방식 */}
      {/* ============================================================ */}
      <GoogleTagManager gtmId="GTM-PB5L2XHF" />
      {/* ============================================================ */}
      {/* Google Analytics 4 (G-CWETJC71EC) - Next.js 공식 방식 */}
      {/* ============================================================ */}
      <GoogleAnalytics gaId="G-CWETJC71EC" />
    </html>
  );
}

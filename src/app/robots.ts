import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/api',
          '/auth',
          '/mypage',
          '/login',
        ],
      },
      {
        userAgent: 'Yeti', // Naver Search Robot
        allow: '/',
      },
      {
        userAgent: 'Googlebot', // Google Search Robot
        allow: '/',
      }
    ],
    sitemap: 'https://thebok.co.kr/sitemap.xml',
  }
}

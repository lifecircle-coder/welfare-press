import { MetadataRoute } from 'next'
import { getArticles } from '@/lib/services'

const BASE_URL = 'https://thebok.co.kr'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Fetch all published articles (Limit to 1000 for sitemap)
  const articles = await getArticles(1000)
  
  const articleEntries: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${BASE_URL}/article/${article.id}`,
    lastModified: article.updated_at || article.created_at || new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  // 2. Static Pages & Categories
  const categories = ['all', 'childcare', 'jobs', 'housing', 'health', 'safety']
  const categoryEntries: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${BASE_URL}/news/${cat}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }))

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    ...categoryEntries,
    ...articleEntries,
  ]
}

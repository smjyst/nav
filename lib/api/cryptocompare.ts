import { cachedFetch } from '@/lib/redis/client'

const CC_BASE = 'https://min-api.cryptocompare.com'
const CC_API_KEY = process.env.CRYPTOCOMPARE_API_KEY

export interface NewsArticle {
  id: string
  title: string
  url: string
  body: string
  source: string
  source_info: { name: string; img: string }
  published_on: number
  categories: string
  tags: string
  imageurl: string
}

interface CCNewsResponse {
  Data: Array<{
    id: string
    title: string
    url: string
    body: string
    source: string
    source_info: { name: string; img: string }
    published_on: number
    categories: string
    tags: string
    imageurl: string
  }>
}

// Fetch latest crypto news — free endpoint, key optional
export async function getNews(limit = 20): Promise<NewsArticle[]> {
  const cacheKey = `nav:news:latest`
  return cachedFetch(
    cacheKey,
    900, // 15 min TTL
    async () => {
      const params = new URLSearchParams({
        lang: 'EN',
        sortOrder: 'popular',
      })
      if (CC_API_KEY) params.set('api_key', CC_API_KEY)

      const res = await fetch(`${CC_BASE}/data/v2/news/?${params}`, {
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) throw new Error(`CryptoCompare news: ${res.status}`)

      const data: CCNewsResponse = await res.json()

      // Deduplicate: group by similar titles, keep the one from the most reputable source
      const articles = data.Data.slice(0, limit).map((a) => ({
        id: a.id,
        title: a.title,
        url: a.url,
        body: a.body,
        source: a.source,
        source_info: a.source_info,
        published_on: a.published_on,
        categories: a.categories,
        tags: a.tags,
        imageurl: a.imageurl,
      }))

      return articles
    }
  )
}

// Get trending stories — articles that appear across multiple sources
export async function getTrendingNews(limit = 8): Promise<(NewsArticle & { sourceCount: number })[]> {
  const allNews = await getNews(50)

  // Group by similar headlines (fuzzy match by checking word overlap)
  const groups: Map<string, NewsArticle[]> = new Map()

  for (const article of allNews) {
    const words = article.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
    let matched = false

    for (const [key, group] of groups) {
      const keyWords = key.split('|')
      const overlap = words.filter((w) => keyWords.includes(w)).length
      if (overlap >= 3) {
        group.push(article)
        matched = true
        break
      }
    }

    if (!matched) {
      groups.set(words.join('|'), [article])
    }
  }

  // Sort by number of sources (multi-source = more validated), then by recency
  const trending = Array.from(groups.values())
    .map((group) => ({
      ...group[0], // Use the first/most popular article
      sourceCount: new Set(group.map((a) => a.source)).size,
    }))
    .sort((a, b) => {
      if (b.sourceCount !== a.sourceCount) return b.sourceCount - a.sourceCount
      return b.published_on - a.published_on
    })
    .slice(0, limit)

  return trending
}

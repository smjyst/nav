import { cachedFetch } from '@/lib/redis/client'

const CD_BASE = 'https://data-api.coindesk.com'
const CD_API_KEY = process.env.COINDESK_API_KEY

export interface NewsArticle {
  id: string
  title: string
  url: string
  body: string
  source: string
  source_info: { name: string; img?: string }
  published_on: number
  categories: string
  sentiment: string
  imageurl: string
}

interface CDArticle {
  ID: number
  TITLE: string
  URL: string
  BODY: string
  IMAGE_URL: string
  PUBLISHED_ON: number
  SENTIMENT: string
  KEYWORDS: string
  SOURCE_DATA: {
    NAME: string
    IMAGE_URL: string
    SOURCE_KEY: string
  }
  CATEGORY_DATA: Array<{ NAME: string; CATEGORY: string }>
}

interface CDNewsResponse {
  Data: CDArticle[]
  Err: Record<string, unknown>
}

/** Fetch latest crypto news from CoinDesk Data API */
export async function getNews(limit = 20): Promise<NewsArticle[]> {
  const cacheKey = 'nav:news:latest'
  return cachedFetch(
    cacheKey,
    900, // 15 min TTL
    async () => {
      const params = new URLSearchParams({
        limit: String(Math.min(limit, 50)),
        lang: 'EN',
      })

      const headers: Record<string, string> = { Accept: 'application/json' }
      if (CD_API_KEY) headers['x-api-key'] = CD_API_KEY

      const res = await fetch(`${CD_BASE}/news/v1/article/list?${params}`, { headers })
      if (!res.ok) throw new Error(`CoinDesk news: ${res.status}`)

      const data: CDNewsResponse = await res.json()

      const articles: NewsArticle[] = (data.Data ?? []).map((a) => ({
        id: String(a.ID),
        title: a.TITLE,
        url: a.URL,
        body: a.BODY ?? '',
        source: a.SOURCE_DATA?.SOURCE_KEY ?? '',
        source_info: {
          name: a.SOURCE_DATA?.NAME ?? '',
          img: a.SOURCE_DATA?.IMAGE_URL,
        },
        published_on: a.PUBLISHED_ON,
        categories: (a.CATEGORY_DATA ?? []).map((c) => c.NAME).join('|'),
        sentiment: a.SENTIMENT ?? '',
        imageurl: a.IMAGE_URL ?? '',
      }))

      return articles
    },
  )
}

/** Get trending stories — articles grouped by similar headlines across multiple sources */
export async function getTrendingNews(
  limit = 8,
): Promise<(NewsArticle & { sourceCount: number })[]> {
  const allNews = await getNews(50)

  // Group by similar headlines (fuzzy match via word overlap)
  const groups: Map<string, NewsArticle[]> = new Map()

  for (const article of allNews) {
    const words = article.title
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3)
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

  // Sort by source count (multi-source = validated), then by recency
  const trending = Array.from(groups.values())
    .map((group) => ({
      ...group[0],
      sourceCount: new Set(group.map((a) => a.source)).size,
    }))
    .sort((a, b) => {
      if (b.sourceCount !== a.sourceCount) return b.sourceCount - a.sourceCount
      return b.published_on - a.published_on
    })
    .slice(0, limit)

  return trending
}

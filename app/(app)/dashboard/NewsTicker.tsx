'use client'

import { useEffect, useState, useRef } from 'react'
import { ExternalLink, Newspaper, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react'

interface NewsItem {
  id: string
  title: string
  url: string
  source: string
  source_info: { name: string }
  published_on: number
  categories: string
  sourceCount: number
}

function timeAgo(ts: number): string {
  const diff = Math.floor(Date.now() / 1000 - ts)
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function NewsTicker() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/market/news')
      .then((r) => r.json())
      .then((d) => setNews(d.news ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function scroll(dir: 'left' | 'right') {
    if (!scrollRef.current) return
    const amount = 340
    scrollRef.current.scrollBy({
      left: dir === 'left' ? -amount : amount,
      behavior: 'smooth',
    })
  }

  if (loading) {
    return (
      <div className="flex gap-3 overflow-hidden">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="min-w-[320px] h-[88px] bg-[#141414] border border-[#1f1f1f] rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (news.length === 0) return null

  return (
    <div className="relative group">
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <Newspaper size={14} className="text-[#6366f1]" />
          <h2 className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Trending Stories</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => scroll('left')}
            className="p-1 rounded-md text-[#4b5563] hover:text-white hover:bg-[#1c1c1c] transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-1 rounded-md text-[#4b5563] hover:text-white hover:bg-[#1c1c1c] transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Scrollable news cards */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {news.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-[320px] max-w-[320px] bg-[#141414]/80 backdrop-blur-sm border border-[#1f1f1f] rounded-xl p-3.5 hover:border-[#2a2a2a] hover:bg-[#1c1c1c] transition-all group/card flex-shrink-0"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-[13px] font-medium text-[#e5e7eb] leading-snug line-clamp-2 group-hover/card:text-white transition-colors">
                {item.title}
              </h3>
              <ExternalLink size={12} className="text-[#4b5563] group-hover/card:text-[#6366f1] shrink-0 mt-0.5 transition-colors" />
            </div>
            <div className="flex items-center gap-2 text-[10px] text-[#6b7280]">
              <span className="font-medium">{item.source_info?.name || item.source}</span>
              <span>·</span>
              <span>{timeAgo(item.published_on)}</span>
              {item.sourceCount > 1 && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-0.5 text-[#6366f1]">
                    <TrendingUp size={9} />
                    {item.sourceCount} sources
                  </span>
                </>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

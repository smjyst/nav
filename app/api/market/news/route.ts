import { NextResponse } from 'next/server'
import { getTrendingNews } from '@/lib/api/coindesk'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const news = await getTrendingNews(10)
    return NextResponse.json({ news }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=120' },
    })
  } catch {
    return NextResponse.json({ news: [] }, { status: 200 })
  }
}

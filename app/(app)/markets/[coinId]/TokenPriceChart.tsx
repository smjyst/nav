'use client'

import PriceChart from '@/components/conviction/PriceChart'

interface TokenPriceChartProps {
  prices7d: number[]
  prices30d: number[]
  currentPrice: number
}

export default function TokenPriceChart({
  prices7d,
  prices30d,
  currentPrice,
}: TokenPriceChartProps) {
  return (
    <PriceChart
      prices7d={prices7d}
      prices30d={prices30d}
      currentPrice={currentPrice}
    />
  )
}

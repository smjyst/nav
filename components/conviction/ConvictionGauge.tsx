'use client'

import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { getConvictionColors, getConvictionLabel } from '@/lib/utils/conviction'
import type { ConvictionOutlook, ConvictionConfidence } from '@/lib/supabase/types'

interface ConvictionGaugeProps {
  score: number
  outlook: ConvictionOutlook
  confidence: ConvictionConfidence
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  showConfidence?: boolean
  animated?: boolean
}

const SIZES = {
  sm:  { svg: 80,  stroke: 6,  textSize: 'text-xl',  labelSize: 'text-[10px]' },
  md:  { svg: 120, stroke: 8,  textSize: 'text-3xl',  labelSize: 'text-xs' },
  lg:  { svg: 160, stroke: 10, textSize: 'text-5xl',  labelSize: 'text-sm' },
}

const CONFIDENCE_COLORS: Record<ConvictionConfidence, string> = {
  low:    '#4b5563',
  medium: '#6b7280',
  high:   '#9ca3af',
}

export default function ConvictionGauge({
  score,
  outlook,
  confidence,
  size = 'md',
  showLabel = true,
  showConfidence = true,
  animated = true,
}: ConvictionGaugeProps) {
  const { svg: svgSize, stroke, textSize, labelSize } = SIZES[size]
  const colors = getConvictionColors(outlook)
  const motionScore = useMotionValue(0)

  const center    = svgSize / 2
  const radius    = center - stroke - 4
  const circumference = 2 * Math.PI * radius

  // Arc spans 270° (from 135° to 405°, i.e. bottom-left to bottom-right)
  const arcLength = circumference * 0.75
  const filledArc = (score / 100) * arcLength
  const gapArc    = arcLength - filledArc

  // Start angle: 135° (7 o'clock position)
  const startAngle = 135
  const rotation   = `rotate(${startAngle} ${center} ${center})`

  // Background track arc
  const trackOffset = -(circumference * 0.25 / 2) // center the gap at top

  // Animated score number
  const displayScore = useTransform(motionScore, (v) => Math.round(v).toString())

  useEffect(() => {
    if (!animated) {
      motionScore.set(score)
      return
    }
    const controls = animate(motionScore, score, {
      duration: 0.8,
      ease: [0.4, 0, 0.2, 1],
    })
    return controls.stop
  }, [score, animated, motionScore])

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#1f2937"
            strokeWidth={stroke}
            strokeDasharray={`${arcLength} ${circumference - arcLength}`}
            strokeDashoffset={-circumference * 0.125} // rotate start to 135°
            transform={rotation}
            strokeLinecap="round"
          />

          {/* Filled arc (animated via SVG stroke-dasharray) */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={colors.arc}
            strokeWidth={stroke}
            strokeLinecap="round"
            transform={rotation}
            initial={{
              strokeDasharray: `0 ${circumference}`,
              strokeDashoffset: -circumference * 0.125,
            }}
            animate={animated ? {
              strokeDasharray: `${filledArc} ${circumference - filledArc}`,
              strokeDashoffset: -circumference * 0.125,
            } : undefined}
            style={!animated ? {
              strokeDasharray: `${filledArc} ${circumference - filledArc}`,
              strokeDashoffset: -circumference * 0.125,
            } : undefined}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          />
        </svg>

        {/* Centred score number */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className={`font-bold leading-none ${textSize}`}
            style={{ color: colors.text }}
          >
            {animated ? <motion.span>{displayScore}</motion.span> : score}
          </motion.span>
        </div>
      </div>

      {/* Label + confidence */}
      <div className="flex flex-col items-center gap-1">
        {showLabel && (
          <span
            className={`font-semibold tracking-widest uppercase ${labelSize}`}
            style={{ color: colors.text }}
          >
            {outlook}
          </span>
        )}
        {showConfidence && (
          <div className="flex items-center gap-1">
            {(['low', 'medium', 'high'] as ConvictionConfidence[]).map((level) => (
              <div
                key={level}
                className="w-1.5 h-1.5 rounded-full transition-colors"
                style={{
                  backgroundColor: level === confidence
                    ? CONFIDENCE_COLORS[confidence]
                    : '#1f2937',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

import type { ReactNode } from 'react'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

type Sentiments = {
  stability: number
  attention: number
  curiosity: number
  corporate_blame: number
  government_blame: number
}

type SentimentDeltas = Partial<Record<keyof Sentiments, number>>

const SENTIMENT_META: Array<{
  key: keyof Sentiments
  label: string
  barClass: string
}> = [
  {
    key: 'stability',
    label: 'Stability',
    barClass: 'bg-sky-500',
  },
  {
    key: 'attention',
    label: 'Attention',
    barClass: 'bg-amber-500',
  },
  {
    key: 'curiosity',
    label: 'Curiosity',
    barClass: 'bg-indigo-500',
  },
  {
    key: 'corporate_blame',
    label: 'Corporate Blame',
    barClass: 'bg-rose-500',
  },
  {
    key: 'government_blame',
    label: 'Government Blame',
    barClass: 'bg-emerald-500',
  },
]

export function SentimentBars({
  sentiments,
  title = 'Public Mood Board',
  deltas,
  footer,
}: {
  sentiments: Sentiments
  title?: string
  deltas?: SentimentDeltas
  footer?: ReactNode
}) {
  return (
    <Card className="neo-panel gap-5 py-4">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-0">
        <CardTitle className="font-display text-2xl text-black sm:text-3xl">{title}</CardTitle>
        <Badge className="rounded-full border border-black bg-white px-2.5 py-1 text-xs uppercase text-black">
          Scale: 0 to 100
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4 pb-2">
        {SENTIMENT_META.map((item) => {
          const value = clampSentiment(sentiments[item.key])
          const rawDelta = deltas?.[item.key]
          const roundedDelta =
            typeof rawDelta === 'number' && Number.isFinite(rawDelta)
              ? roundToSingleDecimal(rawDelta)
              : undefined
          const deltaLabel =
            roundedDelta === undefined
              ? null
              : roundedDelta > 0
                ? `↑ ${Math.abs(roundedDelta)}`
                : roundedDelta < 0
                  ? `↓ ${Math.abs(roundedDelta)}`
                  : '→ 0'
          const isLargeShift = roundedDelta !== undefined && Math.abs(roundedDelta) > 10
          const deltaToneClass =
            roundedDelta === undefined
              ? ''
              : roundedDelta > 0
                ? 'bg-emerald-200 text-emerald-900'
                : roundedDelta < 0
                  ? 'bg-rose-200 text-rose-900'
                  : 'bg-white text-black'

          return (
            <div className="space-y-2" key={item.key}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <p className="font-heading text-base uppercase tracking-[0.06em] text-black">
                    {item.label}
                  </p>
                  {deltaLabel ? (
                    <Badge
                      className={`rounded-full border border-black px-2 py-0.5 font-mono text-xs ${deltaToneClass} ${isLargeShift ? 'font-bold' : ''}`}
                    >
                      {deltaLabel}
                    </Badge>
                  ) : null}
                </div>
                <Badge className="rounded-full border border-black bg-white px-2 py-0.5 font-mono text-xs text-black">
                  {Math.round(value)}
                </Badge>
              </div>
              <div className="h-5 overflow-hidden rounded-full border-2 border-black bg-black/10">
                <div
                  className={`h-full rounded-full ${item.barClass} transition-[width] duration-500`}
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          )
        })}

        {footer ? <div className="pt-2">{footer}</div> : null}
      </CardContent>
    </Card>
  )
}

function clampSentiment(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  if (value < 0) {
    return 0
  }

  if (value > 100) {
    return 100
  }

  return value
}

function roundToSingleDecimal(value: number): number {
  return Math.round(value * 10) / 10
}

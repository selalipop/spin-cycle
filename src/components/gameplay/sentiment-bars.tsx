import { Card, Chip } from '@heroui/react'

type Sentiments = {
  stability: number
  attention: number
  curiosity: number
  corporate_blame: number
  government_blame: number
}

const SENTIMENT_META: Array<{
  key: keyof Sentiments
  label: string
  barClass: string
}> = [
  {
    key: 'stability',
    label: 'Stability',
    barClass: 'bg-sky-400',
  },
  {
    key: 'attention',
    label: 'Attention',
    barClass: 'bg-amber-400',
  },
  {
    key: 'curiosity',
    label: 'Curiosity',
    barClass: 'bg-indigo-400',
  },
  {
    key: 'corporate_blame',
    label: 'Corporate Blame',
    barClass: 'bg-rose-400',
  },
  {
    key: 'government_blame',
    label: 'Government Blame',
    barClass: 'bg-emerald-400',
  },
]

export function SentimentBars({
  sentiments,
  title = 'Public Sentiment',
}: {
  sentiments: Sentiments
  title?: string
}) {
  return (
    <Card className="border border-zinc-700/70 bg-zinc-950/70">
      <Card.Header className="flex items-center justify-between gap-3">
        <Card.Title className="text-xl">{title}</Card.Title>
        <Chip className="bg-zinc-700/70 text-zinc-100">Scale 0-100</Chip>
      </Card.Header>
      <Card.Content className="space-y-4 pb-6">
        {SENTIMENT_META.map((item) => {
          const value = clampSentiment(sentiments[item.key])

          return (
            <div className="space-y-2" key={item.key}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-zinc-100 sm:text-base">{item.label}</p>
                <Chip className="bg-zinc-800 text-zinc-100" size="sm">
                  {Math.round(value)}
                </Chip>
              </div>
              <div className="h-4 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className={`h-full rounded-full ${item.barClass} transition-[width] duration-500`}
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          )
        })}
      </Card.Content>
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

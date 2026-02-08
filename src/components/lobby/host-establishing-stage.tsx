import { Card, Chip, Spinner } from '@heroui/react'

export type EstablishingStage = 'loading' | 'video' | 'brief'

export function HostEstablishingStage({
  stage,
  scenarioTitle,
  event,
  introVideo,
  onVideoEnded,
  onVideoError,
}: {
  stage: EstablishingStage
  scenarioTitle: string
  event: string
  introVideo: string
  onVideoEnded: () => void
  onVideoError: () => void
}) {
  if (stage === 'loading') {
    return (
      <Card className="border border-zinc-700/70 bg-zinc-900/70">
        <Card.Content className="flex min-h-[360px] items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <Spinner size="lg" />
            <p className="text-lg font-medium text-zinc-100">Calibrating live newsroom feeds...</p>
            <p className="max-w-xl text-sm text-zinc-300">
              The main screen is preparing the opening sequence for all players.
            </p>
          </div>
        </Card.Content>
      </Card>
    )
  }

  if (stage === 'video') {
    const videoSrc = introVideo.startsWith('http')
      ? introVideo
      : `/${introVideo.replace(/^\/+/, '')}`

    return (
      <Card className="border border-zinc-700/70 bg-zinc-900/70">
        <Card.Header>
          <div className="space-y-2">
            <Card.Title className="text-2xl">{scenarioTitle}</Card.Title>
            <Card.Description className="text-zinc-300">Establishing Sequence</Card.Description>
          </div>
        </Card.Header>
        <Card.Content className="space-y-4">
          <video
            autoPlay
            className="aspect-video w-full rounded-xl border border-zinc-700/70 bg-black"
            controls
            onEnded={onVideoEnded}
            onError={onVideoError}
            playsInline
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
          <p className="text-sm text-zinc-300">
            Intro clip is playing on the main screen. Once it finishes, you can launch round 1.
          </p>
        </Card.Content>
      </Card>
    )
  }

  return (
    <Card className="border border-zinc-700/70 bg-zinc-900/70">
      <Card.Header className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <Card.Title className="text-2xl">{scenarioTitle}</Card.Title>
          <Card.Description className="text-zinc-300">Preparing For Round 1</Card.Description>
        </div>
        <Chip className="bg-amber-500/25 text-amber-200">News Brief</Chip>
      </Card.Header>
      <Card.Content className="space-y-6">
        <div className="rounded-xl border border-zinc-700/70 bg-zinc-900/70 p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Current Situation</p>
          <p className="mt-3 text-lg leading-relaxed text-zinc-100">{event}</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-zinc-700/70 bg-zinc-900/70 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Public Mood</p>
            <p className="mt-2 text-sm text-zinc-200">Uncertain and highly reactive.</p>
          </div>
          <div className="rounded-xl border border-zinc-700/70 bg-zinc-900/70 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Media Climate</p>
            <p className="mt-2 text-sm text-zinc-200">Coverage is fragmenting across platforms.</p>
          </div>
          <div className="rounded-xl border border-zinc-700/70 bg-zinc-900/70 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Strategic Prompt</p>
            <p className="mt-2 text-sm text-zinc-200">Set your narrative before others define it.</p>
          </div>
        </div>
      </Card.Content>
    </Card>
  )
}

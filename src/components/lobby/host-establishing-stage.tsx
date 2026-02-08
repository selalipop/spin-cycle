import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { WashingMachineLoader } from '~/components/ui/washing-machine-loader'

export type OpeningStage = 'loading' | 'video' | 'briefing'

export function HostEstablishingStage({
  stage,
  scenarioTitle,
  event,
  introVideo,
  showVideo,
  onVideoEnded,
  onVideoError,
  startRoundLabel,
  startRoundDisabled,
  onStartRound,
  error,
}: {
  stage: OpeningStage
  scenarioTitle: string
  event: string
  introVideo: string
  showVideo: boolean
  onVideoEnded: () => void
  onVideoError: () => void
  startRoundLabel?: string
  startRoundDisabled?: boolean
  onStartRound?: () => void
  error?: string | null
}) {
  if (stage === 'loading') {
    return (
      <Card className="neo-panel py-0">
        <CardContent className="flex min-h-[380px] items-center justify-center px-6 py-10">
          <div className="flex max-w-xl flex-col items-center gap-4 text-center">
            <WashingMachineLoader />
            <p className="font-heading text-2xl text-black">Preparing the opening scene.</p>
            <p className="text-base text-black/92">
              Generating or loading the round intro footage.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (stage === 'video' && showVideo) {
    const videoSrc = introVideo.startsWith('http') ? introVideo : `/${introVideo.replace(/^\/+/, '')}`

    return (
      <Card className="neo-panel gap-4 overflow-hidden py-4">
        <CardHeader className="gap-3 pb-0">
          <Badge className="w-fit rounded-full border border-black bg-rose-300 px-3 py-1 text-xs uppercase text-black">
            Opening Scene
          </Badge>
          <CardTitle className="font-display text-3xl text-black sm:text-4xl">{scenarioTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <video
            autoPlay
            className="w-full rounded-xl border-2 border-black bg-black"
            controls
            onEnded={onVideoEnded}
            onError={onVideoError}
            playsInline
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
          <div className="neo-panel-soft reel-panel p-4">
            <p className="neo-label text-black/78">Escalation</p>
            <p className="reel-text mt-2 text-black ">{event}</p>
          </div>
          <p className="text-base text-black/90">
            Once the clip ends, you can start the round.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="neo-panel neo-grid gap-5 py-4">
     

      <CardContent className="space-y-5">
        <div className="neo-panel-soft reel-panel p-5">
          <p className="neo-label text-black/78">Escalation</p>
          <p className="reel-text mt-3 text-black">{event}</p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="neo-panel-soft p-4">
            <p className="neo-label text-black/78">Team Goal</p>
            <p className="mt-2 text-base text-black/88">Work together and post one strong move per round.</p>
          </div>
          <div className="neo-panel-soft p-4">
            <p className="neo-label text-black/78">The Twist</p>
            <p className="mt-2 text-base text-black/88">Every faction wants the public mood to land in different places.</p>
          </div>
          <div className="neo-panel-soft p-4">
            <p className="neo-label text-black/78">Host Cue</p>
            <p className="mt-2 text-base text-black/88">Start the round when teams are ready to craft their spin.</p>
          </div>
        </div>

        {onStartRound ? (
          <Button
            className="h-11 w-full border-2 border-black font-heading text-sm uppercase tracking-[0.08em]"
            disabled={startRoundDisabled}
            onClick={onStartRound}
            type="button"
          >
            {startRoundLabel ?? 'Start Round'}
          </Button>
        ) : null}

        {error ? (
          <Badge className="w-fit rounded-full border border-black bg-destructive px-3 py-1 text-xs text-destructive-foreground">
            {error}
          </Badge>
        ) : null}
      </CardContent>
    </Card>
  )
}

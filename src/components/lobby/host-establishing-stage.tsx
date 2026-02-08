import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Spinner } from '~/components/ui/spinner'

export type OpeningStage = 'loading' | 'video' | 'briefing'

export function HostEstablishingStage({
  stage,
  scenarioTitle,
  event,
  introVideo,
  onVideoEnded,
  onVideoError,
}: {
  stage: OpeningStage
  scenarioTitle: string
  event: string
  introVideo: string
  onVideoEnded: () => void
  onVideoError: () => void
}) {
  if (stage === 'loading') {
    return (
      <Card className="neo-panel py-0">
        <CardContent className="flex min-h-[380px] items-center justify-center px-6 py-10">
          <div className="flex max-w-xl flex-col items-center gap-4 text-center">
            <Spinner className="size-9 text-black" />
            <p className="font-heading text-2xl text-black">Preparing the opening scene.</p>
            <p className="text-sm text-black/70">
              We are loading the intro clip and story briefing for everyone in the room.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (stage === 'video') {
    const videoSrc = introVideo.startsWith('http') ? introVideo : `/${introVideo.replace(/^\/+/, '')}`

    return (
      <Card className="neo-panel gap-4 overflow-hidden py-4">
        <CardHeader className="gap-3 pb-0">
          <Badge className="w-fit rounded-full border border-black bg-rose-300 px-3 py-1 text-[0.68rem] uppercase text-black">
            Opening Scene
          </Badge>
          <CardTitle className="font-display text-3xl text-black sm:text-4xl">{scenarioTitle}</CardTitle>
          <CardDescription className="text-black/75">
            Play this clip, then move into round one.
          </CardDescription>
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
          <p className="text-sm text-black/75">
            Once the clip finishes, launch the first round from the control panel.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="neo-panel neo-grid gap-5 py-4">
      <CardHeader className="gap-3 pb-0">
        <div className="flex flex-wrap items-center gap-3">
          <CardTitle className="font-display text-3xl text-black sm:text-4xl">{scenarioTitle}</CardTitle>
          <Badge className="rounded-full border border-black bg-amber-300 px-3 py-1 text-[0.68rem] uppercase text-black">
            Story Brief
          </Badge>
        </div>
        <CardDescription className="text-black/70">
          Give players the setup, then begin round one.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="neo-panel-soft p-5">
          <p className="neo-label text-black/60">What Just Happened</p>
          <p className="mt-3 text-lg leading-relaxed text-black">{event}</p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="neo-panel-soft p-4">
            <p className="neo-label text-black/60">Team Goal</p>
            <p className="mt-2 text-sm text-black/80">Work together and post one strong move per round.</p>
          </div>
          <div className="neo-panel-soft p-4">
            <p className="neo-label text-black/60">The Twist</p>
            <p className="mt-2 text-sm text-black/80">Every faction wants the public mood to land in different places.</p>
          </div>
          <div className="neo-panel-soft p-4">
            <p className="neo-label text-black/60">Host Cue</p>
            <p className="mt-2 text-sm text-black/80">Start round one when the room is ready to craft their spin.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

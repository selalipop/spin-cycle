import { useEffect, useMemo, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useAction, useMutation, useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { OpeningStage } from '~/components/lobby/host-establishing-stage'
import { PhaseHoldingScreen } from '~/components/gameplay/phase-holding-screen'
import { SentimentBars } from '~/components/gameplay/sentiment-bars'
import { HostEstablishingStage } from '~/components/lobby/host-establishing-stage'
import { FactionCard } from '~/components/lobby/faction-card'
import { PageShell } from '~/components/lobby/page-shell'
import { PlayerListItem } from '~/components/lobby/player-list-item'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Spinner } from '~/components/ui/spinner'
import { getFactionTheme } from '~/lib/factions'

export const Route = createFileRoute('/game/$gameId/host')({
  component: HostWaitingRoom,
})

function HostWaitingRoom() {
  const { gameId } = Route.useParams()
  const lobby = useQuery(api.lobby.getGameLobby, { gameId })
  const roundState = useQuery(api.gameplay.getMainScreenRoundState, { gameId })

  const startGame = useMutation(api.lobby.startGame)
  const startRoundOne = useMutation(api.lobby.startRoundOne)
  const advanceSubmittingToResolving = useMutation(api.gameplay.advanceSubmittingToResolving)
  const generatePlanningBriefings = useAction(api.gameplay.generatePlanningBriefings)

  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [videoFailed, setVideoFailed] = useState(false)
  const [openingStage, setOpeningStage] = useState<OpeningStage>('loading')
  const [planningStatus, setPlanningStatus] = useState<'idle' | 'running' | 'ready' | 'error'>(
    'idle',
  )
  const [nowMs, setNowMs] = useState(() => Date.now())

  const planningTriggerRef = useRef<string | null>(null)
  const timeoutTriggerRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!lobby || lobby.phase !== 'game_introduction') {
      setOpeningStage('loading')
      setVideoFailed(false)
      return
    }

    setVideoFailed(false)
    setOpeningStage('loading')

    const timer = window.setTimeout(() => {
      setOpeningStage('video')
    }, 800)

    return () => {
      window.clearTimeout(timer)
    }
  }, [lobby?.gameId, lobby?.phase])

  useEffect(() => {
    if (!roundState || roundState.phase !== 'round_loading' || !roundState.roundNumber) {
      if (planningStatus !== 'error') {
        setPlanningStatus('idle')
      }
      return
    }

    const planningKey = `${roundState.gameId}:${roundState.roundNumber}`

    if (planningTriggerRef.current === planningKey) {
      return
    }

    planningTriggerRef.current = planningKey
    setPlanningStatus('running')

    void generatePlanningBriefings({ gameId: roundState.gameId })
      .then(() => {
        setPlanningStatus('ready')
      })
      .catch(() => {
        setPlanningStatus('error')
        setError('Briefing generation failed. Refresh to retry.')
      })
  }, [generatePlanningBriefings, planningStatus, roundState])

  useEffect(() => {
    if (!roundState || roundState.phase !== 'round_voting') {
      return
    }

    const timer = window.setInterval(() => {
      setNowMs(Date.now())
    }, 200)

    return () => {
      window.clearInterval(timer)
    }
  }, [roundState?.phase])

  useEffect(() => {
    if (
      !roundState ||
      roundState.phase !== 'round_voting' ||
      !roundState.submittingDeadlineMs ||
      !roundState.roundNumber
    ) {
      return
    }

    const timeoutKey = `${roundState.gameId}:${roundState.roundNumber}`
    const deadlineReached = nowMs >= roundState.submittingDeadlineMs

    if (!deadlineReached || timeoutTriggerRef.current.has(timeoutKey)) {
      return
    }

    timeoutTriggerRef.current.add(timeoutKey)

    void advanceSubmittingToResolving({
      gameId: roundState.gameId,
      reason: 'timeout',
    }).catch(() => {
      setError('Could not advance after timeout. Please refresh.')
    })
  }, [advanceSubmittingToResolving, nowMs, roundState])

  const joinUrl = useMemo(() => {
    if (!lobby || typeof window === 'undefined') {
      return ''
    }

    return `${window.location.origin}/join/${lobby.joinCode}`
  }, [lobby])

  const qrCodeUrl = useMemo(() => {
    if (!joinUrl) {
      return ''
    }

    return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(joinUrl)}`
  }, [joinUrl])

  const handleStart = async () => {
    if (!lobby) {
      return
    }

    if (lobby.phase === 'game_introduction' && openingStage !== 'briefing') {
      return
    }

    setError(null)
    setIsStarting(true)

    try {
      if (lobby.phase === 'game_lobby') {
        await startGame({ gameId: lobby.gameId })
      } else if (lobby.phase === 'game_introduction') {
        await startRoundOne({ gameId: lobby.gameId })
      }
    } catch {
      setError('Could not continue the game. Please try again.')
    } finally {
      setIsStarting(false)
    }
  }

  if (lobby === undefined) {
    return (
      <PageShell title="Loading Host Desk" subtitle="Syncing room state.">
        <Card className="neo-panel py-0">
          <CardContent className="flex items-center gap-3 px-6 py-6">
            <Spinner className="size-5 text-black" />
            <p className="text-sm text-black/90">Loading host dashboard...</p>
          </CardContent>
        </Card>
      </PageShell>
    )
  }

  if (lobby === null) {
    return (
      <PageShell title="Room Not Found" subtitle="This host link is invalid or expired.">
        <Card className="neo-panel py-0">
          <CardContent className="space-y-4 px-6 py-6">
            <p className="text-sm text-black/90">Start a new game from the home screen.</p>
            <Button
              className="h-10 border-2 border-black font-heading text-xs uppercase tracking-[0.08em]"
              onClick={() => window.location.assign('/')}
              type="button"
            >
              Back Home
            </Button>
          </CardContent>
        </Card>
      </PageShell>
    )
  }

  if (lobby.phase === 'game_introduction') {
    const canStartRoundOne = openingStage === 'briefing'

    return (
      <PageShell
        eyebrow="Main Display"
        title="Opening Scene"
      >
        <section className="grid gap-4 xl:grid-cols-[minmax(0,320px)_1fr]">
          <Card className="neo-panel neo-grid gap-4 py-4">
            <CardHeader className="gap-3 pb-0">
              <CardTitle className="font-display text-3xl text-black">Control Desk</CardTitle>
              <CardDescription className="text-black/90">
                Continue when the clip and story brief are complete.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pb-2">
              <div className="space-y-1">
                <p className="neo-label text-black/78">Join Code</p>
                <p className="neo-code text-4xl font-semibold text-black">{lobby.joinCode}</p>
              </div>


              <Button
                className="h-11 w-full border-2 border-black font-heading text-xs uppercase tracking-[0.08em]"
                disabled={isStarting || !canStartRoundOne}
                onClick={handleStart}
                type="button"
              >
                {isStarting
                  ? 'Starting Round 1...'
                  : openingStage === 'loading'
                    ? 'Preparing Scene...'
                    : openingStage === 'video'
                      ? 'Finish Clip To Continue'
                      : 'Start Round 1'}
              </Button>

              {videoFailed ? (
                <Badge className="w-fit rounded-full border border-black bg-amber-300 px-3 py-1 text-[0.68rem] text-black">
                  Intro clip failed to load. You can still continue.
                </Badge>
              ) : null}

              {error ? (
                <Badge className="w-fit rounded-full border border-black bg-destructive px-3 py-1 text-[0.68rem] text-destructive-foreground">
                  {error}
                </Badge>
              ) : null}
            </CardContent>
          </Card>

          <HostEstablishingStage
            event={lobby.event}
            introVideo={lobby.introVideo}
            onVideoEnded={() => setOpeningStage('briefing')}
            onVideoError={() => {
              setVideoFailed(true)
              setOpeningStage('briefing')
            }}
            scenarioTitle={lobby.scenarioTitle}
            stage={openingStage}
          />
        </section>
      </PageShell>
    )
  }

  if (lobby.phase === 'game_lobby') {
    return (
      <PageShell
      >
        <section className="grid gap-4 xl:grid-cols-[minmax(0,360px)_1fr]">
          <Card className="neo-panel neo-grid gap-4 py-4">
            <CardHeader className="gap-3 pb-0">
              <CardTitle className="font-display text-3xl text-black">Join Here!</CardTitle>
              <CardDescription className="text-black/90">
                Share this code or QR so everyone can join.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pb-2">
              <p className="neo-code text-5xl font-semibold text-black">{lobby.joinCode}</p>


              {joinUrl ? (
                <p className="break-all rounded-xl border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black/92" title={joinUrl}>
                  {joinUrl}
                </p>
              ) : null}

              {qrCodeUrl ? (
                <img
                  alt="QR code for joining this game"
                  className="mx-auto w-full max-w-[200px] rounded-xl border-2 border-black bg-white p-2"
                  src={qrCodeUrl}
                />
              ) : null}

              <Button
                className="h-11 w-full border-2 border-black font-heading text-xs uppercase tracking-[0.08em]"
                disabled={isStarting}
                onClick={handleStart}
                type="button"
              >
                {isStarting ? 'Starting...' : 'Start Game'}
              </Button>

              {error ? (
                <Badge className="w-fit rounded-full border border-black bg-destructive px-3 py-1 text-[0.68rem] text-destructive-foreground">
                  {error}
                </Badge>
              ) : null}
            </CardContent>
          </Card>

          <Card className="neo-panel gap-4 py-4">
            <CardHeader className="gap-3 pb-0">
              <CardTitle className="font-display text-3xl text-black">Your Teams</CardTitle>
       
            </CardHeader>
            <CardContent className="grid gap-4 pb-2 md:grid-cols-2">
              {lobby.factions.map((faction) => (
                <div className="space-y-3" key={faction.id}>
                  <FactionCard
                    className="h-40"
                    code={faction.code}
                    description={faction.description}
                    name={faction.name}
                    playerCount={faction.playerCount}
                  />
                  {faction.players.length === 0 ? (
                    <Card className="neo-panel-soft py-0">
                      <CardContent className="px-4 py-3">
                        <p className="text-sm text-black/82">No players yet.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    faction.players.map((player) => (
                      <PlayerListItem avatar={player.avatar} key={player.id} name={player.name} />
                    ))
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </PageShell>
    )
  }

  if (roundState === undefined) {
    return (
      <PageShell title="Loading Round" subtitle="Pulling current round status.">
        <Card className="neo-panel py-0">
          <CardContent className="flex items-center gap-3 px-6 py-6">
            <Spinner className="size-5 text-black" />
            <p className="text-sm text-black/90">Loading round data...</p>
          </CardContent>
        </Card>
      </PageShell>
    )
  }

  if (roundState === null) {
    return (
      <PageShell title="Room Not Found" subtitle="No active game for this host link.">
        <Card className="neo-panel py-0">
          <CardContent className="space-y-4 px-6 py-6">
            <p className="text-sm text-black/90">Try creating a new game from the homepage.</p>
            <Button
              className="h-10 border-2 border-black font-heading text-xs uppercase tracking-[0.08em]"
              onClick={() => window.location.assign('/')}
              type="button"
            >
              Back Home
            </Button>
          </CardContent>
        </Card>
      </PageShell>
    )
  }

  if (roundState.phase === 'round_loading') {
    return (
      <PageShell
        eyebrow="Main Display"
        subtitle="Briefings are being prepared for each faction."
        title={`Round ${roundState.roundNumber ?? 1}: Briefings Incoming`}
      >
        <section className="grid gap-4 xl:grid-cols-[minmax(0,380px)_1fr]">
          <Card className="neo-panel gap-4 py-4">
            <CardHeader className="gap-3 pb-0">
              <CardTitle className="font-display text-3xl text-black">Round Status</CardTitle>
              <CardDescription className="text-black/90">
                Teams unlock once their briefings are ready.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pb-2">
              <div className="neo-panel-soft p-4">
                <p className="neo-label text-black/78">World State</p>
                <p className="mt-2 text-sm leading-relaxed text-black/92">{roundState.event}</p>
              </div>

              <Badge
                className={
                  planningStatus === 'ready'
                    ? 'w-fit rounded-full border border-black bg-emerald-300 px-3 py-1 text-[0.68rem] text-black'
                    : planningStatus === 'error'
                      ? 'w-fit rounded-full border border-black bg-destructive px-3 py-1 text-[0.68rem] text-destructive-foreground'
                      : 'w-fit rounded-full border border-black bg-amber-300 px-3 py-1 text-[0.68rem] text-black'
                }
              >
                {planningStatus === 'ready'
                  ? 'All briefings ready'
                  : planningStatus === 'error'
                    ? 'Briefing generation failed'
                    : 'Generating briefings...'}
              </Badge>

              <div className="space-y-2">
                {roundState.factions.map((faction) => {
                  const theme = getFactionTheme(faction.code)

                  return (
                    <div
                      className={`neo-panel-soft flex items-center justify-between gap-3 px-3 py-2 ${theme.softClass}`}
                      key={faction.id}
                    >
                      <p className={`font-heading text-sm ${theme.accentTextClass}`}>{faction.name}</p>
                      <Badge
                        className={
                          faction.hasBriefing
                            ? 'rounded-full border border-black bg-emerald-300 px-2 py-0.5 text-[0.62rem] uppercase text-black'
                            : 'rounded-full border border-black bg-white px-2 py-0.5 text-[0.62rem] uppercase text-black'
                        }
                      >
                        {faction.hasBriefing ? 'Ready' : 'Pending'}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <SentimentBars sentiments={roundState.sentiments} />
        </section>

        {error ? (
          <Badge className="w-fit rounded-full border border-black bg-destructive px-3 py-1 text-[0.68rem] text-destructive-foreground">
            {error}
          </Badge>
        ) : null}
      </PageShell>
    )
  }

  if (roundState.phase === 'round_voting') {
    const remainingMs = Math.max((roundState.submittingDeadlineMs ?? nowMs) - nowMs, 0)
    const remainingSeconds = Math.ceil(remainingMs / 1000)

    return (
      <PageShell
        eyebrow="Main Display"
        subtitle="Teams are crafting one move each before the timer ends."
        title={`Round ${roundState.roundNumber ?? 1}: Teams Are Crafting`}
      >
        <section className="grid gap-4 xl:grid-cols-[minmax(0,380px)_1fr]">
          <Card className="neo-panel gap-4 py-4">
            <CardHeader className="gap-3 pb-0">
              <CardTitle className="font-display text-3xl text-black">Round Clock</CardTitle>
              <CardDescription className="text-black/90">
                The round advances when all teams lock in or time runs out.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pb-2">
              <div className="neo-panel-soft p-4 text-center">
                <p className="neo-label text-black/78">Time Remaining</p>
                <p className="neo-code mt-2 text-6xl font-semibold text-black">{remainingSeconds}s</p>
              </div>

              <div className="neo-panel-soft p-4">
                <p className="neo-label text-black/78">World State</p>
                <p className="mt-2 text-sm leading-relaxed text-black/92">{roundState.event}</p>
              </div>

              <Badge className="w-fit rounded-full border border-black bg-white px-3 py-1 text-[0.68rem] text-black">
                {roundState.submittedFactionCount}/{roundState.participatingFactionCount} factions locked
              </Badge>
            </CardContent>
          </Card>

          <SentimentBars sentiments={roundState.sentiments} />
        </section>

        <Card className="neo-panel gap-4 py-4">
          <CardHeader className="gap-3 pb-0">
            <CardTitle className="font-display text-3xl text-black">Faction Status</CardTitle>
            <CardDescription className="text-black/90">
              First valid move locks each faction for the round.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 pb-2 md:grid-cols-2 lg:grid-cols-4">
            {roundState.factions.map((faction) => {
              const theme = getFactionTheme(faction.code)

              return (
                <Card className={`neo-panel gap-3 py-4 ${theme.softClass} ${theme.borderClass}`} key={faction.id}>
                  <CardContent className="space-y-3 pb-0">
                    <p className={`font-heading text-base ${theme.accentTextClass}`}>{faction.name}</p>
                    <Badge
                      className={
                        faction.submitted
                          ? 'w-fit rounded-full border border-black bg-emerald-300 px-2 py-0.5 text-[0.62rem] uppercase text-black'
                          : 'w-fit rounded-full border border-black bg-amber-300 px-2 py-0.5 text-[0.62rem] uppercase text-black'
                      }
                    >
                      {faction.submitted ? 'Locked In' : 'Waiting'}
                    </Badge>
                    <p className="text-xs text-black/92">
                      {faction.playerCount} player{faction.playerCount === 1 ? '' : 's'}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </CardContent>
        </Card>

        {error ? (
          <Badge className="w-fit rounded-full border border-black bg-destructive px-3 py-1 text-[0.68rem] text-destructive-foreground">
            {error}
          </Badge>
        ) : null}
      </PageShell>
    )
  }

  if (roundState.phase === 'round_processing') {
    return (
      <PageShell
        eyebrow="Main Display"
        subtitle="Moves are locked. We are scoring the narrative impact."
        title={`Round ${roundState.roundNumber ?? 1}: Scoring the Spin`}
      >
        <PhaseHoldingScreen
          description="Stand by while outcomes are calculated for every faction move."
          label="Scoring The Spin"
          title="Crunching Results"
        />
      </PageShell>
    )
  }

  return (
    <PageShell
      eyebrow="Main Display"
      subtitle="The next broadcast segment is not built yet."
      title="Intermission"
    >
      <Card className="neo-panel py-0">
        <CardContent className="space-y-3 px-6 py-6">
          <p className="text-sm text-black/90">
            Gameplay after this stage is still under construction.
          </p>
        </CardContent>
      </Card>
    </PageShell>
  )
}

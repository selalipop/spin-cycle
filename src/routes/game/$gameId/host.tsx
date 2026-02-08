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
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { WashingMachineLoader } from '~/components/ui/washing-machine-loader'
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
  const prepareNextRoundIntroduction = useMutation(api.lobby.prepareNextRoundIntroduction)
  const advanceSubmittingToResolving = useMutation(api.gameplay.advanceSubmittingToResolving)
  const generatePlanningBriefings = useAction(api.gameplay.generatePlanningBriefings)
  const processRoundSubmissions = useAction(api.gameplay.processRoundSubmissions)

  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAdvancingRound, setIsAdvancingRound] = useState(false)
  const [videoFailed, setVideoFailed] = useState(false)
  const [openingStage, setOpeningStage] = useState<OpeningStage>('loading')
  const [planningStatus, setPlanningStatus] = useState<'idle' | 'running' | 'ready' | 'error'>(
    'idle',
  )
  const [nowMs, setNowMs] = useState(() => Date.now())

  const planningTriggerRef = useRef<string | null>(null)
  const timeoutTriggerRef = useRef<Set<string>>(new Set())
  const processingTriggerRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!lobby || lobby.phase !== 'game_introduction') {
      setOpeningStage('loading')
      setVideoFailed(false)
      return
    }

    const isRoundOneIntro = (roundState?.roundNumber ?? 1) === 1
    const hasIntroVideo = Boolean(lobby.introVideo) && isRoundOneIntro

    setVideoFailed(false)
    setOpeningStage('loading')

    const timer = window.setTimeout(() => {
      setOpeningStage(hasIntroVideo ? 'video' : 'briefing')
    }, 800)

    return () => {
      window.clearTimeout(timer)
    }
  }, [lobby?.gameId, lobby?.introVideo, lobby?.phase, roundState?.roundNumber])

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

  useEffect(() => {
    if (!roundState || roundState.phase !== 'round_processing' || !roundState.roundNumber) {
      return
    }

    const processingKey = `${roundState.gameId}:${roundState.roundNumber}`

    if (processingTriggerRef.current.has(processingKey)) {
      return
    }

    processingTriggerRef.current.add(processingKey)

    void processRoundSubmissions({
      gameId: roundState.gameId,
    }).catch(() => {
      setError('Round processing failed. Please refresh to retry.')
    })
  }, [processRoundSubmissions, roundState])

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

  const handlePrepareNextRound = async () => {
    if (!roundState || roundState.phase !== 'round_results') {
      return
    }

    setError(null)
    setIsAdvancingRound(true)

    try {
      await prepareNextRoundIntroduction({ gameId: roundState.gameId })
    } catch {
      setError('Could not start the next round introduction. Please refresh.')
    } finally {
      setIsAdvancingRound(false)
    }
  }

  if (lobby === undefined) {
    return (
      <PageShell title="Loading Host Desk" subtitle="Syncing room state.">
        <Card className="neo-panel py-0">
          <CardContent className="flex flex-col items-center gap-4 px-6 py-10">
            <WashingMachineLoader />
            <p className="text-base text-black/90">Loading host dashboard...</p>
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
            <p className="text-base text-black/90">Start a new game from the home screen.</p>
            <Button
              className="h-10 border-2 border-black font-heading text-sm uppercase tracking-[0.08em]"
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
    const introRoundNumber = (roundState?.roundNumber ?? 0) + 1
    const isRoundOneIntro = introRoundNumber === 1
    const showIntroVideo = isRoundOneIntro && Boolean(lobby.introVideo)
    const canStartRoundOne = openingStage === 'briefing'

    return (
      <PageShell
        eyebrow="Main Display"
        title="Round Introduction"
      >
        <section className="grid gap-4 xl:grid-cols-[minmax(0,320px)_1fr]">
          <Card className="neo-panel neo-grid gap-4 py-4">
            <CardHeader className="gap-3 pb-0">
              <CardTitle className="font-display text-3xl text-black">Control Desk</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pb-2">
              <div className="space-y-1">
                <p className="neo-label text-black/78">Join Code</p>
                <p className="neo-code text-4xl font-semibold text-black">{lobby.joinCode}</p>
              </div>


              <Button
                className="h-11 w-full border-2 border-black font-heading text-sm uppercase tracking-[0.08em]"
                disabled={isStarting || !canStartRoundOne}
                onClick={handleStart}
                type="button"
              >
                {isStarting
                  ? `Starting Round ${introRoundNumber}...`
                  : openingStage === 'loading'
                    ? 'Preparing Introduction...'
                    : openingStage === 'video' && showIntroVideo
                      ? 'Finish Clip To Continue'
                      : `Start Round ${introRoundNumber}`}
              </Button>

              {videoFailed && showIntroVideo ? (
                <Badge className="w-fit rounded-full border border-black bg-amber-300 px-3 py-1 text-xs text-black">
                  Intro clip failed to load. You can still continue.
                </Badge>
              ) : null}

              {error ? (
                <Badge className="w-fit rounded-full border border-black bg-destructive px-3 py-1 text-xs text-destructive-foreground">
                  {error}
                </Badge>
              ) : null}
            </CardContent>
          </Card>

          <HostEstablishingStage
            event={roundState?.escalation ?? roundState?.event ?? lobby.event}
            introVideo={lobby.introVideo}
            onVideoEnded={() => setOpeningStage('briefing')}
            onVideoError={() => {
              setVideoFailed(true)
              setOpeningStage('briefing')
            }}
            scenarioTitle={lobby.scenarioTitle}
            showVideo={showIntroVideo}
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
                className="h-11 w-full border-2 border-black font-heading text-sm uppercase tracking-[0.08em]"
                disabled={isStarting}
                onClick={handleStart}
                type="button"
              >
                {isStarting ? 'Starting...' : 'Start Game'}
              </Button>

              {error ? (
                <Badge className="w-fit rounded-full border border-black bg-destructive px-3 py-1 text-xs text-destructive-foreground">
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
                        <p className="text-base text-black/82">No players yet.</p>
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
      <PageShell title="Loading Round">
        <Card className="neo-panel py-0">
          <CardContent className="flex flex-col items-center gap-4 px-6 py-10">
            <WashingMachineLoader />
            <p className="text-base text-black/90">Loading round data...</p>
          </CardContent>
        </Card>
      </PageShell>
    )
  }

  if (roundState === null) {
    return (
      <PageShell title="Room Not Found">
        <Card className="neo-panel py-0">
          <CardContent className="space-y-4 px-6 py-6">
            <p className="text-base text-black/90">Try creating a new game from the homepage.</p>
            <Button
              className="h-10 border-2 border-black font-heading text-sm uppercase tracking-[0.08em]"
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
        title={`Round ${roundState.roundNumber ?? 1}: Briefings Incoming`}
      >
        <section className="grid gap-4 xl:grid-cols-[minmax(0,380px)_1fr]">
          <Card className="neo-panel gap-4 py-4">
            <CardHeader className="gap-3 pb-0">
              <CardTitle className="font-display text-3xl text-black">Round Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pb-2">
              <div className="neo-panel-soft p-4">
                <p className="neo-label text-black/78">World State</p>
                <p className="mt-2 text-base leading-relaxed text-black/92">{roundState.event}</p>
              </div>

              <Badge
                className={
                  planningStatus === 'ready'
                    ? 'w-fit rounded-full border border-black bg-emerald-300 px-3 py-1 text-xs text-black'
                    : planningStatus === 'error'
                      ? 'w-fit rounded-full border border-black bg-destructive px-3 py-1 text-xs text-destructive-foreground'
                      : 'w-fit rounded-full border border-black bg-amber-300 px-3 py-1 text-xs text-black'
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
                            ? 'rounded-full border border-black bg-emerald-300 px-2 py-0.5 text-xs uppercase text-black'
                            : 'rounded-full border border-black bg-white px-2 py-0.5 text-xs uppercase text-black'
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
          <Badge className="w-fit rounded-full border border-black bg-destructive px-3 py-1 text-xs text-destructive-foreground">
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
        title={`Round ${roundState.roundNumber ?? 1}: Teams Are Crafting`}
      >
        <section className="grid gap-4 xl:grid-cols-[minmax(0,380px)_1fr]">
          <Card className="neo-panel gap-4 py-4">
            <CardHeader className="gap-3 pb-0">
              <CardTitle className="font-display text-3xl text-black">Round Clock</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 pb-2">
              <div className="neo-panel-soft p-4 text-center">
                <p className="neo-label text-black/78">Time Remaining</p>
                <p className="neo-code mt-2 text-6xl font-semibold text-black">{remainingSeconds}s</p>
              </div>

              <div className="neo-panel-soft p-4">
                <p className="neo-label text-black/78">World State</p>
                <p className="mt-2 text-base leading-relaxed text-black/92">{roundState.event}</p>
              </div>

              <Badge className="w-fit rounded-full border border-black bg-white px-3 py-1 text-xs text-black">
                {roundState.submittedFactionCount}/{roundState.participatingFactionCount} factions locked
              </Badge>
            </CardContent>
          </Card>

          <SentimentBars sentiments={roundState.sentiments} />
        </section>

        <Card className="neo-panel gap-4 py-4">
          <CardHeader className="gap-3 pb-0">
            <CardTitle className="font-display text-3xl text-black">Faction Status</CardTitle>
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
                          ? 'w-fit rounded-full border border-black bg-emerald-300 px-2 py-0.5 text-xs uppercase text-black'
                          : 'w-fit rounded-full border border-black bg-amber-300 px-2 py-0.5 text-xs uppercase text-black'
                      }
                    >
                      {faction.submitted ? 'Locked In' : 'Waiting'}
                    </Badge>
                    <p className="text-sm text-black/92">
                      {faction.playerCount} player{faction.playerCount === 1 ? '' : 's'}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </CardContent>
        </Card>

        {error ? (
          <Badge className="w-fit rounded-full border border-black bg-destructive px-3 py-1 text-xs text-destructive-foreground">
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
        title={`Round ${roundState.roundNumber ?? 1}: Scoring the Spin`}
      >
        <PhaseHoldingScreen
          description="Scoring all moves..."
          label="Scoring The Spin"
          title="Crunching Results"
        />
      </PageShell>
    )
  }

  if (roundState.phase === 'round_results') {
    const factionNameById = new Map(roundState.factions.map((faction) => [faction.id, faction.name]))
    const sentimentBefore = roundState.sentimentBefore
    const sentimentAfter = roundState.sentimentAfter
    const latestSentiments = sentimentAfter ?? roundState.sentiments
    const canPrepareNextRound =
      typeof roundState.roundNumber === 'number' && roundState.roundNumber < roundState.maxRounds
    const rankedSubmissions = roundState.submittedActions
      .slice()
      .sort((a, b) => {
        const aImpact = typeof a.impact === 'number' ? a.impact : Number.NEGATIVE_INFINITY
        const bImpact = typeof b.impact === 'number' ? b.impact : Number.NEGATIVE_INFINITY

        if (aImpact !== bImpact) {
          return bImpact - aImpact
        }

        return a.createdAtMs - b.createdAtMs
      })
    const sentimentDeltaRows =
      sentimentBefore && sentimentAfter
        ? [
          {
            label: 'Stability',
            delta: sentimentAfter.stability - sentimentBefore.stability,
          },
          {
            label: 'Attention',
            delta: sentimentAfter.attention - sentimentBefore.attention,
          },
          {
            label: 'Curiosity',
            delta: sentimentAfter.curiosity - sentimentBefore.curiosity,
          },
          {
            label: 'Corporate Blame',
            delta: sentimentAfter.corporate_blame - sentimentBefore.corporate_blame,
          },
          {
            label: 'Government Blame',
            delta: sentimentAfter.government_blame - sentimentBefore.government_blame,
          },
        ]
        : []

    return (
      <PageShell
        eyebrow="Main Display"
        subtitle="Scoring and world resolution are complete."
        title={`Round ${roundState.roundNumber ?? 1}: Results`}
      >
        <section className="grid gap-4 xl:grid-cols-[minmax(0,380px)_1fr]">
          <Card className="neo-panel gap-4 py-4">
            <CardHeader className="gap-3 pb-0">
              <CardTitle className="font-display text-3xl text-black">Round Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pb-2">
              <div className="neo-panel-soft p-4">
                <p className="neo-label text-black/78">World State</p>
                <p className="mt-2 text-base leading-relaxed text-black/92">{roundState.event}</p>
              </div>

              <Badge className="w-fit rounded-full border border-black bg-emerald-300 px-3 py-1 text-xs text-black">
                {roundState.submittedActions.length} submissions scored
              </Badge>
              {roundState.winningSubmissionId ? (
                <Badge className="w-fit rounded-full border border-black bg-amber-300 px-3 py-1 text-xs text-black">
                  Winning move resolved
                </Badge>
              ) : null}
              {canPrepareNextRound ? (
                <Button
                  className="h-11 w-full border-2 border-black font-heading text-sm uppercase tracking-[0.08em]"
                  disabled={isAdvancingRound}
                  onClick={handlePrepareNextRound}
                  type="button"
                >
                  {isAdvancingRound
                    ? `Preparing Round ${(roundState.roundNumber ?? 1) + 1}...`
                    : `Start Round ${(roundState.roundNumber ?? 1) + 1} Introduction`}
                </Button>
              ) : (
                <Badge className="w-fit rounded-full border border-black bg-white px-3 py-1 text-xs text-black">
                  Final round complete
                </Badge>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <SentimentBars sentiments={latestSentiments} title="Latest Sentiment" />
            {sentimentDeltaRows.length > 0 ? (
              <Card className="neo-panel gap-3 py-4">
                <CardHeader className="gap-1 pb-0">
                  <CardTitle className="font-heading text-xl text-black">Movement</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2 pb-2">
                  {sentimentDeltaRows.map((row) => {
                    const roundedDelta = Math.round(row.delta * 10) / 10
                    const deltaLabel =
                      roundedDelta > 0
                        ? `↑ +${roundedDelta}`
                        : roundedDelta < 0
                          ? `↓ ${roundedDelta}`
                          : '→ 0'
                    const toneClass =
                      roundedDelta > 0
                        ? 'bg-emerald-200 text-emerald-900'
                        : roundedDelta < 0
                          ? 'bg-rose-200 text-rose-900'
                          : 'bg-white text-black'

                    return (
                      <Badge
                        className={`rounded-full border border-black px-3 py-1 text-xs ${toneClass}`}
                        key={row.label}
                      >
                        {row.label}: {deltaLabel}
                      </Badge>
                    )
                  })}
                </CardContent>
              </Card>
            ) : null}
          </div>
        </section>

        <Card className="neo-panel gap-4 py-4">
          <CardHeader className="gap-2 pb-0">
            <CardTitle className="font-heading text-xl text-black">Winning Narrative</CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            {roundState.narrative ? (
              <p className="whitespace-pre-line text-base leading-relaxed text-black/92">
                {roundState.narrative}
              </p>
            ) : (
              <p className="text-base text-black/82">Narrative not available for this round.</p>
            )}
          </CardContent>
        </Card>

        <section className="space-y-3">
          {rankedSubmissions.length === 0 ? (
            <Card className="neo-panel gap-3 py-4">
              <CardContent className="pb-2">
                <p className="text-base text-black/82">No team submissions were available for this round.</p>
              </CardContent>
            </Card>
          ) : (
            rankedSubmissions.map((submission, index) => (
              <div className="flex items-stretch gap-3" key={submission.id}>
                <div className="neo-panel-soft flex w-16 shrink-0 items-center justify-center px-2 py-3">
                  <span className="font-display text-6xl leading-none text-black/35">{index + 1}</span>
                </div>

                <Card
                  className={
                    submission.id === roundState.winningSubmissionId
                      ? 'neo-panel flex-1 gap-4 border-2 border-black bg-amber-50 py-4'
                      : 'neo-panel flex-1 gap-4 py-4'
                  }
                >
                  <CardHeader className="gap-2 pb-0">
                    <CardTitle className="font-heading text-xl text-black">
                      {factionNameById.get(submission.factionId) ?? 'Unknown Faction'}
                    </CardTitle>
                    <p className="text-base text-black/90">{submission.actionName}</p>
                    {submission.id === roundState.winningSubmissionId ? (
                      <Badge className="w-fit rounded-full border border-black bg-amber-300 px-2 py-0.5 text-xs text-black">
                        Winning Move
                      </Badge>
                    ) : null}
                  </CardHeader>

                  <CardContent className="space-y-3 pb-2">
                    <div className="neo-panel-soft p-3">
                      <p className="neo-label text-black/78">Submission</p>
                      <p className="mt-2 text-base text-black/92">{submission.content}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge className="rounded-full border border-black bg-white px-2 py-1 text-xs text-black">
                        Effectiveness: {submission.effectiveness ?? 0}
                      </Badge>
                      <Badge className="rounded-full border border-black bg-amber-300 px-2 py-1 text-xs text-black">
                        Impact: {submission.impact ?? 0}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))
          )}
        </section>

        {error ? (
          <Badge className="w-fit rounded-full border border-black bg-destructive px-3 py-1 text-xs text-destructive-foreground">
            {error}
          </Badge>
        ) : null}
      </PageShell>
    )
  }

  return (
    <PageShell
      eyebrow="Main Display"
      subtitle="Waiting for the next round."
      title="Intermission"
    >
      <Card className="neo-panel py-0">
        <CardContent className="space-y-3 px-6 py-6">
          <p className="text-base text-black/90">
            The host will kick off what's next.
          </p>
        </CardContent>
      </Card>
    </PageShell>
  )
}

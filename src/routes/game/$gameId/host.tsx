import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Card, Chip, Spinner } from '@heroui/react'
import { createFileRoute } from '@tanstack/react-router'
import { useAction, useMutation, useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { PhaseHoldingScreen } from '~/components/gameplay/phase-holding-screen'
import { SentimentBars } from '~/components/gameplay/sentiment-bars'
import {
  HostEstablishingStage,
  type EstablishingStage,
} from '~/components/lobby/host-establishing-stage'
import { FactionCard } from '~/components/lobby/faction-card'
import { PageShell } from '~/components/lobby/page-shell'
import { PlayerListItem } from '~/components/lobby/player-list-item'
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
  const advanceSubmittingToResolving = useMutation(
    api.gameplay.advanceSubmittingToResolving,
  )
  const generatePlanningBriefings = useAction(api.gameplay.generatePlanningBriefings)

  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [videoFailed, setVideoFailed] = useState(false)
  const [establishingStage, setEstablishingStage] = useState<EstablishingStage>('loading')
  const [planningStatus, setPlanningStatus] = useState<
    'idle' | 'running' | 'ready' | 'error'
  >('idle')
  const [planningFallbackCount, setPlanningFallbackCount] = useState(0)
  const [nowMs, setNowMs] = useState(() => Date.now())

  const planningTriggerRef = useRef<string | null>(null)
  const timeoutTriggerRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!lobby || lobby.phase !== 'establishing') {
      setEstablishingStage('loading')
      setVideoFailed(false)
      return
    }

    setVideoFailed(false)
    setEstablishingStage('loading')

    const timer = window.setTimeout(() => {
      setEstablishingStage('video')
    }, 1000)

    return () => {
      window.clearTimeout(timer)
    }
  }, [lobby?.gameId, lobby?.phase])

  useEffect(() => {
    if (!roundState || roundState.phase !== 'planning' || !roundState.roundNumber) {
      if (planningStatus !== 'error') {
        setPlanningStatus('idle')
      }
      setPlanningFallbackCount(0)
      return
    }

    const planningKey = `${roundState.gameId}:${roundState.roundNumber}`

    if (planningTriggerRef.current === planningKey) {
      return
    }

    planningTriggerRef.current = planningKey
    setPlanningStatus('running')
    setPlanningFallbackCount(0)

    void generatePlanningBriefings({ gameId: roundState.gameId })
      .then((result) => {
        if (result.status === 'generated') {
          setPlanningStatus('ready')
          setPlanningFallbackCount(result.fallbackCount)
          return
        }

        if (result.status === 'noop') {
          setPlanningStatus('ready')
          setPlanningFallbackCount(0)
          return
        }

        setPlanningStatus('running')
      })
      .catch(() => {
        setPlanningStatus('error')
        setError('Briefing generation failed. Refresh to retry.')
      })
  }, [generatePlanningBriefings, planningStatus, roundState])

  useEffect(() => {
    if (!roundState || roundState.phase !== 'submitting') {
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
      roundState.phase !== 'submitting' ||
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
      setError('Could not advance round after timeout. Please refresh.')
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

    return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(joinUrl)}`
  }, [joinUrl])

  const handleStart = async () => {
    if (!lobby) {
      return
    }

    if (lobby.phase === 'establishing' && establishingStage !== 'brief') {
      return
    }

    setError(null)
    setIsStarting(true)

    try {
      if (lobby.phase === 'lobby') {
        await startGame({ gameId: lobby.gameId })
      } else if (lobby.phase === 'establishing') {
        await startRoundOne({ gameId: lobby.gameId })
      }
    } catch {
      setError('Could not start game. Please try again.')
    } finally {
      setIsStarting(false)
    }
  }

  if (lobby === undefined) {
    return (
      <PageShell title="Host Waiting Room" subtitle="Loading game state...">
        <Card className="border border-zinc-700/70 bg-zinc-900/70">
          <Card.Content className="flex items-center gap-3 py-6">
            <Spinner />
            <p className="text-sm text-zinc-300">Loading host dashboard...</p>
          </Card.Content>
        </Card>
      </PageShell>
    )
  }

  if (lobby === null) {
    return (
      <PageShell title="Game Not Found" subtitle="This host link is invalid or expired.">
        <Card className="border border-zinc-700/70 bg-zinc-900/70">
          <Card.Content className="space-y-4 py-6">
            <p className="text-sm text-zinc-300">No game exists for this host URL.</p>
            <Button onPress={() => window.location.assign('/')}>Back to Home</Button>
          </Card.Content>
        </Card>
      </PageShell>
    )
  }

  if (lobby.phase === 'establishing') {
    const canStartRoundOne = establishingStage === 'brief'

    return (
      <PageShell
        eyebrow="Main Screen"
        subtitle="Playing intro content before teams enter round 1 planning."
        title="Establishing Premise"
      >
        <section className="grid gap-4 xl:grid-cols-[minmax(0,300px)_1fr]">
          <Card className="border border-zinc-700/70 bg-zinc-900/70">
            <Card.Header>
              <Card.Title>Control Desk</Card.Title>
              <Card.Description>
                Advance once the establishing sequence is done.
              </Card.Description>
            </Card.Header>
            <Card.Content className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">Join Code</p>
                <p className="text-4xl font-semibold tracking-[0.2em] text-zinc-100">
                  {lobby.joinCode}
                </p>
              </div>
              <Chip className="bg-zinc-700/70 text-zinc-100">
                {lobby.totalPlayers} player{lobby.totalPlayers === 1 ? '' : 's'} connected
              </Chip>
              <Chip className="bg-amber-500/25 text-amber-200">Phase: {lobby.phase}</Chip>
              <Button
                className="w-full"
                isDisabled={isStarting || !canStartRoundOne}
                onPress={handleStart}
              >
                {isStarting
                  ? 'Starting Round 1...'
                  : establishingStage === 'loading'
                    ? 'Loading Broadcast...'
                    : establishingStage === 'video'
                      ? 'Waiting For Intro To Finish'
                      : 'Start Round 1'}
              </Button>
              {videoFailed ? (
                <Chip className="bg-amber-500/25 text-amber-200">
                  Video failed to load. You can still continue.
                </Chip>
              ) : null}
              {error ? <Chip className="bg-rose-600/25 text-rose-200">{error}</Chip> : null}
            </Card.Content>
          </Card>

          <HostEstablishingStage
            event={lobby.event}
            introVideo={lobby.introVideo}
            onVideoEnded={() => setEstablishingStage('brief')}
            onVideoError={() => {
              setVideoFailed(true)
              setEstablishingStage('brief')
            }}
            scenarioTitle={lobby.scenarioTitle}
            stage={establishingStage}
          />
        </section>
      </PageShell>
    )
  }

  if (lobby.phase === 'lobby') {
    return (
      <PageShell
        eyebrow="Host Console"
        subtitle="Players are joining now. Start when you are ready."
        title="Newsroom Lobby"
      >
        <section className="grid gap-4 xl:grid-cols-[minmax(0,340px)_1fr]">
          <Card className="border border-zinc-700/70 bg-zinc-900/70">
            <Card.Header>
              <Card.Title>Join Code</Card.Title>
              <Card.Description>Players join with this short code.</Card.Description>
            </Card.Header>
            <Card.Content className="space-y-4">
              <p className="text-5xl font-semibold tracking-[0.25em] text-zinc-100">
                {lobby.joinCode}
              </p>
              <Chip className="bg-zinc-700/70 text-zinc-100">
                {lobby.totalPlayers} player{lobby.totalPlayers === 1 ? '' : 's'} connected
              </Chip>
              {joinUrl ? (
                <p className="break-all text-xs text-zinc-400" title={joinUrl}>
                  {joinUrl}
                </p>
              ) : null}
              {qrCodeUrl ? (
                <img
                  alt="QR code for joining this game"
                  className="mx-auto rounded-xl border border-zinc-700/70 bg-white p-2"
                  src={qrCodeUrl}
                />
              ) : null}
            </Card.Content>
            <Card.Footer className="flex flex-col items-stretch gap-3">
              <Button className="w-full" isDisabled={isStarting} onPress={handleStart}>
                {isStarting ? 'Starting...' : 'Start Establishing'}
              </Button>
              <Chip className="bg-zinc-700/70 text-zinc-100">Phase: {lobby.phase}</Chip>
              {error ? <Chip className="bg-rose-600/25 text-rose-200">{error}</Chip> : null}
            </Card.Footer>
          </Card>

          <Card className="border border-zinc-700/70 bg-zinc-900/70">
            <Card.Header>
              <Card.Title>Faction Rosters</Card.Title>
              <Card.Description>Live players grouped by faction.</Card.Description>
            </Card.Header>
            <Card.Content className="grid gap-4 md:grid-cols-2">
              {lobby.factions.map((faction) => (
                <div className="space-y-3" key={faction.id}>
                  <FactionCard
                    code={faction.code}
                    description={faction.description}
                    name={faction.name}
                    playerCount={faction.playerCount}
                  />
                  {faction.players.length === 0 ? (
                    <Card className="border border-zinc-700/70 bg-zinc-900/80">
                      <Card.Content className="py-3">
                        <p className="text-sm text-zinc-400">No players yet.</p>
                      </Card.Content>
                    </Card>
                  ) : (
                    faction.players.map((player) => (
                      <PlayerListItem avatar={player.avatar} key={player.id} name={player.name} />
                    ))
                  )}
                </div>
              ))}
            </Card.Content>
          </Card>
        </section>
      </PageShell>
    )
  }

  if (roundState === undefined) {
    return (
      <PageShell title="Loading Round" subtitle="Syncing big-screen round state...">
        <Card className="border border-zinc-700/70 bg-zinc-900/70">
          <Card.Content className="flex items-center gap-3 py-6">
            <Spinner />
            <p className="text-sm text-zinc-300">Loading round data...</p>
          </Card.Content>
        </Card>
      </PageShell>
    )
  }

  if (roundState === null) {
    return (
      <PageShell title="Game Not Found" subtitle="No active game for this host link.">
        <Card className="border border-zinc-700/70 bg-zinc-900/70">
          <Card.Content className="space-y-4 py-6">
            <p className="text-sm text-zinc-300">Try creating a new game from the homepage.</p>
            <Button onPress={() => window.location.assign('/')}>Back to Home</Button>
          </Card.Content>
        </Card>
      </PageShell>
    )
  }

  if (roundState.phase === 'planning') {
    return (
      <PageShell
        eyebrow="Main Screen"
        subtitle="Generating faction briefings before submissions open."
        title={`Round ${roundState.roundNumber ?? 1} Planning`}
      >
        <section className="grid gap-4 xl:grid-cols-[minmax(0,380px)_1fr]">
          <Card className="border border-zinc-700/70 bg-zinc-950/70">
            <Card.Header>
              <Card.Title>Round Status</Card.Title>
              <Card.Description>
                Main screen auto-generates all faction briefings for this round.
              </Card.Description>
            </Card.Header>
            <Card.Content className="space-y-4">
              <div className="rounded-xl border border-zinc-700/70 bg-zinc-900/70 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">World State</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-100">{roundState.event}</p>
              </div>

              <Chip
                className={
                  planningStatus === 'ready'
                    ? 'bg-emerald-600/25 text-emerald-200'
                    : planningStatus === 'error'
                      ? 'bg-rose-600/25 text-rose-200'
                      : 'bg-amber-600/25 text-amber-200'
                }
              >
                {planningStatus === 'ready'
                  ? 'Briefings Ready'
                  : planningStatus === 'error'
                    ? 'Generation Failed'
                    : 'Generating Briefings...'}
              </Chip>

              {planningStatus === 'ready' && planningFallbackCount > 0 ? (
                <Chip className="bg-zinc-700/70 text-zinc-100">
                  {planningFallbackCount} faction
                  {planningFallbackCount === 1 ? '' : 's'} used fallback briefing copy
                </Chip>
              ) : null}

              <div className="space-y-2">
                {roundState.factions.map((faction) => {
                  const theme = getFactionTheme(faction.code)

                  return (
                    <div
                      className={`flex items-center justify-between rounded-xl border ${theme.borderClass} ${theme.softClass} px-3 py-2`}
                      key={faction.id}
                    >
                      <p className={`text-sm font-medium ${theme.accentTextClass}`}>{faction.name}</p>
                      <Chip className={faction.hasBriefing ? 'bg-emerald-600/25 text-emerald-200' : 'bg-zinc-700/70 text-zinc-100'} size="sm">
                        {faction.hasBriefing ? 'Brief Ready' : 'Pending'}
                      </Chip>
                    </div>
                  )
                })}
              </div>
            </Card.Content>
          </Card>

          <SentimentBars sentiments={roundState.sentiments} />
        </section>

        {error ? <Chip className="w-fit bg-rose-600/25 text-rose-200">{error}</Chip> : null}
      </PageShell>
    )
  }

  if (roundState.phase === 'submitting') {
    const remainingMs = Math.max((roundState.submittingDeadlineMs ?? nowMs) - nowMs, 0)
    const remainingSeconds = Math.ceil(remainingMs / 1000)

    return (
      <PageShell
        eyebrow="Main Screen"
        subtitle="Teams are writing their one action for this round."
        title={`Round ${roundState.roundNumber ?? 1} Submitting`}
      >
        <section className="grid gap-4 xl:grid-cols-[minmax(0,380px)_1fr]">
          <Card className="border border-zinc-700/70 bg-zinc-950/70">
            <Card.Header>
              <Card.Title className="text-2xl">Submission Clock</Card.Title>
              <Card.Description>Auto-advances when all teams submit or timer ends.</Card.Description>
            </Card.Header>
            <Card.Content className="space-y-4">
              <div className="rounded-xl border border-zinc-700/70 bg-zinc-900/80 p-4 text-center">
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">Time Remaining</p>
                <p className="mt-2 text-6xl font-semibold text-zinc-100">{remainingSeconds}s</p>
              </div>

              <div className="rounded-xl border border-zinc-700/70 bg-zinc-900/70 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">World State</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-100">{roundState.event}</p>
              </div>

              <Chip className="bg-zinc-700/70 text-zinc-100">
                {roundState.submittedFactionCount}/{roundState.participatingFactionCount} factions submitted
              </Chip>
            </Card.Content>
          </Card>

          <SentimentBars sentiments={roundState.sentiments} />
        </section>

        <Card className="border border-zinc-700/70 bg-zinc-950/70">
          <Card.Header>
            <Card.Title>Faction Submission Status</Card.Title>
            <Card.Description>First valid submit locks each faction for this round.</Card.Description>
          </Card.Header>
          <Card.Content className="grid gap-3 pb-6 md:grid-cols-2 lg:grid-cols-4">
            {roundState.factions.map((faction) => {
              const theme = getFactionTheme(faction.code)

              return (
                <Card className={`border ${theme.borderClass} ${theme.softClass}`} key={faction.id}>
                  <Card.Content className="space-y-3 py-4">
                    <p className={`font-semibold ${theme.accentTextClass}`}>{faction.name}</p>
                    <Chip
                      className={
                        faction.submitted
                          ? 'bg-emerald-600/25 text-emerald-200'
                          : 'bg-amber-600/25 text-amber-200'
                      }
                      size="sm"
                    >
                      {faction.submitted ? 'Submitted' : 'Waiting'}
                    </Chip>
                    <p className="text-xs text-zinc-300">
                      {faction.playerCount} player{faction.playerCount === 1 ? '' : 's'}
                    </p>
                  </Card.Content>
                </Card>
              )
            })}
          </Card.Content>
        </Card>

        {error ? <Chip className="w-fit bg-rose-600/25 text-rose-200">{error}</Chip> : null}
      </PageShell>
    )
  }

  if (roundState.phase === 'resolving') {
    return (
      <PageShell
        eyebrow="Main Screen"
        subtitle="Submissions are locked. Resolution is the next phase."
        title={`Round ${roundState.roundNumber ?? 1} Resolving`}
      >
        <PhaseHoldingScreen
          description="Calculating round outcomes. This holding screen will be replaced with the full resolution broadcast."
          label="Resolving"
          title="Processing Narrative Impact"
        />
      </PageShell>
    )
  }

  return (
    <PageShell
      eyebrow="Main Screen"
      subtitle="The game has moved beyond the implemented round flow."
      title="Newsroom In Progress"
    >
      <Card className="border border-zinc-700/70 bg-zinc-900/70">
        <Card.Content className="space-y-3 py-6">
          <Chip className="bg-zinc-700/70 text-zinc-100">Phase: {roundState.phase}</Chip>
          <p className="text-sm text-zinc-300">Gameplay beyond resolving is not implemented yet.</p>
        </Card.Content>
      </Card>
    </PageShell>
  )
}

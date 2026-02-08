import { useEffect, useMemo, useState } from 'react'
import { Navigate, createFileRoute } from '@tanstack/react-router'
import { useMutation } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import { getPlayerPhaseRouteTo, getPlayerRouteParams } from './-player-phase'
import type { PlayerPhaseRouteTo } from './-player-phase'
import type { ActionOption } from '~/components/gameplay/action-menu'
import { ActionMenu } from '~/components/gameplay/action-menu'
import { PhaseHoldingScreen } from '~/components/gameplay/phase-holding-screen'
import { PlayerStateLoadingScreen, PlayerStateNotFoundScreen } from '~/components/gameplay/player-route-shells'
import { SubmissionCompose } from '~/components/gameplay/submission-compose'
import { FactionCard } from '~/components/lobby/faction-card'
import { PageShell } from '~/components/lobby/page-shell'
import { PlayerListItem } from '~/components/lobby/player-list-item'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { usePlayerRoundState } from '~/lib/use-player-round-state'

type VotingScreen = 'briefing' | 'actions'
type PlayerRoundStateValue = Exclude<ReturnType<typeof usePlayerRoundState>, null | undefined>

const ROUTE_TO: PlayerPhaseRouteTo = '/game/$gameId/player/$playerId/round-voting'

export const Route = createFileRoute('/game/$gameId/player/$playerId/round-voting')({
  component: PlayerRoundVotingPhaseRoute,
})

function PlayerRoundVotingPhaseRoute() {
  const { gameId, playerId } = Route.useParams()
  const playerState = usePlayerRoundState(gameId, playerId)
  const submitFactionAction = useMutation(api.gameplay.submitFactionAction)

  const [screen, setScreen] = useState<VotingScreen>('briefing')
  const [selectedAction, setSelectedAction] = useState<ActionOption | null>(null)
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    if (!playerState || playerState.phase !== 'round_voting') {
      return
    }

    const timer = window.setInterval(() => {
      setNowMs(Date.now())
    }, 250)

    return () => {
      window.clearInterval(timer)
    }
  }, [playerState?.phase])

  useEffect(() => {
    if (!playerState || playerState.phase !== 'round_voting') {
      return
    }

    setScreen(playerState.factionSubmitted ? 'actions' : 'briefing')
    setSelectedAction(null)
    setContent('')
    setError(null)
  }, [playerState?.phase, playerState?.roundNumber, playerState?.factionSubmitted])

  if (playerState === undefined) {
    return <PlayerStateLoadingScreen />
  }

  if (playerState === null) {
    return <PlayerStateNotFoundScreen />
  }

  const expectedRoute = getPlayerPhaseRouteTo(playerState.phase)

  if (expectedRoute !== ROUTE_TO) {
    return <Navigate params={getPlayerRouteParams(playerState)} replace to={expectedRoute} />
  }

  const goal = playerState.goal ?? 'Pick one move that pushes your faction closer to its target mood.'
  const briefing =
    playerState.briefing ??
    'Briefing is still syncing. Keep this tab open and your team menu will stay ready.'
  const remainingSeconds = playerState.submittingDeadlineMs
    ? Math.max(Math.ceil((playerState.submittingDeadlineMs - nowMs) / 1000), 0)
    : null

  const handleSelectAction = (action: ActionOption) => {
    if (playerState.factionSubmitted || !action.affordable) {
      return
    }

    setError(null)
    setSelectedAction(action)
    setContent('')
  }

  const handleSubmit = async () => {
    if (!selectedAction || playerState.factionSubmitted) {
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      await submitFactionAction({
        gameId: playerState.gameId,
        playerId: playerState.player.id,
        actionTypeId: selectedAction.id,
        content,
      })
      setSelectedAction(null)
      setContent('')
    } catch {
      setError('Could not lock your move. A teammate may have already submitted.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PageShell
      eyebrow={playerState.player.faction.name}
      subtitle="Coordinate fast. The first teammate to lock a move submits for everyone."
      title={`Round ${playerState.roundNumber ?? 1}: Make Your Move`}
    >
      {screen === 'briefing' ? (
        <RoundVotingBriefingScreen
          briefing={briefing}
          goal={goal}
          onContinue={() => setScreen('actions')}
          playerState={playerState}
          remainingSeconds={remainingSeconds}
        />
      ) : (
        <RoundVotingActionsScreen
          content={content}
          goal={goal}
          isSubmitting={isSubmitting}
          onBackToBriefing={() => setScreen('briefing')}
          onClearSelectedAction={() => {
            setSelectedAction(null)
            setContent('')
          }}
          onContentChange={setContent}
          onSelectAction={handleSelectAction}
          onSubmit={handleSubmit}
          playerState={playerState}
          remainingSeconds={remainingSeconds}
          selectedAction={selectedAction}
        />
      )}

      {error ? (
        <Badge className="w-fit rounded-full border border-black bg-destructive px-3 py-1 text-[0.68rem] text-destructive-foreground">
          {error}
        </Badge>
      ) : null}
    </PageShell>
  )
}

function RoundVotingBriefingScreen({
  playerState,
  goal,
  briefing,
  remainingSeconds,
  onContinue,
}: {
  playerState: PlayerRoundStateValue
  goal: string
  briefing: string
  remainingSeconds: number | null
  onContinue: () => void
}) {
  return (
    <>
      <section className="grid gap-4 lg:grid-cols-[minmax(0,340px)_1fr]">
        <VotingPlayerCard playerState={playerState} remainingSeconds={remainingSeconds} />

        <Card className="neo-panel neo-grid gap-4 py-4">
          <CardHeader className="gap-3 pb-0">
            <CardTitle className="font-display text-3xl text-black">Faction Briefing</CardTitle>
            <CardDescription className="text-black/90">
              Read this first, then continue to your team move menu.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pb-2">
            <div className="neo-panel-soft p-4">
              <p className="neo-label text-black/78">This Round Goal</p>
              <p className="mt-2 text-base text-black/92">{goal}</p>
            </div>

            <div className="neo-panel-soft p-4">
              <p className="neo-label text-black/78">Full Brief</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-black/92 sm:text-base">
                {briefing}
              </p>
            </div>

            <Button
              className="h-11 border-2 border-black font-heading text-xs uppercase tracking-[0.08em]"
              onClick={onContinue}
              type="button"
            >
              {playerState.factionSubmitted ? 'View Locked Move' : 'Continue To Move Menu'}
            </Button>
          </CardContent>
        </Card>
      </section>

      <VotingTeamCard playerState={playerState} />
    </>
  )
}

function RoundVotingActionsScreen({
  playerState,
  goal,
  content,
  selectedAction,
  isSubmitting,
  remainingSeconds,
  onSelectAction,
  onContentChange,
  onSubmit,
  onBackToBriefing,
  onClearSelectedAction,
}: {
  playerState: PlayerRoundStateValue
  goal: string
  content: string
  selectedAction: ActionOption | null
  isSubmitting: boolean
  remainingSeconds: number | null
  onSelectAction: (action: ActionOption) => void
  onContentChange: (value: string) => void
  onSubmit: () => void
  onBackToBriefing: () => void
  onClearSelectedAction: () => void
}) {
  const lockedMove = useMemo(
    () => playerState.submittedAction?.content ?? 'A teammate has already submitted for this round.',
    [playerState.submittedAction?.content],
  )

  return (
    <>
      <section className="space-y-3">
        {playerState.factionSubmitted ? (
          <>
            <PhaseHoldingScreen
              description="Your faction move is already locked for this round. Hang tight while other teams finish."
              label="Move Locked"
              title="Waiting On Other Teams"
            />
            <Card className="neo-panel py-0">
              <CardContent className="space-y-2 px-6 py-4">
                <p className="neo-label text-black/78">Locked Move</p>
                <p className="text-sm text-black/92">{lockedMove}</p>
              </CardContent>
            </Card>
          </>
        ) : selectedAction ? (
          <SubmissionCompose
            actionName={selectedAction.name}
            actionPrompt={selectedAction.prompt}
            canSubmit={content.trim().length > 0 && !isSubmitting}
            content={content}
            goal={goal}
            isSubmitting={isSubmitting}
            onBack={onClearSelectedAction}
            onContentChange={onContentChange}
            onSubmit={onSubmit}
          />
        ) : (
          <ActionMenu
            factionActions={playerState.factionActions}
            locked={playerState.factionSubmitted}
            onSelectAction={onSelectAction}
            sharedActions={playerState.sharedActions}
          />
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,340px)_1fr]">
        <VotingPlayerCard playerState={playerState} remainingSeconds={remainingSeconds} />

        <Card className="neo-panel neo-grid gap-4 py-4">
          <CardHeader className="gap-3 pb-0">
            <CardTitle className="font-display text-3xl text-black">Round Context</CardTitle>
            <CardDescription className="text-black/90">
              Keep your move aligned with your faction objective.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pb-2">
            <div className="neo-panel-soft p-4">
              <p className="neo-label text-black/78">This Round Goal</p>
              <p className="mt-2 text-base text-black/92">{goal}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                className="h-10 border-2 border-black bg-white font-heading text-xs uppercase tracking-[0.08em] text-black hover:bg-amber-100"
                onClick={onBackToBriefing}
                type="button"
                variant="secondary"
              >
                View Briefing Again
              </Button>
              {playerState.factionSubmitted ? (
                <Badge className="rounded-full border border-black bg-emerald-300 px-3 py-1 text-[0.66rem] uppercase text-black">
                  Team Locked
                </Badge>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </section>

      <VotingTeamCard playerState={playerState} />
    </>
  )
}

function VotingPlayerCard({
  playerState,
  remainingSeconds,
}: {
  playerState: PlayerRoundStateValue
  remainingSeconds: number | null
}) {
  return (
    <Card className="neo-panel neo-grid gap-4 py-4">
      <CardHeader className="gap-3 pb-0">
        <CardTitle className="font-display text-3xl text-black">You</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pb-2">
        <div className="flex items-center gap-3">
          <Avatar className="size-14 border-2 border-black bg-muted" size="lg">
            <AvatarImage alt={`${playerState.player.name} avatar`} className="object-cover" src={playerState.player.avatar} />
            <AvatarFallback className="font-mono text-xs">
              {playerState.player.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-heading text-lg text-black">{playerState.player.name}</p>
            <p className="text-sm text-black/92">{playerState.player.faction.name}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge className="rounded-full border border-black bg-white px-3 py-1 text-[0.66rem] text-black">
            Credits: {playerState.factionCredits}
          </Badge>
          {remainingSeconds !== null ? (
            <Badge className="rounded-full border border-black bg-amber-300 px-3 py-1 font-mono text-[0.66rem] text-black">
              {remainingSeconds}s left
            </Badge>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

function VotingTeamCard({ playerState }: { playerState: PlayerRoundStateValue }) {
  return (
    <Card className="neo-panel gap-4 py-4">
      <CardHeader className="gap-3 pb-0">
        <CardTitle className="font-display text-3xl text-black">Your Team</CardTitle>
        <CardDescription className="text-black/90">
          Players currently in {playerState.player.faction.name}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pb-2">
        <FactionCard
          code={playerState.player.faction.code}
          description={playerState.player.faction.description}
          name={playerState.player.faction.name}
          playerCount={playerState.factionPlayers.length}
        />
        {playerState.factionPlayers.map((factionPlayer) => (
          <PlayerListItem
            avatar={factionPlayer.avatar}
            isCurrent={factionPlayer.id === playerState.player.id}
            key={factionPlayer.id}
            name={factionPlayer.name}
          />
        ))}
      </CardContent>
    </Card>
  )
}

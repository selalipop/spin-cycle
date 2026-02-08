import { useEffect, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import type { ActionOption } from '~/components/gameplay/action-menu'
import { ActionMenu } from '~/components/gameplay/action-menu'
import { BriefingModal } from '~/components/gameplay/briefing-modal'
import { PhaseHoldingScreen } from '~/components/gameplay/phase-holding-screen'
import { SubmissionCompose } from '~/components/gameplay/submission-compose'
import { FactionCard } from '~/components/lobby/faction-card'
import { PlayerEstablishingPlaceholder } from '~/components/lobby/player-establishing-placeholder'
import { PlayerListItem } from '~/components/lobby/player-list-item'
import { PageShell } from '~/components/lobby/page-shell'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Spinner } from '~/components/ui/spinner'
import { savePlayerRoute } from '~/lib/session'

export const Route = createFileRoute('/game/$gameId/player/$playerId')({
  component: PlayerWaitingRoom,
})

function PlayerWaitingRoom() {
  const { gameId, playerId } = Route.useParams()
  const playerState = useQuery(api.gameplay.getPlayerRoundState, { gameId, playerId })
  const submitFactionAction = useMutation(api.gameplay.submitFactionAction)

  const [selectedAction, setSelectedAction] = useState<ActionOption | null>(null)
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isBriefingOpen, setIsBriefingOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nowMs, setNowMs] = useState(() => Date.now())
  const actionPanelRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!playerState) {
      return
    }

    savePlayerRoute(playerState.gameId, playerState.player.id)
  }, [playerState])

  useEffect(() => {
    if (!playerState || playerState.phase !== 'round_voting' || !playerState.roundNumber) {
      return
    }

    if (!playerState.briefing) {
      return
    }

    const localStorageKey = `brief_seen:${playerState.gameId}:${playerState.roundNumber}:${playerState.player.id}`
    const hasSeen = window.localStorage.getItem(localStorageKey)

    if (!hasSeen) {
      setIsBriefingOpen(true)
      window.localStorage.setItem(localStorageKey, '1')
    }
  }, [playerState])

  useEffect(() => {
    if (!playerState || playerState.phase !== 'round_voting') {
      setSelectedAction(null)
      setContent('')
      return
    }

    if (playerState.factionSubmitted) {
      setSelectedAction(null)
      setContent('')
    }
  }, [playerState])

  useEffect(() => {
    if (!playerState || playerState.phase !== 'round_voting') {
      return
    }

    const timer = window.setInterval(() => {
      setNowMs(Date.now())
    }, 200)

    return () => {
      window.clearInterval(timer)
    }
  }, [playerState])

  const handleSelectAction = (action: ActionOption) => {
    if (!playerState || playerState.factionSubmitted || !action.affordable) {
      return
    }

    setError(null)
    setSelectedAction(action)
    setContent('')
  }

  const handleSubmit = async () => {
    if (!playerState || !selectedAction || playerState.factionSubmitted) {
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

  const handleCloseBriefing = () => {
    setIsBriefingOpen(false)

    window.requestAnimationFrame(() => {
      actionPanelRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }

  if (playerState === undefined) {
    return (
      <PageShell title="Loading Seat" subtitle="Connecting you to the current game.">
        <Card className="neo-panel py-0">
          <CardContent className="flex items-center gap-3 px-6 py-6">
            <Spinner className="size-5 text-black" />
            <p className="text-sm text-black/90">Syncing your player state...</p>
          </CardContent>
        </Card>
      </PageShell>
    )
  }

  if (playerState === null) {
    return (
      <PageShell title="Player Link Not Found" subtitle="This player URL is no longer valid.">
        <Card className="neo-panel py-0">
          <CardContent className="space-y-4 px-6 py-6">
            <p className="text-sm text-black/90">Join again with the host code.</p>
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

  if (playerState.phase === 'game_introduction') {
    return (
      <PageShell
        eyebrow={playerState.player.faction.name}
        subtitle="The host is running the opening scene on the main display."
        title="Opening Scene"
      >
        <PlayerEstablishingPlaceholder factionName={playerState.player.faction.name} />
      </PageShell>
    )
  }

  if (playerState.phase === 'round_loading') {
    return (
      <PageShell
        eyebrow={playerState.player.faction.name}
        subtitle="Your faction briefing is almost ready."
        title="Briefings Incoming"
      >
        <PhaseHoldingScreen
          description="Keep this page open. Your move menu unlocks automatically once briefings are complete."
          label="Briefings Incoming"
          title="Setting Up Your Round"
        />
      </PageShell>
    )
  }

  if (playerState.phase === 'round_voting') {
    const goal = playerState.goal ?? 'Pick one move that pushes your faction closer to its target mood.'
    const briefing =
      playerState.briefing ??
      'Briefing is still syncing. Keep this tab open and your team menu will stay ready.'
    const remainingSeconds = playerState.submittingDeadlineMs
      ? Math.max(Math.ceil((playerState.submittingDeadlineMs - nowMs) / 1000), 0)
      : null

    return (
      <PageShell
        eyebrow={playerState.player.faction.name}
        subtitle="Coordinate fast. The first teammate to lock a move submits for everyone."
        title={`Round ${playerState.roundNumber ?? 1}: Make Your Move`}
      >
        <BriefingModal
          briefing={briefing}
          factionName={playerState.player.faction.name}
          goal={goal}
          isOpen={isBriefingOpen}
          onClose={handleCloseBriefing}
        />

        <section className="grid gap-4 lg:grid-cols-[minmax(0,340px)_1fr]">
          <Card className="neo-panel neo-grid gap-4 py-4">
            <CardHeader className="gap-3 pb-0">
              <CardTitle className="font-display text-3xl text-black">You</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pb-2">
              <div className="flex items-center gap-3">
                <Avatar className="size-14 border-2 border-black bg-muted" size="lg">
                  <AvatarImage
                    alt={`${playerState.player.name} avatar`}
                    className="object-cover"
                    src={playerState.player.avatar}
                  />
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

          <Card className="neo-panel neo-grid gap-4 py-4">
            <CardHeader className="gap-3 pb-0">
              <CardTitle className="font-display text-3xl text-black">Faction Brief</CardTitle>
              <CardDescription className="text-black/90">
                Keep your move aligned with this objective.
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
                  onClick={() => setIsBriefingOpen(true)}
                  type="button"
                  variant="secondary"
                >
                  View Full Brief
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

        <section className="space-y-3" ref={actionPanelRef}>
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
                  <p className="text-sm text-black/92">
                    {playerState.submittedAction?.content ?? 'A teammate has already submitted for this round.'}
                  </p>
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
              onBack={() => {
                setSelectedAction(null)
                setContent('')
              }}
              onContentChange={setContent}
              onSubmit={handleSubmit}
            />
          ) : (
            <>
              {playerState.sharedActions.length === 0 && playerState.factionActions.length === 0 ? (
                <Card className="neo-panel py-0">
                  <CardContent className="space-y-3 px-6 py-5">
                    <p className="font-heading text-lg text-black">No moves available yet.</p>
                    <p className="text-sm text-black/90">
                      Keep this page open and refresh in a moment. If this persists, tell the host to refresh the main screen.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <ActionMenu
                  factionActions={playerState.factionActions}
                  locked={playerState.factionSubmitted}
                  onSelectAction={handleSelectAction}
                  sharedActions={playerState.sharedActions}
                />
              )}
            </>
          )}
        </section>

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

        {error ? (
          <Badge className="w-fit rounded-full border border-black bg-destructive px-3 py-1 text-[0.68rem] text-destructive-foreground">
            {error}
          </Badge>
        ) : null}
      </PageShell>
    )
  }

  if (playerState.phase === 'round_processing') {
    return (
      <PageShell
        eyebrow={playerState.player.faction.name}
        subtitle="All teams are locked. Results are being scored."
        title="Scoring the Spin"
      >
        <PhaseHoldingScreen
          description="The main display is processing outcomes. Results are up next."
          label="Scoring The Spin"
          title="Waiting For Results"
        />
      </PageShell>
    )
  }

  return (
    <PageShell
      eyebrow={playerState.player.faction.name}
      subtitle="The next player phase is not available on phones yet."
      title="Intermission"
    >
      <Card className="neo-panel py-0">
        <CardContent className="space-y-3 px-6 py-6">
          <p className="text-sm text-black/90">Stay ready. The host will move the game forward.</p>
        </CardContent>
      </Card>
    </PageShell>
  )
}

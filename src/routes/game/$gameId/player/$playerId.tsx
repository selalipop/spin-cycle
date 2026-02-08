import { useEffect, useState } from 'react'
import { Avatar, Button, Card, Chip, Spinner } from '@heroui/react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import {
  ActionMenu,
  type ActionOption,
} from '~/components/gameplay/action-menu'
import { BriefingModal } from '~/components/gameplay/briefing-modal'
import { PhaseHoldingScreen } from '~/components/gameplay/phase-holding-screen'
import { SubmissionCompose } from '~/components/gameplay/submission-compose'
import { PlayerEstablishingPlaceholder } from '~/components/lobby/player-establishing-placeholder'
import { FactionCard } from '~/components/lobby/faction-card'
import { PageShell } from '~/components/lobby/page-shell'
import { PlayerListItem } from '~/components/lobby/player-list-item'
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

  useEffect(() => {
    if (!playerState) {
      return
    }

    savePlayerRoute(playerState.gameId, playerState.player.id)
  }, [playerState])

  useEffect(() => {
    if (!playerState || playerState.phase !== 'submitting' || !playerState.roundNumber) {
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
    if (!playerState || playerState.phase !== 'submitting') {
      setSelectedAction(null)
      setContent('')
      return
    }

    if (playerState.factionSubmitted) {
      setSelectedAction(null)
      setContent('')
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
      setError('Could not submit action. Your faction may already be locked.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (playerState === undefined) {
    return (
      <PageShell title="Player Waiting Room" subtitle="Loading your faction seat...">
        <Card className="border border-zinc-700/70 bg-zinc-900/70">
          <Card.Content className="flex items-center gap-3 py-6">
            <Spinner />
            <p className="text-sm text-zinc-300">Syncing with game state...</p>
          </Card.Content>
        </Card>
      </PageShell>
    )
  }

  if (playerState === null) {
    return (
      <PageShell title="Player Not Found" subtitle="This player link is invalid.">
        <Card className="border border-zinc-700/70 bg-zinc-900/70">
          <Card.Content className="space-y-4 py-6">
            <p className="text-sm text-zinc-300">Try joining again with the lobby join code.</p>
            <Button onPress={() => window.location.assign('/')}>Back to Home</Button>
          </Card.Content>
        </Card>
      </PageShell>
    )
  }

  if (playerState.phase === 'establishing') {
    return (
      <PageShell
        eyebrow={playerState.player.faction.name}
        subtitle="The host is presenting the opening sequence on the main screen."
        title="Establishing In Progress"
      >
        <PlayerEstablishingPlaceholder factionName={playerState.player.faction.name} />
      </PageShell>
    )
  }

  if (playerState.phase === 'planning') {
    return (
      <PageShell
        eyebrow={playerState.player.faction.name}
        subtitle="Faction-specific briefings are being prepared."
        title="Planning Round"
      >
        <PhaseHoldingScreen
          description="The main screen is generating strategic briefings for each faction. Your phone will unlock submissions automatically."
          label="Planning"
          title="Preparing Your Briefing"
        />
      </PageShell>
    )
  }

  if (playerState.phase === 'submitting') {
    const goal =
      playerState.goal ??
      'Advance your faction agenda with one strong move before the deadline.'
    const briefing =
      playerState.briefing ??
      'Briefing is still syncing. Keep this tab open and wait a moment.'

    return (
      <PageShell
        eyebrow={playerState.player.faction.name}
        subtitle="Coordinate quickly. First submit locks your whole faction."
        title={`Round ${playerState.roundNumber ?? 1} Submission`}
      >
        <BriefingModal
          briefing={briefing}
          factionName={playerState.player.faction.name}
          goal={goal}
          isOpen={isBriefingOpen}
          onClose={() => setIsBriefingOpen(false)}
        />

        <section className="grid gap-4 lg:grid-cols-[minmax(0,320px)_1fr]">
          <Card className="border border-zinc-700/70 bg-zinc-900/70">
            <Card.Header>
              <Card.Title>You</Card.Title>
            </Card.Header>
            <Card.Content className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <Avatar.Fallback>{playerState.player.avatar}</Avatar.Fallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-zinc-100">{playerState.player.name}</p>
                  <p className="text-sm text-zinc-400">{playerState.player.faction.name}</p>
                </div>
              </div>
              <Chip className="bg-zinc-700/70 text-zinc-100" size="sm">
                Credits: {playerState.factionCredits}
              </Chip>
              {playerState.submittingDeadlineMs ? (
                <Chip className="bg-zinc-700/70 text-zinc-100" size="sm">
                  Deadline: {Math.max(Math.ceil((playerState.submittingDeadlineMs - Date.now()) / 1000), 0)}s
                </Chip>
              ) : null}
            </Card.Content>
          </Card>

          <Card className="border border-zinc-700/70 bg-zinc-950/70">
            <Card.Content className="space-y-4 py-5">
              <div className="rounded-xl border border-zinc-700/70 bg-zinc-900/70 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">Goal</p>
                <p className="mt-2 text-base font-medium text-zinc-100">{goal}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button onPress={() => setIsBriefingOpen(true)} size="sm" variant="ghost">
                  View Full Briefing
                </Button>
                {playerState.factionSubmitted ? (
                  <Chip className="bg-emerald-600/25 text-emerald-200" size="sm">
                    Faction Locked
                  </Chip>
                ) : null}
              </div>
            </Card.Content>
          </Card>
        </section>

        {playerState.factionSubmitted ? (
          <PhaseHoldingScreen
            description="Another teammate already submitted for this faction. Waiting for remaining factions or timeout."
            label="Submitted"
            title="Waiting For Other Factions"
          />
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
          <ActionMenu
            factionActions={playerState.factionActions}
            locked={playerState.factionSubmitted}
            onSelectAction={handleSelectAction}
            sharedActions={playerState.sharedActions}
          />
        )}

        <Card className="border border-zinc-700/70 bg-zinc-900/70">
          <Card.Header>
            <Card.Title>Your Faction</Card.Title>
            <Card.Description>Live roster for {playerState.player.faction.name}.</Card.Description>
          </Card.Header>
          <Card.Content className="space-y-3">
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
          </Card.Content>
        </Card>

        {error ? <Chip className="w-fit bg-rose-600/25 text-rose-200">{error}</Chip> : null}
      </PageShell>
    )
  }

  if (playerState.phase === 'resolving') {
    return (
      <PageShell
        eyebrow={playerState.player.faction.name}
        subtitle="Submissions are locked and the round is resolving."
        title="Resolving Round"
      >
        <PhaseHoldingScreen
          description="The main screen is processing round outcomes. Hold tight for results."
          label="Resolving"
          title="Waiting For Results"
        />
      </PageShell>
    )
  }

  return (
    <PageShell
      eyebrow={playerState.player.faction.name}
      subtitle="Stay ready. The host will continue the game flow."
      title="Waiting for Host"
    >
      <Card className="border border-zinc-700/70 bg-zinc-900/70">
        <Card.Content className="space-y-3 py-6">
          <Chip className="w-fit bg-zinc-700/70 text-zinc-100">Phase: {playerState.phase}</Chip>
          <p className="text-sm text-zinc-300">This phase is not yet implemented on phones.</p>
        </Card.Content>
      </Card>
    </PageShell>
  )
}

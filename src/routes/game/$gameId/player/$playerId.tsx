import { useEffect } from 'react'
import { Avatar, Button, Card, Chip, Spinner } from '@heroui/react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import { FactionCard } from '~/components/lobby/faction-card'
import { PageShell } from '~/components/lobby/page-shell'
import { PlayerListItem } from '~/components/lobby/player-list-item'
import { savePlayerRoute } from '~/lib/session'

export const Route = createFileRoute('/game/$gameId/player/$playerId')({
  component: PlayerWaitingRoom,
})

function PlayerWaitingRoom() {
  const { gameId, playerId } = Route.useParams()
  const playerState = useQuery(api.lobby.getPlayerState, { gameId, playerId })

  useEffect(() => {
    if (!playerState) {
      return
    }

    savePlayerRoute(playerState.gameId, playerState.player.id)
  }, [playerState])

  if (playerState === undefined) {
    return (
      <PageShell title="Player Waiting Room" subtitle="Loading your faction seat...">
        <Card className="border border-zinc-700/70 bg-zinc-900/70">
          <Card.Content className="flex items-center gap-3 py-6">
            <Spinner />
            <p className="text-sm text-zinc-300">Syncing with lobby...</p>
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

  return (
    <PageShell
      eyebrow={playerState.player.faction.name}
      subtitle="Stay ready. The host will kick off round one soon."
      title="Waiting for Host to Start"
    >
      <section className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
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
            <Chip className="w-fit bg-zinc-700/70 text-zinc-100">
              Phase: {playerState.phase}
            </Chip>
            {playerState.phase === 'lobby' ? (
              <p className="text-sm text-zinc-300">Waiting for host to start...</p>
            ) : (
              <Chip className="bg-emerald-600/25 text-emerald-200">
                Host started the game. Round screen coming next.
              </Chip>
            )}
          </Card.Content>
        </Card>

        <Card className="border border-zinc-700/70 bg-zinc-900/70">
          <Card.Header>
            <Card.Title>Your Faction</Card.Title>
            <Card.Description>Live roster updates for your team.</Card.Description>
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
      </section>
    </PageShell>
  )
}

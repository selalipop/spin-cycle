import { useMemo, useState } from 'react'
import { Button, Card, Chip, Spinner } from '@heroui/react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { FactionCard } from '~/components/lobby/faction-card'
import { PageShell } from '~/components/lobby/page-shell'
import { PlayerListItem } from '~/components/lobby/player-list-item'

export const Route = createFileRoute('/game/$gameId/host')({
  component: HostWaitingRoom,
})

function HostWaitingRoom() {
  const { gameId } = Route.useParams()
  const lobby = useQuery(api.lobby.getGameLobby, { gameId })
  const startGame = useMutation(api.lobby.startGame)

  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    if (!lobby || lobby.phase !== 'lobby') {
      return
    }

    setError(null)
    setIsStarting(true)

    try {
      await startGame({ gameId: lobby.gameId })
    } catch {
      setError('Could not start game. Please try again.')
      setIsStarting(false)
    }
  }

  if (lobby === undefined) {
    return (
      <PageShell title="Host Waiting Room" subtitle="Loading game lobby...">
        <Card className="border border-zinc-700/70 bg-zinc-900/70">
          <Card.Content className="flex items-center gap-3 py-6">
            <Spinner />
            <p className="text-sm text-zinc-300">Loading lobby details...</p>
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
            <p className="text-5xl font-semibold tracking-[0.25em] text-zinc-100">{lobby.joinCode}</p>
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
            <Button className="w-full" isDisabled={isStarting || lobby.phase !== 'lobby'} onPress={handleStart}>
              {lobby.phase === 'lobby' ? (isStarting ? 'Starting...' : 'Start Game') : 'Game Started'}
            </Button>
            <Chip className="bg-zinc-700/70 text-zinc-100">
              Phase: {lobby.phase}
            </Chip>
            {error ? (
              <Chip className="bg-rose-600/25 text-rose-200">
                {error}
              </Chip>
            ) : null}
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

import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Chip, Input, Spinner } from '@heroui/react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { AvatarPicker } from '~/components/lobby/avatar-picker'
import { FactionCard } from '~/components/lobby/faction-card'
import { PageShell } from '~/components/lobby/page-shell'
import { getSavedPlayerId, getOrCreateSessionId, savePlayerRoute } from '~/lib/session'

export const Route = createFileRoute('/join/$joinCode')({
  component: JoinGamePage,
})

function JoinGamePage() {
  const { joinCode } = Route.useParams()

  const normalizedJoinCode = useMemo(() => joinCode.trim().toUpperCase(), [joinCode])
  const game = useQuery(api.lobby.getGameByJoinCode, { joinCode: normalizedJoinCode })
  const joinGame = useMutation(api.lobby.joinGame)

  const [playerName, setPlayerName] = useState('')
  const [avatar, setAvatar] = useState('🗞️')
  const [selectedFactionId, setSelectedFactionId] = useState<string | null>(null)
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!game?.factions.length) {
      return
    }

    if (selectedFactionId) {
      return
    }

    const sorted = [...game.factions].sort((a, b) => a.playerCount - b.playerCount)
    setSelectedFactionId(sorted[0]?.id ?? null)
  }, [game, selectedFactionId])

  useEffect(() => {
    if (!game) {
      return
    }

    const savedPlayerId = getSavedPlayerId(game.gameId)
    if (!savedPlayerId) {
      return
    }

    window.location.replace(`/game/${game.gameId}/player/${savedPlayerId}`)
  }, [game])

  const handleJoin = async () => {
    if (!game) {
      return
    }

    if (game.phase !== 'lobby') {
      setError('This game is already in progress.')
      return
    }

    if (!selectedFactionId) {
      setError('Pick a faction before joining.')
      return
    }

    if (!playerName.trim()) {
      setError('Enter your name to join.')
      return
    }

    setError(null)
    setIsJoining(true)

    try {
      const sessionId = getOrCreateSessionId()
      const result = await joinGame({
        joinCode: normalizedJoinCode,
        playerName,
        factionId: selectedFactionId as any,
        avatar,
        sessionId,
      })

      savePlayerRoute(result.gameId, result.playerId)
      window.location.assign(`/game/${result.gameId}/player/${result.playerId}`)
    } catch {
      setError('Could not join this game. Try a different faction or refresh.')
      setIsJoining(false)
    }
  }

  if (game === undefined) {
    return (
      <PageShell title="Joining Game" subtitle="Loading lobby...">
        <Card className="border border-zinc-700/70 bg-zinc-900/70">
          <Card.Content className="flex items-center gap-3 py-6">
            <Spinner />
            <p className="text-sm text-zinc-300">Looking up game code {normalizedJoinCode}...</p>
          </Card.Content>
        </Card>
      </PageShell>
    )
  }

  if (game === null) {
    return (
      <PageShell title="Game Not Found" subtitle="Double-check the join code and try again.">
        <Card className="border border-zinc-700/70 bg-zinc-900/70">
          <Card.Content className="space-y-4 py-6">
            <p className="text-sm text-zinc-300">No game exists for code {normalizedJoinCode}.</p>
            <Button onPress={() => window.location.assign('/')}>Back to Home</Button>
          </Card.Content>
        </Card>
      </PageShell>
    )
  }

  return (
    <PageShell
      eyebrow={`Code ${game.joinCode}`}
      subtitle="Choose your identity and faction before the host starts."
      title="Join Newsroom"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        <Card className="border border-zinc-700/70 bg-zinc-900/70">
          <Card.Header>
            <Card.Title>Player Setup</Card.Title>
          </Card.Header>
          <Card.Content className="space-y-4">
            <Input
              aria-label="Player name"
              maxLength={24}
              onChange={(event) => setPlayerName(event.currentTarget.value)}
              placeholder="Your name"
              value={playerName}
            />
            <AvatarPicker onChange={setAvatar} value={avatar} />
            <Button
              className="w-full"
              isDisabled={isJoining || !selectedFactionId || game.phase !== 'lobby'}
              onPress={handleJoin}
            >
              {isJoining ? 'Joining...' : 'Join'}
            </Button>
            {game.phase !== 'lobby' ? (
              <Chip className="bg-amber-600/25 text-amber-200">
                Host already started this game.
              </Chip>
            ) : null}
            {error ? (
              <Chip className="bg-rose-600/25 text-rose-200">
                {error}
              </Chip>
            ) : null}
          </Card.Content>
        </Card>

        <Card className="border border-zinc-700/70 bg-zinc-900/70">
          <Card.Header>
            <Card.Title>Pick Your Faction</Card.Title>
            <Card.Description>Each team has a distinct media style and objective.</Card.Description>
          </Card.Header>
          <Card.Content className="grid gap-3 md:grid-cols-2">
            {game.factions.map((faction) => (
              <FactionCard
                actionLabel={selectedFactionId === faction.id ? 'Ready' : 'Choose Faction'}
                code={faction.code}
                description={faction.description}
                key={faction.id}
                name={faction.name}
                onSelect={() => setSelectedFactionId(faction.id)}
                playerCount={faction.playerCount}
                selected={selectedFactionId === faction.id}
              />
            ))}
          </Card.Content>
        </Card>
      </div>
    </PageShell>
  )
}

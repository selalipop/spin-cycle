import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { AvatarPicker } from '~/components/lobby/avatar-picker'
import { FactionCard } from '~/components/lobby/faction-card'
import { PageShell } from '~/components/lobby/page-shell'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Spinner } from '~/components/ui/spinner'
import { DEFAULT_AVATAR_PATH } from '~/lib/avatars'
import { getOrCreateSessionId, getSavedPlayerId, savePlayerRoute } from '~/lib/session'

export const Route = createFileRoute('/join/$joinCode')({
  component: JoinGamePage,
})

function JoinGamePage() {
  const { joinCode } = Route.useParams()

  const normalizedJoinCode = useMemo(() => joinCode.trim().toUpperCase(), [joinCode])
  const game = useQuery(api.lobby.getGameByJoinCode, { joinCode: normalizedJoinCode })
  const joinGame = useMutation(api.lobby.joinGame)

  const [playerName, setPlayerName] = useState('')
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR_PATH)
  const [selectedFactionId, setSelectedFactionId] = useState<string | null>(null)
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!game?.factions.length || selectedFactionId) {
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

    if (game.phase !== 'game_lobby') {
      setError('This room already started. Ask the host for the next game code.')
      return
    }

    if (!selectedFactionId) {
      setError('Pick a faction before joining.')
      return
    }

    if (!playerName.trim()) {
      setError('Add your name first.')
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
      setError('Could not join right now. Try another faction or refresh.')
      setIsJoining(false)
    }
  }

  if (game === undefined) {
    return (
      <PageShell title="Finding Room" subtitle="Checking that join code.">
        <Card className="neo-panel py-0">
          <CardContent className="flex items-center gap-3 px-6 py-6">
            <Spinner className="size-5 text-black" />
            <p className="text-sm text-black/75">Looking up code {normalizedJoinCode}...</p>
          </CardContent>
        </Card>
      </PageShell>
    )
  }

  if (game === null) {
    return (
      <PageShell title="Room Not Found" subtitle="This code does not match an active room.">
        <Card className="neo-panel py-0">
          <CardContent className="space-y-4 px-6 py-6">
            <p className="text-sm text-black/75">No game exists for code {normalizedJoinCode}.</p>
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

  return (
    <PageShell
      eyebrow={`Code ${game.joinCode}`}
      subtitle="Pick your name, avatar, and faction before round one starts."
      title="Join Spin Cycle"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        <Card className="neo-panel neo-grid gap-4 py-4">
          <CardHeader className="gap-3 pb-0">
            <CardTitle className="font-display text-3xl text-black">Player Setup</CardTitle>
            <CardDescription className="text-black/75">
              This is your identity for the whole match.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pb-2">
            <Input
              aria-label="Player name"
              className="h-11 border-2 border-black bg-white text-black placeholder:text-black/45"
              maxLength={24}
              onChange={(event) => setPlayerName(event.currentTarget.value)}
              placeholder="Your name"
              value={playerName}
            />

            <AvatarPicker onChange={setAvatar} value={avatar} />

            <Button
              className="h-11 w-full border-2 border-black font-heading text-xs uppercase tracking-[0.08em]"
              disabled={isJoining || !selectedFactionId || game.phase !== 'game_lobby'}
              onClick={handleJoin}
              type="button"
            >
              {isJoining ? 'Joining...' : 'Join Team'}
            </Button>

            {game.phase !== 'game_lobby' ? (
              <Badge className="w-fit rounded-full border border-black bg-amber-300 px-3 py-1 text-[0.68rem] text-black">
                Host already started this room.
              </Badge>
            ) : null}

            {error ? (
              <Badge className="w-fit rounded-full border border-black bg-destructive px-3 py-1 text-[0.68rem] text-destructive-foreground">
                {error}
              </Badge>
            ) : null}
          </CardContent>
        </Card>

        <Card className="neo-panel neo-grid gap-4 py-4">
          <CardHeader className="gap-3 pb-0">
            <CardTitle className="font-display text-3xl text-black">Choose Your Faction</CardTitle>
            <CardDescription className="text-black/75">
              Every faction wants public sentiment to land in different places.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 pb-2 md:grid-cols-2">
            {game.factions.map((faction) => (
              <FactionCard
                actionLabel={selectedFactionId === faction.id ? 'Ready' : 'Choose Team'}
                code={faction.code}
                description={faction.description}
                key={faction.id}
                name={faction.name}
                onSelect={() => setSelectedFactionId(faction.id)}
                playerCount={faction.playerCount}
                selected={selectedFactionId === faction.id}
              />
            ))}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}

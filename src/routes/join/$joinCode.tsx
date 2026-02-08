import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import Resizer from 'react-image-file-resizer'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { AvatarPicker } from '~/components/lobby/avatar-picker'
import { FactionCard } from '~/components/lobby/faction-card'
import { PageShell } from '~/components/lobby/page-shell'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { WashingMachineLoader } from '~/components/ui/washing-machine-loader'
import { getOrCreateSessionId, getSavedPlayerId, savePlayerRoute } from '~/lib/session'
import { cn } from '~/lib/utils'

export const Route = createFileRoute('/join/$joinCode')({
  component: JoinGamePage,
})

function shuffle<T>(values: Array<T>): Array<T> {
  const shuffled = [...values]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const temp = shuffled[index]
    shuffled[index] = shuffled[swapIndex]
    shuffled[swapIndex] = temp
  }

  return shuffled
}

function resizeAvatarImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const compressFormat: 'JPEG' | 'PNG' | 'WEBP' = file.type === 'image/png'
      ? 'PNG'
      : file.type === 'image/webp'
        ? 'WEBP'
        : 'JPEG'

    Resizer.imageFileResizer(
      file,
      600,
      600,
      compressFormat,
      90,
      0,
      (resizedImage) => {
        if (resizedImage instanceof File) {
          resolve(resizedImage)
          return
        }

        if (resizedImage instanceof Blob) {
          resolve(
            new File([resizedImage], file.name, {
              type: resizedImage.type || file.type || 'image/jpeg',
            }),
          )
          return
        }

        reject(new Error('Invalid resized image output'))
      },
      'file',
    )
  })
}

function JoinGamePage() {
  const { joinCode } = Route.useParams()

  const normalizedJoinCode = useMemo(() => joinCode.trim().toUpperCase(), [joinCode])
  const game = useQuery(api.lobby.getGameByJoinCode, { joinCode: normalizedJoinCode })
  const joinGame = useMutation(api.lobby.joinGame)
  const generateAvatarUploadUrl = useMutation(api.lobby.generateAvatarUploadUrl)
  const getAvatarUrl = useMutation(api.lobby.getAvatarUrl)

  const [playerName, setPlayerName] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [selectedFactionId, setSelectedFactionId] = useState<Id<'factions'> | null>(null)
  const [shuffledFactionIds, setShuffledFactionIds] = useState<Array<Id<'factions'>>>([])
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const factions = game?.factions ?? []
  const hasName = playerName.trim().length > 0
  const hasAvatar = avatar !== null
  const canChooseFaction = hasName && hasAvatar && game?.phase === 'game_lobby'
  const canJoinTeam = canChooseFaction && selectedFactionId !== null

  useEffect(() => {
    if (!factions.length) {
      return
    }

    const factionIds = factions.map((faction) => faction.id)
    setShuffledFactionIds((existingOrder) => {
      if (
        existingOrder.length === factionIds.length
        && existingOrder.every((id) => factionIds.includes(id))
      ) {
        return existingOrder
      }

      return shuffle(factionIds)
    })
  }, [factions])

  useEffect(() => {
    if (!selectedFactionId || factions.some((faction) => faction.id === selectedFactionId)) {
      return
    }

    setSelectedFactionId(null)
  }, [factions, selectedFactionId])

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

  const shuffledFactions = useMemo(() => {
    if (!factions.length || !shuffledFactionIds.length) {
      return factions
    }

    const factionById = new Map(factions.map((faction) => [faction.id, faction]))
    const orderedFactions = shuffledFactionIds
      .map((factionId) => factionById.get(factionId))
      .filter((faction): faction is (typeof factions)[number] => faction !== undefined)

    return orderedFactions.length === factions.length ? orderedFactions : factions
  }, [factions, shuffledFactionIds])

  const handleUploadFromDevice = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }

    setError(null)
    setIsUploadingAvatar(true)

    try {
      const resizedFile = await resizeAvatarImage(file)
      const uploadUrl = await generateAvatarUploadUrl()
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': resizedFile.type || 'application/octet-stream',
        },
        body: resizedFile,
      })

      if (!uploadResponse.ok) {
        throw new Error('Upload failed')
      }

      const uploadPayload = await uploadResponse.json() as { storageId?: Id<'_storage'> }

      if (!uploadPayload.storageId) {
        throw new Error('Storage id missing')
      }

      const uploadedAvatarUrl = await getAvatarUrl({ storageId: uploadPayload.storageId })
      setAvatar(uploadedAvatarUrl)
    } catch {
      setError('Could not upload avatar right now. Try a different image or retry.')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleJoin = async () => {
    if (!game) {
      return
    }

    if (game.phase !== 'game_lobby') {
      setError('This room already started. Ask the host for the next game code.')
      return
    }

    const normalizedPlayerName = playerName.trim()
    if (!normalizedPlayerName) {
      setError('Add your name first.')
      return
    }

    if (!avatar) {
      setError('Pick an avatar before choosing a faction.')
      return
    }

    if (!selectedFactionId) {
      setError('Pick a faction before joining.')
      return
    }

    setError(null)
    setIsJoining(true)

    try {
      const sessionId = getOrCreateSessionId()
      const result = await joinGame({
        joinCode: normalizedJoinCode,
        playerName: normalizedPlayerName,
        factionId: selectedFactionId,
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
          <CardContent className="flex flex-col items-center gap-4 px-6 py-10">
            <WashingMachineLoader />
            <p className="text-base text-black/90">Looking up code {normalizedJoinCode}...</p>
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
            <p className="text-base text-black/90">No game exists for code {normalizedJoinCode}.</p>
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

  return (
    <PageShell
      eyebrow={`Code ${game.joinCode}`}
      subtitle="Get ready for round one."
      title="Join Spin Cycle"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        <Card className="neo-panel neo-grid gap-4 py-4">
          <CardHeader className="gap-3 pb-0">
            <CardTitle className="font-display text-3xl text-black">Player Setup</CardTitle>
            <CardDescription className="text-black/90">
              This is you for the game.
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

            <AvatarPicker
              isUploadingFromDevice={isUploadingAvatar}
              onChange={setAvatar}
              onUploadFromDevice={handleUploadFromDevice}
              value={avatar}
            />

            <Button
              className="h-11 w-full border-2 border-black font-heading text-sm uppercase tracking-[0.08em]"
              disabled={isJoining || isUploadingAvatar || !canJoinTeam}
              onClick={handleJoin}
              type="button"
            >
              {isJoining ? 'Joining...' : 'Join Team'}
            </Button>

            {game.phase !== 'game_lobby' ? (
              <Badge className="w-fit rounded-full border border-black bg-amber-300 px-3 py-1 text-xs text-black">
                Host already started this room.
              </Badge>
            ) : null}

            {error ? (
              <Badge className="w-fit rounded-full border border-black bg-destructive px-3 py-1 text-xs text-destructive-foreground">
                {error}
              </Badge>
            ) : null}
          </CardContent>
        </Card>

        <Card
          className={cn(
            'neo-panel neo-grid gap-4 py-4 transition-opacity',
            canChooseFaction ? 'opacity-100' : 'opacity-55 saturate-0',
          )}
        >
          <CardHeader className="gap-3 pb-0">
            <CardTitle className="font-display text-3xl text-black">Choose Your Faction</CardTitle>
            <CardDescription className="text-black/90">
              Each faction has a different angle.
            </CardDescription>
            {!hasName || !hasAvatar ? (
              <Badge className="w-fit rounded-full border border-black bg-slate-200 px-3 py-1 text-xs text-black">
                Add a name and avatar to unlock team selection.
              </Badge>
            ) : null}
          </CardHeader>
          <CardContent className="grid gap-3 pb-2 md:grid-cols-2">
            {shuffledFactions.map((faction) => (
              <FactionCard
                actionLabel={
                  canChooseFaction
                    ? (selectedFactionId === faction.id ? 'Ready' : 'Choose Team')
                    : 'Locked'
                }
                code={faction.code}
                disabled={!canChooseFaction || isJoining}
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

import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { HomeTitleRibbon } from '~/components/lobby/home-title-ribbon'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { PageShell } from '~/components/lobby/page-shell'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const createGame = useMutation(api.lobby.createGame)

  const [joinCode, setJoinCode] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const normalizedJoinCode = joinCode.trim().toUpperCase()

  const handleCreate = async () => {
    setError(null)
    setIsCreating(true)

    try {
      const game = await createGame({})
      window.location.assign(`/game/${game.gameId}/host`)
    } catch {
      setError('Could not start a new room. Please try again.')
      setIsCreating(false)
    }
  }

  const handleJoin = () => {
    if (!normalizedJoinCode) {
      setError('Enter a room code first.')
      return
    }

    setError(null)
    setIsJoining(true)
    window.location.assign(`/join/${normalizedJoinCode}`)
  }

  return (
    <PageShell
    >
      <HomeTitleRibbon />

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="neo-panel neo-grid neo-tilt-left gap-4 py-4">
          <CardHeader className="gap-3 pb-0">
            <Badge className="w-fit rounded-full border border-black bg-rose-300 px-3 py-1 text-xs uppercase text-black">
              Host Screen
            </Badge>
            <CardTitle className="font-display text-3xl text-black">Start a Game</CardTitle>
            <CardDescription className="text-black/90">
              Set up a room and run the show.
            </CardDescription>
          </CardHeader>
          <img src="/public/splash.png" alt="Spin Cycle Logo" className="w-full max-w-120 mx-auto" />

          <CardContent className="space-y-4 pb-2">
            <Button
              className="h-12 w-full border-2 border-black font-heading text-sm uppercase tracking-[0.08em]"
              disabled={isCreating || isJoining}
              onClick={handleCreate}
              type="button"
            >
              {isCreating ? 'Creating Room...' : 'Create Host Room'}
            </Button>
          </CardContent>
        </Card>

        <Card className="neo-panel neo-grid neo-tilt-right gap-4 py-4">
          <CardHeader className="gap-3 pb-0">
            <Badge className="w-fit rounded-full border border-black bg-amber-300 px-3 py-1 text-xs uppercase text-black">
              Phone Players
            </Badge>
            <CardTitle className="font-display text-3xl text-black">Join a Game</CardTitle>
            <CardDescription className="text-black/90">
              Got a code? Jump in.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pb-2">
            <Input
              aria-label="Join code"
              className="neo-code h-12 border-2 border-black bg-white px-4 text-center text-black placeholder:text-black/40"
              maxLength={5}
              onChange={(event) => {
                setJoinCode(event.currentTarget.value.toUpperCase())
              }}
              placeholder="ABCDE"
              value={joinCode}
            />
            <Button
              className="h-12 w-full border-2 border-black font-heading text-sm uppercase tracking-[0.08em]"
              disabled={!normalizedJoinCode || isCreating || isJoining}
              onClick={handleJoin}
              type="button"
              variant="secondary"
            >
              {isJoining ? 'Joining...' : 'Enter Game'}
            </Button>
          </CardContent>
        </Card>
      </section>

      {error ? (
        <Badge className="w-fit rounded-full border border-black bg-destructive px-3 py-1 text-xs text-destructive-foreground">
          {error}
        </Badge>
      ) : null}
    </PageShell>
  )
}

import { useState } from 'react'
import { Button, Card, Chip, Input } from '@heroui/react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
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
      setError('Could not create game right now. Please try again.')
      setIsCreating(false)
    }
  }

  const handleJoin = () => {
    if (!normalizedJoinCode) {
      setError('Enter a game code to join.')
      return
    }

    setError(null)
    setIsJoining(true)
    window.location.assign(`/join/${normalizedJoinCode}`)
  }

  return (
    <PageShell
      eyebrow="Newsroom"
      subtitle="Four factions. One breaking story. Total narrative warfare."
      title="Run the room, bend the headlines"
    >
      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border border-zinc-700/70 bg-zinc-900/70">
          <Card.Header>
            <Card.Title>Host a Game</Card.Title>
            <Card.Description>Create a new lobby and bring teams in.</Card.Description>
          </Card.Header>
          <Card.Content className="space-y-4">
            <p className="text-sm text-zinc-300">
              Start a fresh match with all 4 factions, default actions, and neutral sentiment.
            </p>
            <Button className="w-full" isDisabled={isCreating || isJoining} onPress={handleCreate}>
              {isCreating ? 'Creating...' : 'Create Game'}
            </Button>
          </Card.Content>
        </Card>

        <Card className="border border-zinc-700/70 bg-zinc-900/70">
          <Card.Header>
            <Card.Title>Join a Game</Card.Title>
            <Card.Description>Enter the short host code.</Card.Description>
          </Card.Header>
          <Card.Content className="space-y-4">
            <Input
              aria-label="Join code"
              className="uppercase"
              maxLength={6}
              onChange={(event) => {
                setJoinCode(event.currentTarget.value.toUpperCase())
              }}
              placeholder="ABCD"
              value={joinCode}
            />
            <Button className="w-full" isDisabled={!normalizedJoinCode || isCreating || isJoining} onPress={handleJoin}>
              Join Game
            </Button>
          </Card.Content>
        </Card>
      </section>

      {error ? (
        <Chip className="w-fit bg-rose-600/25 text-rose-200">
          {error}
        </Chip>
      ) : null}
    </PageShell>
  )
}

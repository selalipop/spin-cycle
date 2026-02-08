import { Navigate, createFileRoute } from '@tanstack/react-router'
import { getPlayerPhaseRouteTo, getPlayerRouteParams } from './-player-phase'
import type { PlayerPhaseRouteTo } from './-player-phase'
import { PlayerStateLoadingScreen, PlayerStateNotFoundScreen } from '~/components/gameplay/player-route-shells'
import { PageShell } from '~/components/lobby/page-shell'
import { Card, CardContent } from '~/components/ui/card'
import { usePlayerRoundState } from '~/lib/use-player-round-state'

const ROUTE_TO: PlayerPhaseRouteTo = '/game/$gameId/player/$playerId/intermission'

export const Route = createFileRoute('/game/$gameId/player/$playerId/intermission')({
  component: PlayerIntermissionPhaseRoute,
})

function PlayerIntermissionPhaseRoute() {
  const { gameId, playerId } = Route.useParams()
  const playerState = usePlayerRoundState(gameId, playerId)

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

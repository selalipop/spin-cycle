import { Navigate, createFileRoute } from '@tanstack/react-router'
import { getPlayerPhaseRouteTo, getPlayerRouteParams } from './-player-phase'
import type { PlayerPhaseRouteTo } from './-player-phase'
import { PhaseHoldingScreen } from '~/components/gameplay/phase-holding-screen'
import { PlayerStateLoadingScreen, PlayerStateNotFoundScreen } from '~/components/gameplay/player-route-shells'
import { PageShell } from '~/components/lobby/page-shell'
import { usePlayerRoundState } from '~/lib/use-player-round-state'

const ROUTE_TO: PlayerPhaseRouteTo = '/game/$gameId/player/$playerId/round-processing'

export const Route = createFileRoute('/game/$gameId/player/$playerId/round-processing')({
  component: PlayerRoundProcessingPhaseRoute,
})

function PlayerRoundProcessingPhaseRoute() {
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

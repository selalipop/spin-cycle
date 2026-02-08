import { Navigate, createFileRoute } from '@tanstack/react-router'
import { getPlayerPhaseRouteTo, getPlayerRouteParams } from './-player-phase'
import type { PlayerPhaseRouteTo } from './-player-phase'
import { PhaseHoldingScreen } from '~/components/gameplay/phase-holding-screen'
import { PlayerStateLoadingScreen, PlayerStateNotFoundScreen } from '~/components/gameplay/player-route-shells'
import { PageShell } from '~/components/lobby/page-shell'
import { usePlayerRoundState } from '~/lib/use-player-round-state'

const ROUTE_TO: PlayerPhaseRouteTo = '/game/$gameId/player/$playerId/round-loading'

export const Route = createFileRoute('/game/$gameId/player/$playerId/round-loading')({
  component: PlayerRoundLoadingPhaseRoute,
})

function PlayerRoundLoadingPhaseRoute() {
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
      subtitle="Your faction briefing is almost ready."
      title="Briefings Incoming"
    >
      <PhaseHoldingScreen
        description="Keep this page open. Your move menu unlocks automatically once briefings are complete."
        label="Briefings Incoming"
        title="Setting Up Your Round"
      />
    </PageShell>
  )
}

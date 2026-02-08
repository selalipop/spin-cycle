import { Navigate, createFileRoute } from '@tanstack/react-router'
import { getPlayerPhaseRouteTo, getPlayerRouteParams } from './-player-phase'
import type { PlayerPhaseRouteTo } from './-player-phase'
import { PlayerStateLoadingScreen, PlayerStateNotFoundScreen } from '~/components/gameplay/player-route-shells'
import { PlayerEstablishingPlaceholder } from '~/components/lobby/player-establishing-placeholder'
import { PageShell } from '~/components/lobby/page-shell'
import { usePlayerRoundState } from '~/lib/use-player-round-state'

const ROUTE_TO: PlayerPhaseRouteTo = '/game/$gameId/player/$playerId/introduction'

export const Route = createFileRoute('/game/$gameId/player/$playerId/introduction')({
  component: PlayerIntroductionPhaseRoute,
})

function PlayerIntroductionPhaseRoute() {
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
      subtitle="The host is running the opening scene on the main display."
      title="Opening Scene"
    >
      <PlayerEstablishingPlaceholder factionName={playerState.player.faction.name} />
    </PageShell>
  )
}

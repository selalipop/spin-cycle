import { Navigate, createFileRoute } from '@tanstack/react-router'
import { getPlayerPhaseRouteTo, getPlayerRouteParams } from './-player-phase'
import { PlayerStateLoadingScreen, PlayerStateNotFoundScreen } from '~/components/gameplay/player-route-shells'
import { usePlayerRoundState } from '~/lib/use-player-round-state'

export const Route = createFileRoute('/game/$gameId/player/$playerId/')({
  component: PlayerPhaseRedirectRoute,
})

function PlayerPhaseRedirectRoute() {
  const { gameId, playerId } = Route.useParams()
  const playerState = usePlayerRoundState(gameId, playerId)

  if (playerState === undefined) {
    return <PlayerStateLoadingScreen />
  }

  if (playerState === null) {
    return <PlayerStateNotFoundScreen />
  }

  return (
    <Navigate
      params={getPlayerRouteParams(playerState)}
      replace
      to={getPlayerPhaseRouteTo(playerState.phase)}
    />
  )
}

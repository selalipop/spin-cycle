export type PlayerPhaseRouteTo =
  | '/game/$gameId/player/$playerId/introduction'
  | '/game/$gameId/player/$playerId/round-loading'
  | '/game/$gameId/player/$playerId/round-voting'
  | '/game/$gameId/player/$playerId/round-processing'
  | '/game/$gameId/player/$playerId/round-results'
  | '/game/$gameId/player/$playerId/intermission'

const PHASE_TO_ROUTE: Record<string, PlayerPhaseRouteTo> = {
  game_introduction: '/game/$gameId/player/$playerId/introduction',
  round_loading: '/game/$gameId/player/$playerId/round-loading',
  round_voting: '/game/$gameId/player/$playerId/round-voting',
  round_processing: '/game/$gameId/player/$playerId/round-processing',
  round_results: '/game/$gameId/player/$playerId/round-results',
  game_lobby: '/game/$gameId/player/$playerId/intermission',
  game_ending: '/game/$gameId/player/$playerId/intermission',
  game_results: '/game/$gameId/player/$playerId/intermission',
}

const DEFAULT_ROUTE: PlayerPhaseRouteTo = '/game/$gameId/player/$playerId/intermission'

export function getPlayerPhaseRouteTo(phase: string): PlayerPhaseRouteTo {
  return PHASE_TO_ROUTE[phase] ?? DEFAULT_ROUTE
}

export function getPlayerRouteParams(playerState: { gameId: string; player: { id: string } }) {
  return {
    gameId: playerState.gameId,
    playerId: playerState.player.id,
  }
}

import { useEffect } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { savePlayerRoute } from '~/lib/session'

export function usePlayerRoundState(gameId: string, playerId: string) {
  const playerState = useQuery(api.gameplay.getPlayerRoundState, { gameId, playerId })

  useEffect(() => {
    if (!playerState) {
      return
    }

    savePlayerRoute(playerState.gameId, playerState.player.id)
  }, [playerState])

  return playerState
}

const SESSION_ID_KEY = 'newsroom_session_id'
const PLAYER_ROUTE_KEY_PREFIX = 'newsroom_player_route'

export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    return ''
  }

  const existing = window.localStorage.getItem(SESSION_ID_KEY)
  if (existing) {
    return existing
  }

  const created = createRandomId()
  window.localStorage.setItem(SESSION_ID_KEY, created)
  return created
}

export function savePlayerRoute(gameId: string, playerId: string): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(`${PLAYER_ROUTE_KEY_PREFIX}:${gameId}`, playerId)
}

export function getSavedPlayerId(gameId: string): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage.getItem(`${PLAYER_ROUTE_KEY_PREFIX}:${gameId}`)
}

function createRandomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

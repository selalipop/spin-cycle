import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/game/$gameId/player/$playerId')({
  component: PlayerRouteLayout,
})

function PlayerRouteLayout() {
  return (
    <Outlet />
  )
}

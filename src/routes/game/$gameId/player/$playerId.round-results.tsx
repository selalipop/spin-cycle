import { Navigate, createFileRoute } from '@tanstack/react-router'
import { getPlayerPhaseRouteTo, getPlayerRouteParams } from './-player-phase'
import type { PlayerPhaseRouteTo } from './-player-phase'
import { PlayerStateLoadingScreen, PlayerStateNotFoundScreen } from '~/components/gameplay/player-route-shells'
import { PageShell } from '~/components/lobby/page-shell'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { usePlayerRoundState } from '~/lib/use-player-round-state'

const ROUTE_TO: PlayerPhaseRouteTo = '/game/$gameId/player/$playerId/round-results'

export const Route = createFileRoute('/game/$gameId/player/$playerId/round-results')({
  component: PlayerRoundResultsPhaseRoute,
})

function PlayerRoundResultsPhaseRoute() {
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

  const submission = playerState.submittedAction

  return (
    <PageShell
      eyebrow={playerState.player.faction.name}
      title={`Round ${playerState.roundNumber ?? 1}: Your Result`}
    >
      <Card className="neo-panel gap-4 py-4">
        <CardHeader className="gap-3 pb-0">
          <CardTitle className="font-display text-3xl text-black">{playerState.player.faction.name} scored.</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 pb-2">
          {submission ? (
            <>
              <div className="neo-panel-soft p-4">
                <p className="neo-label text-black/78">Action</p>
                <p className="mt-2 font-heading text-lg text-black">{submission.actionName}</p>
              </div>

              <div className="neo-panel-soft p-4">
                <p className="neo-label text-black/78">Submitted Content</p>
                <p className="mt-2 text-base text-black/92">{submission.content}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge className="rounded-full border border-black bg-white px-3 py-1 text-base text-black">
                  Quality: <span className="font-bold">{submission.effectiveness ?? 0}</span>
                </Badge>
                <Badge className="rounded-full border border-black bg-amber-300 px-3 py-1 text-base text-black">
                  Impact: <span className="font-bold">{submission.impact ?? 0}</span>
                </Badge>
              </div>

              <div className="space-y-2">
                <p className="neo-label text-black/78">Grading Rubric</p>
                {submission.gradingRubric && Object.keys(submission.gradingRubric).length > 0 ? (
                  Object.entries(submission.gradingRubric).map(([criterion, score]) => (
                    <div
                      className="neo-panel-soft flex items-center justify-between px-3 py-2"
                      key={`${submission.id}:${criterion}`}
                    >
                      <p className="text-base text-black/90">{criterion}</p>
                      <p className="font-mono text-sm text-black">{score}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-base text-black/82">No rubric scores available.</p>
                )}
              </div>

              <CreditGrantSection grant={playerState.creditGrant} />
            </>
          ) : (
            <>
              <p className="text-base text-black/90">No submission was recorded for your faction this round.</p>
              <CreditGrantSection grant={playerState.creditGrant} />
            </>
          )}
        </CardContent>
      </Card>
    </PageShell>
  )
}

function CreditGrantSection({ grant }: { grant?: { base: number; placement: number; placementLabel?: string; total: number } }) {
  if (!grant) return null

  return (
    <div className="neo-panel-soft p-4">
      <p className="neo-label text-black/78">Credits Earned</p>
      <div className="mt-2 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-base text-black/90">Base</span>
          <span className="font-mono text-sm text-black">+{grant.base}</span>
        </div>
        {grant.placement > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-base text-black/90">{grant.placementLabel} Place</span>
            <span className="font-mono text-sm text-black">+{grant.placement}</span>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-black/10 pt-1">
          <span className="text-base font-bold text-black">Total</span>
          <span className="font-mono text-sm font-bold text-black">+{grant.total}</span>
        </div>
      </div>
    </div>
  )
}

import { Navigate, createFileRoute } from '@tanstack/react-router'
import { getPlayerPhaseRouteTo, getPlayerRouteParams } from './-player-phase'
import type { PlayerPhaseRouteTo } from './-player-phase'
import { PlayerStateLoadingScreen, PlayerStateNotFoundScreen } from '~/components/gameplay/player-route-shells'
import { PageShell } from '~/components/lobby/page-shell'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
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
      subtitle="Round scoring is complete. Here is your faction result."
      title={`Round ${playerState.roundNumber ?? 1}: Your Result`}
    >
      <Card className="neo-panel gap-4 py-4">
        <CardHeader className="gap-3 pb-0">
          <CardTitle className="font-display text-3xl text-black">Faction Outcome</CardTitle>
          <CardDescription className="text-black/90">
            Submission scoring for {playerState.player.faction.name}.
          </CardDescription>
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
                <p className="mt-2 text-sm text-black/92">{submission.content}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge className="rounded-full border border-black bg-white px-3 py-1 text-[0.66rem] text-black">
                  Effectiveness: {submission.effectiveness ?? 0}
                </Badge>
                <Badge className="rounded-full border border-black bg-amber-300 px-3 py-1 text-[0.66rem] text-black">
                  Impact: {submission.impact ?? 0}
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
                      <p className="text-sm text-black/90">{criterion}</p>
                      <p className="font-mono text-xs text-black">{score}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-black/82">No rubric scores available.</p>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-black/90">No submission was recorded for your faction this round.</p>
          )}
        </CardContent>
      </Card>
    </PageShell>
  )
}

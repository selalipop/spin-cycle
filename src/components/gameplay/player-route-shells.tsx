import { PageShell } from '~/components/lobby/page-shell'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Spinner } from '~/components/ui/spinner'

export function PlayerStateLoadingScreen() {
  return (
    <PageShell title="Loading Seat" subtitle="Connecting you to the current game.">
      <Card className="neo-panel py-0">
        <CardContent className="flex items-center gap-3 px-6 py-6">
          <Spinner className="size-5 text-black" />
          <p className="text-base text-black/90">Syncing your player state...</p>
        </CardContent>
      </Card>
    </PageShell>
  )
}

export function PlayerStateNotFoundScreen() {
  return (
    <PageShell title="Player Link Not Found" subtitle="This player URL is no longer valid.">
      <Card className="neo-panel py-0">
        <CardContent className="space-y-4 px-6 py-6">
          <p className="text-base text-black/90">Join again with the host code.</p>
          <Button
            className="h-10 border-2 border-black font-heading text-sm uppercase tracking-[0.08em]"
            onClick={() => window.location.assign('/')}
            type="button"
          >
            Back Home
          </Button>
        </CardContent>
      </Card>
    </PageShell>
  )
}

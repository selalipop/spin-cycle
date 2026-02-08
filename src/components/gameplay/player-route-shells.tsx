import { PageShell } from '~/components/lobby/page-shell'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { WashingMachineLoader } from '~/components/ui/washing-machine-loader'

export function PlayerStateLoadingScreen() {
  return (
    <PageShell title="Loading Seat" subtitle="Connecting you to the current game.">
      <Card className="neo-panel py-0">
        <CardContent className="flex flex-col items-center gap-4 px-6 py-10">
          <WashingMachineLoader />
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

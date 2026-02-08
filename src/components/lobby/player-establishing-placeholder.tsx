import { Badge } from '~/components/ui/badge'
import { Card, CardContent } from '~/components/ui/card'
import { WashingMachineLoader } from '~/components/ui/washing-machine-loader'

export function PlayerEstablishingPlaceholder({
  factionName,
}: {
  factionName: string
}) {
  return (
    <Card className="neo-panel neo-grid py-0">
      <CardContent className="flex min-h-[320px] flex-col items-center justify-center gap-4 px-6 py-10 text-center">
        <Badge className="rounded-full border border-black bg-amber-300 px-3 py-1 text-xs uppercase text-black">
          Round Introduction
        </Badge>
        <WashingMachineLoader />
        <p className="font-heading text-2xl text-black">Watch the big screen.</p>
        <p className="max-w-lg text-base text-black/90">
          {factionName} will get its mission once round one starts.
        </p>
      </CardContent>
    </Card>
  )
}

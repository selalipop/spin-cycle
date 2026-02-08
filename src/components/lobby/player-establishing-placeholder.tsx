import { Badge } from '~/components/ui/badge'
import { Card, CardContent } from '~/components/ui/card'
import { Spinner } from '~/components/ui/spinner'

export function PlayerEstablishingPlaceholder({
  factionName,
}: {
  factionName: string
}) {
  return (
    <Card className="neo-panel neo-grid py-0">
      <CardContent className="flex min-h-[320px] flex-col items-center justify-center gap-4 px-6 py-10 text-center">
        <Badge className="rounded-full border border-black bg-amber-300 px-3 py-1 text-[0.68rem] uppercase text-black">
          Opening Scene
        </Badge>
        <Spinner className="size-9 text-black" />
        <p className="font-heading text-2xl text-black">Story setup is on the big screen.</p>
        <p className="max-w-lg text-sm text-black/90">
          {factionName} joins as soon as the opening scene wraps and round one starts.
        </p>
      </CardContent>
    </Card>
  )
}

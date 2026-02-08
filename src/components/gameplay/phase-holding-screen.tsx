import { Badge } from '~/components/ui/badge'
import { Card, CardContent } from '~/components/ui/card'
import { Spinner } from '~/components/ui/spinner'

export function PhaseHoldingScreen({
  label,
  title,
  description,
}: {
  label: string
  title: string
  description: string
}) {
  return (
    <Card className="neo-panel neo-grid py-0">
      <CardContent className="flex min-h-[320px] flex-col items-center justify-center gap-4 px-6 py-10 text-center">
        <Badge className="rounded-full border border-black bg-white px-3 py-1 text-[0.68rem] uppercase text-black">
          {label}
        </Badge>
        <Spinner className="size-9 text-black" />
        <p className="font-heading text-2xl text-black">{title}</p>
        <p className="max-w-xl text-sm text-black/90 sm:text-base">{description}</p>
      </CardContent>
    </Card>
  )
}

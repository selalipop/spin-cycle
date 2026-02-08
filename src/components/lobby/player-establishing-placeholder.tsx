import { Card, Chip, Spinner } from '@heroui/react'

export function PlayerEstablishingPlaceholder({
  factionName,
}: {
  factionName: string
}) {
  return (
    <Card className="border border-zinc-700/70 bg-zinc-900/70">
      <Card.Content className="flex min-h-[320px] flex-col items-center justify-center gap-4 text-center">
        <Chip className="bg-amber-500/25 text-amber-200">Establishing Premise</Chip>
        <Spinner size="lg" />
        <p className="text-lg font-medium text-zinc-100">Main screen content is playing</p>
        <p className="max-w-md text-sm text-zinc-300">
          {factionName} will join round 1 as soon as the host finishes the establishing sequence.
        </p>
      </Card.Content>
    </Card>
  )
}

import { Card, Chip, Spinner } from '@heroui/react'

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
    <Card className="border border-zinc-700/70 bg-zinc-900/70">
      <Card.Content className="flex min-h-[320px] flex-col items-center justify-center gap-4 text-center">
        <Chip className="bg-zinc-700/70 text-zinc-100">{label}</Chip>
        <Spinner size="lg" />
        <p className="text-xl font-semibold text-zinc-100">{title}</p>
        <p className="max-w-xl text-sm text-zinc-300">{description}</p>
      </Card.Content>
    </Card>
  )
}

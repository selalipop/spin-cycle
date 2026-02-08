import { Button, Card } from '@heroui/react'

export function BriefingModal({
  isOpen,
  onClose,
  factionName,
  goal,
  briefing,
}: {
  isOpen: boolean
  onClose: () => void
  factionName: string
  goal: string
  briefing: string
}) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <Card className="max-h-[90vh] w-full max-w-2xl border border-zinc-700/80 bg-zinc-950">
        <Card.Header className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <Card.Title className="text-xl">{factionName} Briefing</Card.Title>
            <Card.Description className="text-zinc-300">Mission Goal: {goal}</Card.Description>
          </div>
          <Button onPress={onClose} size="sm" variant="ghost">
            Close
          </Button>
        </Card.Header>
        <Card.Content className="space-y-4 overflow-y-auto pb-6">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-100 sm:text-base">
            {briefing}
          </p>
        </Card.Content>
      </Card>
    </div>
  )
}

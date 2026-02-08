import { Button, Card, Chip } from '@heroui/react'

export type ActionOption = {
  id: string
  name: string
  cost: number
  prompt: string
  isSpecial: boolean
  isShared: boolean
  affordable: boolean
}

function ActionRow({
  action,
  disabled,
  onSelect,
}: {
  action: ActionOption
  disabled: boolean
  onSelect: (action: ActionOption) => void
}) {
  const isDisabled = disabled || !action.affordable

  return (
    <Button
      className="h-auto justify-start border border-zinc-700/80 bg-zinc-900/70 p-3 text-left"
      isDisabled={isDisabled}
      onPress={() => onSelect(action)}
      variant="ghost"
    >
      <div className="flex w-full items-start justify-between gap-3">
        <div className="space-y-1">
          <p className={`text-sm font-semibold ${isDisabled ? 'text-zinc-500' : 'text-zinc-100'}`}>
            {action.name}
          </p>
          <p className={`text-xs ${isDisabled ? 'text-zinc-600' : 'text-zinc-300'}`}>
            {action.prompt}
          </p>
        </div>
        <Chip
          className={isDisabled ? 'bg-zinc-800 text-zinc-500' : 'bg-zinc-700 text-zinc-100'}
          size="sm"
        >
          {action.cost}c
        </Chip>
      </div>
    </Button>
  )
}

export function ActionMenu({
  sharedActions,
  factionActions,
  onSelectAction,
  locked,
}: {
  sharedActions: Array<ActionOption>
  factionActions: Array<ActionOption>
  onSelectAction: (action: ActionOption) => void
  locked: boolean
}) {
  return (
    <Card className="border border-zinc-700/70 bg-zinc-950/70">
      <Card.Header>
        <Card.Title>Choose an Action</Card.Title>
        <Card.Description>
          Shared options first, then your faction exclusives.
        </Card.Description>
      </Card.Header>
      <Card.Content className="space-y-4 pb-6">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">Shared Actions</p>
          {sharedActions.map((action) => (
            <ActionRow action={action} disabled={locked} key={action.id} onSelect={onSelectAction} />
          ))}
        </div>

        <div className="h-px w-full bg-zinc-700/70" />

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">Faction Actions</p>
          {factionActions.map((action) => (
            <ActionRow action={action} disabled={locked} key={action.id} onSelect={onSelectAction} />
          ))}
        </div>
      </Card.Content>
    </Card>
  )
}

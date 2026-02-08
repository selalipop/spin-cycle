import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { cn } from '~/lib/utils'

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
  const statusLabel = disabled
    ? 'Your team already locked a move this round.'
    : !action.affordable
      ? 'Not enough credits for this move.'
      : action.isSpecial
        ? 'Special move'
        : 'Ready'

  return (
    <button
      className={cn(
        'neo-pressable neo-panel-soft flex w-full items-start justify-between gap-4 p-4 text-left',
        isDisabled ? 'cursor-not-allowed opacity-65' : 'hover:bg-amber-100',
      )}
      disabled={isDisabled}
      onClick={() => onSelect(action)}
      type="button"
    >
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-heading text-sm leading-tight text-black sm:text-base">{action.name}</p>
          <Badge className="rounded-full border border-black bg-white px-2 py-0.5 text-[0.62rem] uppercase text-black">
            {action.isShared ? 'Shared' : 'Faction'}
          </Badge>
        </div>
        <p className="text-sm text-black/90">{action.prompt}</p>
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.08em] text-black/78">{statusLabel}</p>
      </div>

      <Badge
        className={cn(
          'shrink-0 rounded-full border border-black px-2 py-1 text-[0.66rem] uppercase',
          isDisabled ? 'bg-black/10 text-black/78' : 'bg-primary text-primary-foreground',
        )}
      >
        {action.cost} credits
      </Badge>
    </button>
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
    <Card className="neo-panel gap-5 py-4">
      <CardHeader className="gap-3 pb-0">
        <CardTitle className="font-display text-2xl text-black sm:text-3xl">Pick a Move</CardTitle>
        <CardDescription className="text-black/90">
          Shared moves are available to everyone. Faction moves are your team exclusives.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 pb-2">
        <div className="space-y-3">
          <p className="neo-label text-black/82">Shared Moves</p>
          {sharedActions.map((action) => (
            <ActionRow action={action} disabled={locked} key={action.id} onSelect={onSelectAction} />
          ))}
        </div>

        <div className="h-[2px] w-full bg-black/20" />

        <div className="space-y-3">
          <p className="neo-label text-black/82">Faction Moves</p>
          {factionActions.map((action) => (
            <ActionRow action={action} disabled={locked} key={action.id} onSelect={onSelectAction} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

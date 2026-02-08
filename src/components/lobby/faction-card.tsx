import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { getFactionTheme } from '~/lib/factions'
import { cn } from '~/lib/utils'

export function FactionCard({
  code,
  name,
  description,
  playerCount,
  selected,
  onSelect,
  actionLabel,
  disabled,
  className,
}: {
  code: string
  name: string
  description: string
  playerCount: number
  selected?: boolean
  onSelect?: () => void
  actionLabel?: string
  disabled?: boolean
  className?: string
}) {
  const theme = getFactionTheme(code)

  return (
    <Card
      className={cn(
        'neo-panel neo-pressable h-full min-w-0 gap-4 overflow-hidden py-4',
        theme.softClass,
        theme.borderClass,
        selected
          ? '-translate-x-[2px] -translate-y-[2px] ring-2 ring-black/80'
          : 'translate-x-0 translate-y-0',
        className,
      )}
    >
      <CardHeader className={cn('gap-2 pb-0', onSelect ? 'flex-1' : null)}>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className={cn('font-heading text-lg leading-[1.08]', theme.accentTextClass)}>
            {name}
          </CardTitle>
          <Badge className={cn('rounded-full px-3 py-1 text-xs uppercase', theme.chipClass)}>
            {playerCount} on team
          </Badge>
        </div>
        <p className="text-base leading-[1.35] text-black/90 [text-wrap:pretty]">
          {description}
        </p>
      </CardHeader>

      {onSelect ? (
        <CardFooter className="pt-0">
          <Button
            className="h-11 w-full border-2 border-black font-heading text-sm uppercase tracking-[0.06em]"
            disabled={disabled}
            onClick={onSelect}
            variant={selected ? 'default' : 'secondary'}
          >
            {actionLabel ?? (selected ? 'Chosen' : 'Choose Team')}
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  )
}

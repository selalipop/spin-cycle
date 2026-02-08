import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
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
}: {
  code: string
  name: string
  description: string
  playerCount: number
  selected?: boolean
  onSelect?: () => void
  actionLabel?: string
}) {
  const theme = getFactionTheme(code)

  return (
    <Card
      className={cn(
        'neo-panel neo-pressable gap-4 overflow-hidden py-4',
        theme.softClass,
        theme.borderClass,
        selected
          ? '-translate-x-[2px] -translate-y-[2px] ring-2 ring-black/80'
          : 'translate-x-0 translate-y-0',
      )}
    >
      <CardHeader className="gap-3 pb-0">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className={cn('font-heading text-lg leading-tight', theme.accentTextClass)}>
            {name}
          </CardTitle>
          <Badge className={cn('rounded-full px-3 py-1 text-[0.68rem] uppercase', theme.chipClass)}>
            {playerCount} on team
          </Badge>
        </div>
        <CardDescription className="text-sm text-black/75">{description}</CardDescription>
      </CardHeader>

      <CardContent className="pb-0">
        <p className="neo-label text-black/65">Faction pick shapes your goals each round.</p>
      </CardContent>

      {onSelect ? (
        <CardFooter className="pt-0">
          <Button
            className="h-11 w-full border-2 border-black font-heading text-[0.86rem] uppercase tracking-[0.06em]"
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

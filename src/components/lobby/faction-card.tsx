import { Button, Card, Chip } from '@heroui/react'
import { getFactionTheme } from '~/lib/factions'

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
      className={`border ${theme.borderClass} ${theme.softClass} ${
        selected ? 'ring-2 ring-white/65' : ''
      }`}
     
    >
      <Card.Header className="flex items-center justify-between gap-3">
        <Card.Title className={`text-base ${theme.accentTextClass}`}>{name}</Card.Title>
        <Chip className={theme.chipClass} size="sm">
          {playerCount} player{playerCount === 1 ? '' : 's'}
        </Chip>
      </Card.Header>
      <Card.Content>
        <p className="text-sm text-zinc-200">{description}</p>
      </Card.Content>
      {onSelect ? (
        <Card.Footer>
          <Button
            className="w-full"
            onPress={onSelect}
            variant={selected ? 'primary' : 'ghost'}
          >
            {actionLabel ?? (selected ? 'Selected' : 'Select')}
          </Button>
        </Card.Footer>
      ) : null}
    </Card>
  )
}

import { Avatar, Card, Chip } from '@heroui/react'

export function PlayerListItem({
  name,
  avatar,
  isCurrent,
}: {
  name: string
  avatar: string
  isCurrent?: boolean
}) {
  return (
    <Card className="border border-zinc-700/70 bg-zinc-900/70">
      <Card.Content className="flex items-center justify-between gap-3 py-3">
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            <Avatar.Fallback>{avatar}</Avatar.Fallback>
          </Avatar>
          <span className="font-medium text-zinc-100">{name}</span>
        </div>
        {isCurrent ? (
          <Chip className="bg-white/20 text-zinc-100" size="sm">
            You
          </Chip>
        ) : null}
      </Card.Content>
    </Card>
  )
}

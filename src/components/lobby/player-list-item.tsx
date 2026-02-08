import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent } from '~/components/ui/card'

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
    <Card className="neo-panel gap-0 py-0">
      <CardContent className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="size-11 border-2 border-black bg-muted" size="lg">
            <AvatarImage alt={`${name} avatar`} className="object-cover" src={avatar} />
            <AvatarFallback className="font-mono text-xs">{name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="font-semibold text-black">{name}</span>
        </div>

        {isCurrent ? (
          <Badge className="rounded-full border border-black bg-secondary px-2 py-1 text-[0.65rem] uppercase text-secondary-foreground">
            You
          </Badge>
        ) : null}
      </CardContent>
    </Card>
  )
}

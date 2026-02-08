import { Badge } from '~/components/ui/badge'
import { ScrollArea, ScrollBar } from '~/components/ui/scroll-area'
import { AVATAR_PATHS } from '~/lib/avatars'
import { cn } from '~/lib/utils'

export function AvatarPicker({
  value,
  onChange,
}: {
  value: string | null
  onChange: (avatar: string) => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="neo-label text-black/92">Choose Your Avatar</p>
        <Badge className="rounded-full border border-black bg-white px-2 py-1 text-xs text-black">
          {value ? (
            <img
              alt="Selected avatar preview"
              className="mr-2 size-6 rounded-md border border-black object-cover"
              src={value}
            />
          ) : null}
          {value ? 'Selected' : 'Not Selected'}
        </Badge>
      </div>

      <ScrollArea className="neo-panel-soft w-full overflow-hidden">
        <div className="grid h-[220px] grid-flow-col grid-rows-2 gap-3 p-4">
          {AVATAR_PATHS.map((avatar, index) => {
            const isSelected = avatar === value

            return (
              <button
                className={cn(
                  'neo-pressable flex h-[88px] w-[88px] flex-col items-center justify-center gap-1 rounded-xl border-2 border-black bg-white p-2',
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-[4px_4px_0_0_rgba(0,0,0,0.92)]'
                    : 'text-black hover:bg-amber-100',
                )}
                key={avatar}
                onClick={() => onChange(avatar)}
                type="button"
              >
                <img
                  alt={`Avatar ${index + 1}`}
                  className="size-12 rounded-lg border border-black object-cover"
                  src={avatar}
                />
                <span className="font-mono text-[0.64rem] uppercase tracking-[0.08em]">
                  #{index + 1}
                </span>
              </button>
            )
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}

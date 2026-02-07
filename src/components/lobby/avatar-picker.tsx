import { Button, Chip } from '@heroui/react'

const AVATARS = ['🗞️', '🎙️', '📡', '🧠', '📣', '🛰️', '⚖️', '🕵️']

export function AvatarPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (avatar: string) => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <p className="text-sm text-zinc-300">Avatar</p>
        <Chip className="bg-zinc-700/70 text-zinc-100" size="sm">
          {value}
        </Chip>
      </div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
        {AVATARS.map((avatar) => {
          const isSelected = avatar === value
          return (
            <Button
              className={`h-11 text-lg ${isSelected ? 'ring-2 ring-white/70' : ''}`}
              key={avatar}
              onPress={() => onChange(avatar)}
              variant={isSelected ? 'primary' : 'ghost'}
            >
              {avatar}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

import { useRef, type ChangeEvent } from 'react'
import { X } from 'lucide-react'
import { Badge } from '~/components/ui/badge'
import { ScrollArea, ScrollBar } from '~/components/ui/scroll-area'
import { AVATAR_PATHS } from '~/lib/avatars'
import { cn } from '~/lib/utils'

export function AvatarPicker({
  value,
  onChange,
  onUploadFromDevice,
  isUploadingFromDevice,
}: {
  value: string | null
  onChange: (avatar: string | null) => void
  onUploadFromDevice: (file: File) => Promise<void>
  isUploadingFromDevice: boolean
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isCustomAvatarSelected = value !== null && !AVATAR_PATHS.includes(value)

  const handleFileSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.currentTarget.files?.[0]
    if (!selectedFile) {
      return
    }

    void onUploadFromDevice(selectedFile)
    event.currentTarget.value = ''
  }

  const handleUploadTileClick = () => {
    if (isCustomAvatarSelected) {
      onChange(null)
      return
    }

    if (isUploadingFromDevice) {
      return
    }

    fileInputRef.current?.click()
  }

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
          <button
            className={cn(
              'neo-pressable relative flex h-[88px] w-[88px] flex-col items-center justify-center gap-1 rounded-xl border-2 border-black p-2',
              isCustomAvatarSelected
                ? 'bg-primary text-primary-foreground shadow-[4px_4px_0_0_rgba(0,0,0,0.92)]'
                : 'bg-white text-black hover:bg-amber-100',
              isUploadingFromDevice ? 'pointer-events-none opacity-65' : '',
            )}
            onClick={handleUploadTileClick}
            type="button"
          >
            {isCustomAvatarSelected && value ? (
              <>
                <img
                  alt="Uploaded avatar"
                  className="size-12 rounded-lg border border-black object-cover"
                  src={value}
                />
                <span className="font-mono text-[0.64rem] uppercase tracking-[0.08em]">
                  Custom
                </span>
                <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full border border-black bg-red-600 font-mono text-xs text-white">
                  <X aria-hidden className="size-3" />
                </span>
              </>
            ) : (
              <>
                <span className="flex size-12 items-center justify-center rounded-lg border border-dashed border-black text-xl leading-none">
                  +
                </span>
                <span className="font-mono text-[0.64rem] uppercase tracking-[0.08em]">
                  {isUploadingFromDevice ? 'Uploading' : 'Upload'}
                </span>
              </>
            )}
          </button>

          {AVATAR_PATHS.map((avatar, index) => {
            const isSelected = avatar === value

            return (
              <button
                className={cn(
                  'neo-pressable relative flex h-[88px] w-[88px] flex-col items-center justify-center gap-1 rounded-xl border-2 border-black bg-white p-2',
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-[4px_4px_0_0_rgba(0,0,0,0.92)]'
                    : 'text-black hover:bg-amber-100',
                )}
                key={avatar}
                onClick={() => onChange(isSelected ? null : avatar)}
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
                {isSelected ? (
                  <span className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full border border-black bg-red-600 font-mono text-xs text-white">
                    <X aria-hidden className="size-3" />
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      <input
        accept="image/*"
        className="hidden"
        onChange={handleFileSelected}
        ref={fileInputRef}
        type="file"
      />
    </div>
  )
}

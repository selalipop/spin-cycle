import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'

export function BriefingModal({
  isOpen,
  onClose,
  factionName,
  goal,
  briefing,
}: {
  isOpen: boolean
  onClose: () => void
  factionName: string
  goal: string
  briefing: string
}) {
  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
      open={isOpen}
    >
      <DialogContent
        className="max-h-[92vh] overflow-hidden rounded-2xl border-2 border-black bg-[var(--card)] p-0 sm:max-w-2xl"
        showCloseButton={false}
      >
        <div className="neo-grid max-h-[92vh] overflow-y-auto p-6">
          <DialogHeader className="gap-3 text-left">
            <DialogTitle className="font-display text-3xl text-black">{factionName} Brief</DialogTitle>
            <DialogDescription className="rounded-xl border-2 border-black bg-white p-3 text-sm text-black/88">
              <span className="neo-label mr-2 text-black/78">Goal</span>
              {goal}
            </DialogDescription>
          </DialogHeader>

          <p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-black sm:text-base">
            {briefing}
          </p>

          <div className="mt-6 flex justify-end">
            <DialogClose asChild>
              <Button
                className="h-10 border-2 border-black px-4 font-heading text-xs uppercase tracking-[0.08em]"
                type="button"
              >
                Back to Team
              </Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

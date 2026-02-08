import type { ChangeEvent } from 'react'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Textarea } from '~/components/ui/textarea'

export function SubmissionCompose({
  goal,
  actionName,
  actionPrompt,
  content,
  onContentChange,
  onBack,
  onSubmit,
  canSubmit,
  isSubmitting,
}: {
  goal: string
  actionName: string
  actionPrompt: string
  content: string
  onContentChange: (next: string) => void
  onBack: () => void
  onSubmit: () => void
  canSubmit: boolean
  isSubmitting: boolean
}) {
  return (
    <Card className="neo-panel gap-5 py-4">
      <CardHeader className="gap-3 pb-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <Badge className="w-fit rounded-full border border-black bg-amber-300 px-3 py-1 text-[0.66rem] uppercase text-black">
              Draft Your Move
            </Badge>
            <CardTitle className="font-heading text-2xl text-black">{actionName}</CardTitle>
            <CardDescription className="text-black/75">{actionPrompt}</CardDescription>
          </div>

          <Button
            className="h-9 border-2 border-black bg-white font-heading text-xs uppercase tracking-[0.08em] text-black hover:bg-amber-100"
            onClick={onBack}
            type="button"
            variant="secondary"
          >
            Back
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pb-2">
        <div className="neo-panel-soft p-4">
          <p className="neo-label text-black/60">Current Goal</p>
          <p className="mt-2 text-sm text-black/85 sm:text-base">{goal}</p>
        </div>

        <Textarea
          className="min-h-44 resize-y border-2 border-black bg-white text-base text-black placeholder:text-black/50"
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onContentChange(event.currentTarget.value)}
          placeholder="Write the exact post, statement, leak, or story beat your team wants to publish."
          value={content}
        />

        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.08em] text-black/60">
            {content.trim().length} characters drafted
          </p>
          <Button
            className="h-11 border-2 border-black px-5 font-heading text-xs uppercase tracking-[0.08em]"
            disabled={!canSubmit || isSubmitting}
            onClick={onSubmit}
            type="button"
          >
            {isSubmitting ? 'Sending...' : 'Lock This Move'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

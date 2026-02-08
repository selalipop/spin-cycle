import type { ChangeEvent } from 'react'
import { Button, Card, TextArea } from '@heroui/react'

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
    <Card className="border border-zinc-700/70 bg-zinc-950/70">
      <Card.Header className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <Card.Title>{actionName}</Card.Title>
          <Card.Description>{actionPrompt}</Card.Description>
        </div>
        <Button onPress={onBack} size="sm" variant="ghost">
          Back
        </Button>
      </Card.Header>
      <Card.Content className="space-y-4 pb-6">
        <div className="rounded-xl border border-zinc-700/70 bg-zinc-900/70 p-3">
          <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">Goal</p>
          <p className="mt-2 text-sm text-zinc-100">{goal}</p>
        </div>

        <TextArea
          className="w-full"
          rows={8}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
            onContentChange(event.currentTarget.value)
          }
          placeholder="Write your faction's content here..."
          value={content}
        />

        <Button className="w-full" isDisabled={!canSubmit || isSubmitting} onPress={onSubmit}>
          {isSubmitting ? 'Submitting...' : 'Submit for Faction'}
        </Button>
      </Card.Content>
    </Card>
  )
}

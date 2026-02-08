import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useAction, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { PageShell } from '~/components/lobby/page-shell'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { NativeSelect, NativeSelectOption } from '~/components/ui/native-select'
import { WashingMachineLoader } from '~/components/ui/washing-machine-loader'
import { Textarea } from '~/components/ui/textarea'

export const Route = createFileRoute('/debug/faction-generation')({
  component: FactionGenerationDebugPage,
})

type DebugGenerationResult = {
  scenarioId: string
  scenarioTitle: string
  event: string
  factionCode: string
  factionName: string
  model: string
  goal: string
  briefing: string
}

function FactionGenerationDebugPage() {
  const settings = useQuery(api.gameplay.getFactionGenerationDebugSettings)
  const generateBrief = useAction(api.gameplay.generateFactionBriefDebug)

  const [scenarioId, setScenarioId] = useState('')
  const [factionCode, setFactionCode] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<DebugGenerationResult | null>(null)

  useEffect(() => {
    if (!settings) {
      return
    }

    const defaultScenarioId = settings.scenarios[0]?.id
    const defaultFactionCode = settings.factions[0]?.code

    if (!scenarioId && defaultScenarioId) {
      setScenarioId(defaultScenarioId)
    }

    if (!factionCode && defaultFactionCode) {
      setFactionCode(defaultFactionCode)
    }
  }, [factionCode, scenarioId, settings])

  const selectedScenario = useMemo(
    () => settings?.scenarios.find((scenario) => scenario.id === scenarioId) ?? null,
    [scenarioId, settings],
  )

  const selectedFaction = useMemo(
    () => settings?.factions.find((faction) => faction.code === factionCode) ?? null,
    [factionCode, settings],
  )

  const handleGenerate = async () => {
    if (!selectedScenario || !selectedFaction || isGenerating) {
      return
    }

    setError(null)
    setIsGenerating(true)

    try {
      const generated = await generateBrief({
        scenarioId: selectedScenario.id,
        factionCode: selectedFaction.code,
      })
      setResult(generated)
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Brief generation failed'
      setError(message)
    } finally {
      setIsGenerating(false)
    }
  }

  if (settings === undefined) {
    return (
      <PageShell title="Faction Generator Debug" subtitle="Loading settings.">
        <Card className="neo-panel py-0">
          <CardContent className="flex flex-col items-center gap-4 px-6 py-10">
            <WashingMachineLoader />
            <p className="text-sm text-black/90">Loading scenarios and factions...</p>
          </CardContent>
        </Card>
      </PageShell>
    )
  }

  return (
    <PageShell
      eyebrow="Debug"
      title="Faction Generation"
      subtitle="Pick a scenario and faction, then generate one briefing payload."
    >
      <section className="grid gap-4 xl:grid-cols-[minmax(0,360px)_1fr]">
        <Card className="neo-panel neo-grid gap-4 py-4">
          <CardHeader className="gap-3 pb-0">
            <CardTitle className="font-display text-3xl text-black">Settings</CardTitle>
            <CardDescription className="text-black/90">
              Choose which scenario and faction to run through the briefing generator.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pb-2">
            <div className="space-y-2">
              <p className="neo-label text-black/80">Scenario</p>
              <NativeSelect
                className="w-full border-2 border-black bg-white text-black"
                onChange={(event) => {
                  setScenarioId(event.currentTarget.value)
                }}
                value={scenarioId}
              >
                {settings.scenarios.map((scenario) => (
                  <NativeSelectOption key={scenario.id} value={scenario.id}>
                    {scenario.title}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>

            <div className="space-y-2">
              <p className="neo-label text-black/80">Faction</p>
              <NativeSelect
                className="w-full border-2 border-black bg-white text-black"
                onChange={(event) => {
                  setFactionCode(event.currentTarget.value)
                }}
                value={factionCode}
              >
                {settings.factions.map((faction) => (
                  <NativeSelectOption key={faction.code} value={faction.code}>
                    {faction.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>

            {selectedScenario ? (
              <div className="rounded-xl border-2 border-black bg-white px-3 py-3">
                <p className="neo-label mb-2 text-black/80">Scenario Event</p>
                <p className="text-sm leading-6 text-black/90">{selectedScenario.event}</p>
              </div>
            ) : null}

            {selectedFaction ? (
              <div className="rounded-xl border-2 border-black bg-white px-3 py-3">
                <p className="neo-label mb-2 text-black/80">Faction Description</p>
                <p className="text-sm leading-6 text-black/90">{selectedFaction.description}</p>
              </div>
            ) : null}

            <Button
              className="h-11 w-full border-2 border-black font-heading text-xs uppercase tracking-[0.08em]"
              disabled={!selectedScenario || !selectedFaction || isGenerating}
              onClick={handleGenerate}
              type="button"
            >
              {isGenerating ? 'Generating...' : 'Generate Briefing'}
            </Button>

            {error ? (
              <Badge className="w-fit rounded-full border border-black bg-destructive px-3 py-1 text-[0.68rem] text-destructive-foreground">
                {error}
              </Badge>
            ) : null}
          </CardContent>
        </Card>

        <Card className="neo-panel gap-4 py-4">
          <CardHeader className="gap-3 pb-0">
            <CardTitle className="font-display text-3xl text-black">Result</CardTitle>
            <CardDescription className="text-black/90">
              Generated output for the selected scenario and faction.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pb-2">
            {result ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="rounded-full border border-black bg-amber-300 px-3 py-1 text-[0.68rem] text-black">
                    {result.scenarioTitle}
                  </Badge>
                  <Badge className="rounded-full border border-black bg-sky-300 px-3 py-1 text-[0.68rem] text-black">
                    {result.factionName}
                  </Badge>
                  <Badge className="rounded-full border border-black bg-white px-3 py-1 text-[0.68rem] text-black">
                    {result.model}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <p className="neo-label text-black/80">Goal</p>
                  <Textarea
                    className="min-h-20 border-2 border-black bg-white text-sm text-black"
                    readOnly
                    value={result.goal}
                  />
                </div>

                <div className="space-y-2">
                  <p className="neo-label text-black/80">Briefing</p>
                  <Textarea
                    className="min-h-56 border-2 border-black bg-white text-sm leading-6 text-black"
                    readOnly
                    value={result.briefing}
                  />
                </div>
              </>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-black/60 bg-white/80 px-4 py-6">
                <p className="text-sm text-black/80">
                  No generation yet. Choose settings and run the generator.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </PageShell>
  )
}

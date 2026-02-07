export type FactionTheme = {
  borderClass: string
  softClass: string
  accentTextClass: string
  chipClass: string
}

const DEFAULT_THEME: FactionTheme = {
  borderClass: 'border-zinc-700',
  softClass: 'bg-zinc-900/70',
  accentTextClass: 'text-zinc-200',
  chipClass: 'bg-zinc-700/60 text-zinc-100',
}

const THEMES: Record<string, FactionTheme> = {
  the_institute: {
    borderClass: 'border-sky-500/60',
    softClass: 'bg-sky-950/35',
    accentTextClass: 'text-sky-300',
    chipClass: 'bg-sky-500/25 text-sky-200',
  },
  crowdswell: {
    borderClass: 'border-amber-500/60',
    softClass: 'bg-amber-950/35',
    accentTextClass: 'text-amber-300',
    chipClass: 'bg-amber-500/25 text-amber-200',
  },
  pinnacle_media_group: {
    borderClass: 'border-rose-500/60',
    softClass: 'bg-rose-950/35',
    accentTextClass: 'text-rose-300',
    chipClass: 'bg-rose-500/25 text-rose-200',
  },
  foundation_for_public_good: {
    borderClass: 'border-emerald-500/60',
    softClass: 'bg-emerald-950/35',
    accentTextClass: 'text-emerald-300',
    chipClass: 'bg-emerald-500/25 text-emerald-200',
  },
}

export function getFactionTheme(code: string): FactionTheme {
  return THEMES[code] ?? DEFAULT_THEME
}

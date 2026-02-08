export type FactionTheme = {
  borderClass: string
  softClass: string
  accentTextClass: string
  chipClass: string
}

const DEFAULT_THEME: FactionTheme = {
  borderClass: 'border-black',
  softClass: 'bg-white',
  accentTextClass: 'text-black',
  chipClass: 'border border-black bg-secondary text-secondary-foreground',
}

const THEMES: Record<string, FactionTheme> = {
  the_institute: {
    borderClass: 'border-black',
    softClass: 'bg-sky-100',
    accentTextClass: 'text-sky-950',
    chipClass: 'border border-black bg-sky-300 text-sky-950',
  },
  crowdswell: {
    borderClass: 'border-black',
    softClass: 'bg-amber-100',
    accentTextClass: 'text-amber-950',
    chipClass: 'border border-black bg-amber-300 text-amber-950',
  },
  pinnacle_media_group: {
    borderClass: 'border-black',
    softClass: 'bg-rose-100',
    accentTextClass: 'text-rose-950',
    chipClass: 'border border-black bg-rose-300 text-rose-950',
  },
  foundation_for_public_good: {
    borderClass: 'border-black',
    softClass: 'bg-emerald-100',
    accentTextClass: 'text-emerald-950',
    chipClass: 'border border-black bg-emerald-300 text-emerald-950',
  },
}

export function getFactionTheme(code: string): FactionTheme {
  return THEMES[code] ?? DEFAULT_THEME
}

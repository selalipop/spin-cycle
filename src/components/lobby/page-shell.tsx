import type { ReactNode } from 'react'

export function PageShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_0%_0%,rgba(24,24,40,0.95),rgba(8,8,12,1)_55%),radial-gradient(circle_at_100%_100%,rgba(42,22,28,0.35),rgba(8,8,12,1)_60%)] px-4 py-8 text-zinc-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="space-y-2">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
          {subtitle ? <p className="text-zinc-300">{subtitle}</p> : null}
        </header>
        {children}
      </div>
    </main>
  )
}

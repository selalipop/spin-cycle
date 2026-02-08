import { Children } from 'react'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

const PAGE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

export function PageShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string
  title?: string
  subtitle?: string
  children: ReactNode
}) {
  const content = Children.toArray(children)
  const emptyHeader = !eyebrow && !title && !subtitle
  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_8%,rgba(255,176,90,0.28),transparent_30%),radial-gradient(circle_at_88%_12%,rgba(255,95,95,0.2),transparent_34%)]" />
      <div className="pointer-events-none absolute -top-16 -left-14 size-56 rounded-full border-4 border-black/90 bg-amber-200/70" />
      <div className="pointer-events-none absolute -right-24 top-36 size-72 rounded-full border-4 border-black/90 bg-rose-300/70" />

      <motion.div
        animate={{ opacity: 1 }}
        className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-6"
        initial={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {!emptyHeader && (
          <motion.header
            animate={{ opacity: 1, y: 0 }}
            className="neo-panel neo-grid neo-tilt-left space-y-3 p-6 text-center sm:p-8 sm:text-left"
            initial={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.26, ease: PAGE_EASE }}
          >
            {eyebrow ? (
              <p className="neo-label inline-flex w-fit rounded-full border border-black bg-white px-3 py-1 text-black/92">
                {eyebrow}
              </p>
            ) : null}

            {title && <h1 className="neo-display text-4xl leading-[1.06] text-black sm:text-5xl">{title}</h1>}
            {subtitle ? <p className="max-w-3xl text-base text-black/90 sm:text-lg">{subtitle}</p> : null}
          </motion.header>
        )}

        <div className="flex flex-col gap-5">
          {content.map((child, index) => (
            <section
              className="flex flex-col gap-5"
              key={index}
            >
              {child}
            </section>
          ))}
        </div>
      </motion.div>
    </main>
  )
}

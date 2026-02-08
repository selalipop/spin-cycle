import { motion, useReducedMotion } from 'framer-motion'

const RIBBON_PATH_TIMES = [0, 0.56, 0.78, 1]
const RIBBON_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

export function HomeTitleRibbon() {
  const reduceMotion = Boolean(useReducedMotion())

  return (
    <div className="relative h-[190px] overflow-hidden rounded-2xl border-2 border-black bg-[#2f4f5f] sm:h-[230px]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(170,215,204,0.18),rgba(40,58,74,0.2))]" />
      <div className="pointer-events-none absolute inset-x-8 top-5 h-16 bg-[repeating-linear-gradient(to_bottom,rgba(186,217,203,0.34)_0px,rgba(186,217,203,0.34)_4px,transparent_4px,transparent_10px)]" />

      <motion.div
        animate={
          reduceMotion
            ? { opacity: 1, x: 0, y: 0, rotate: -5.1 }
            : {
                opacity: [0, 1, 1, 1],
                x: [-1250, -300, -300, 0],
                y: [-52, -52, 34, 0],
                rotate: [-1, -1, -1.7, -5.1],
              }
        }
        className="absolute left-1/2 top-9 z-20 -translate-x-1/2"
        initial={reduceMotion ? { opacity: 1, x: 0, y: 0, rotate: -5.1 } : undefined}
        transition={
          reduceMotion
            ? undefined
            : {
                duration: 1.05,
                ease: RIBBON_EASE,
                times: RIBBON_PATH_TIMES,
              }
        }
      >
        <div className="w-[min(145vw,1220px)] min-w-[680px] rounded-[2px] border-2 border-black bg-gradient-to-r from-[#dd5640] via-[#e64a38] to-[#dc4431] px-7 py-4 shadow-[8px_8px_0_0_rgba(0,0,0,0.92)] sm:px-10 sm:py-5">
          <motion.p
            animate={
              reduceMotion
                ? { opacity: 1, scale: 1, y: 0 }
                : { opacity: 1, scale: 1, y: 0 }
            }
            className="neo-ribbon-type text-center text-4xl text-[var(--spin-paper)] sm:text-6xl"
            initial={reduceMotion ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.86, y: 18 }}
            transition={
              reduceMotion
                ? undefined
                : {
                    type: 'spring',
                    stiffness: 310,
                    damping: 22,
                    mass: 0.85,
                    delay: 0.66,
                  }
            }
          >
            SPIN CYCLE
          </motion.p>
        </div>
      </motion.div>

      <motion.div
        animate={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
        className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-[2px] border-2 border-black bg-black px-5 py-1 sm:px-8 sm:py-2"
        initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 26 }}
        transition={
          reduceMotion
            ? undefined
            : {
                type: 'spring',
                stiffness: 250,
                damping: 24,
                mass: 0.95,
                delay: 0.9,
              }
        }
      >
        <p className="text-xl font-medium text-[var(--spin-paper)] sm:text-3xl">Control the Story</p>
      </motion.div>
    </div>
  )
}

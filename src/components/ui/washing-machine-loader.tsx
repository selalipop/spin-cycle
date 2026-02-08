import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import { cn } from '~/lib/utils'

function WashingMachineLoader({ className }: { className?: string }) {
  return (
    <DotLottieReact
      src="/animation/washing_machine.lottie"
      loop
      autoplay
      className={cn('size-32', className)}
    />
  )
}

export { WashingMachineLoader }

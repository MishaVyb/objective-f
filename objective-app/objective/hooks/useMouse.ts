import { useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'

/**
 * Ref: https://github.com/radix-ui/primitives/discussions/1090
 */
export function useMouse<T extends HTMLElement = any>(
  doTrack = false,
  opts = { resetOnExit: false }
) {
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const ref = useRef<T>()

  const setMousePosition = (event: MouseEvent<HTMLElement>) => {
    if (ref.current) {
      const rect = event.currentTarget.getBoundingClientRect()

      const x = Math.max(
        0,
        Math.round(event.pageX - rect.left - (window.pageXOffset || window.scrollX))
      )

      const y = Math.max(
        0,
        Math.round(event.pageY - rect.top - (window.pageYOffset || window.scrollY))
      )

      setPosition({ x, y })
    } else {
      setPosition({ x: event.clientX, y: event.clientY })
    }
  }

  const resetMousePosition = () => setPosition({ x: 0, y: 0 })

  useEffect(() => {
    const element = ref?.current ? ref.current : document

    const subscribe = () => {
      element.addEventListener('mousemove', setMousePosition as any)
      if (opts.resetOnExit) element.addEventListener('mouseleave', resetMousePosition as any)
    }
    const unsubscribe = () => {
      element.removeEventListener('mousemove', setMousePosition as any)
      if (opts.resetOnExit) element.removeEventListener('mouseleave', resetMousePosition as any)
    }

    if (doTrack) subscribe()
    else unsubscribe()

    return unsubscribe
  }, [doTrack, ref.current])

  return { ref, ...position }
}

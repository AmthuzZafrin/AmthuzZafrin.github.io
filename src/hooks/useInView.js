import { useEffect, useRef, useState } from 'react'

/**
 * Fires once when the element scrolls into view. Used to trigger section
 * reveals — deliberately one-shot so scrolling back up doesn't replay them.
 */
export function useInView({ threshold = 0.35, once = true } = {}) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          if (once) observer.disconnect()
        } else if (!once) {
          setInView(false)
        }
      },
      { threshold },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, once])

  return [ref, inView]
}

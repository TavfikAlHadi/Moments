import { useRef, useState, useCallback } from 'react'

type Props = {
  beforeSrc: string
  afterSrc: string
  beforeLabel?: string
  afterLabel?: string
}

export default function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = 'Before',
  afterLabel = 'After',
}: Props) {
  const [pos, setPos] = useState(50)
  const ref = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const updateFromClientX = useCallback((clientX: number) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const pct = ((clientX - rect.left) / rect.width) * 100
    setPos(Math.min(100, Math.max(0, pct)))
  }, [])

  return (
    <div
      ref={ref}
      className="relative aspect-4/3 w-full overflow-hidden rounded-2xl select-none cursor-ew-resize shadow-2xl shadow-ink/20"
      onPointerDown={(e) => {
        dragging.current = true
        updateFromClientX(e.clientX)
      }}
      onPointerMove={(e) => {
        if (dragging.current) updateFromClientX(e.clientX)
      }}
      onPointerUp={() => (dragging.current = false)}
      onPointerLeave={() => (dragging.current = false)}
    >
      <img
        src={afterSrc}
        alt={afterLabel}
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        className="absolute inset-0 h-full overflow-hidden"
        style={{ width: `${pos}%` }}
      >
        <img
          src={beforeSrc}
          alt={beforeLabel}
          draggable={false}
          className="absolute inset-0 h-full object-cover"
          style={{ width: `${(100 / Math.max(pos, 1)) * 100}%`, maxWidth: 'none' }}
        />
      </div>

      <div
        className="absolute inset-y-0 w-0.5 bg-cream/90"
        style={{ left: `${pos}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-10 w-10 rounded-full bg-cream shadow-lg flex items-center justify-center text-ink">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M8 6L2 12L8 18M16 6L22 12L16 18" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      <span className="absolute bottom-3 left-3 rounded-full bg-ink/60 px-3 py-1 text-xs font-semibold text-cream backdrop-blur">
        {beforeLabel}
      </span>
      <span className="absolute bottom-3 right-3 rounded-full bg-terracotta/90 px-3 py-1 text-xs font-semibold text-cream backdrop-blur">
        {afterLabel}
      </span>
    </div>
  )
}

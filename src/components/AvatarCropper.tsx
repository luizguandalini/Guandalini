import { useRef, useState, useEffect } from 'react'
import type { AvatarCrop } from '../types'
import styles from './AvatarCropper.module.css'

interface AvatarCropperProps {
  src:      string
  value:    AvatarCrop
  onChange: (v: AvatarCrop) => void
}

/**
 * Simple circular crop area. The user can drag to pan and use a slider to zoom.
 * Produces the same { x, y, scale } shape used by <Avatar /> so the preview is
 * pixel-accurate with the persisted data.
 */
export function AvatarCropper({ src, value, onChange }: AvatarCropperProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const startRef = useRef({ x: 0, y: 0, cropX: 0, cropY: 0 })

  useEffect(() => {
    if (!dragging) return

    const onMove = (e: MouseEvent | TouchEvent) => {
      const frame = frameRef.current
      if (!frame) return
      const rect = frame.getBoundingClientRect()
      const point = 'touches' in e ? e.touches[0] : e
      const dx = ((point.clientX - startRef.current.x) / rect.width)  * 100
      const dy = ((point.clientY - startRef.current.y) / rect.height) * 100
      const maxShift = 50 * (value.scale - 1) + 10
      onChange({
        ...value,
        x: clamp(startRef.current.cropX + dx, -maxShift, maxShift),
        y: clamp(startRef.current.cropY + dy, -maxShift, maxShift),
      })
    }

    const onUp = () => setDragging(false)

    window.addEventListener('mousemove',  onMove)
    window.addEventListener('mouseup',    onUp)
    window.addEventListener('touchmove',  onMove, { passive: false })
    window.addEventListener('touchend',   onUp)
    return () => {
      window.removeEventListener('mousemove',  onMove)
      window.removeEventListener('mouseup',    onUp)
      window.removeEventListener('touchmove',  onMove)
      window.removeEventListener('touchend',   onUp)
    }
  }, [dragging, value, onChange])

  const onDown = (e: React.MouseEvent | React.TouchEvent) => {
    const point = 'touches' in e ? e.touches[0] : e
    startRef.current = { x: point.clientX, y: point.clientY, cropX: value.x, cropY: value.y }
    setDragging(true)
  }

  return (
    <div className={styles.wrap}>
      <div
        ref={frameRef}
        className={styles.frame}
        onMouseDown={onDown}
        onTouchStart={onDown}
      >
        <img
          src={src}
          alt=""
          draggable={false}
          className={styles.img}
          style={{
            transform: `translate(${value.x}%, ${value.y}%) scale(${value.scale})`,
          }}
        />
        <div className={styles.guide} />
      </div>

      <div className={styles.zoomRow}>
        <span className={styles.zoomLabel}>Zoom</span>
        <input
          type="range"
          min="1"
          max="3"
          step="0.01"
          value={value.scale}
          onChange={(e) => onChange({ ...value, scale: Number(e.target.value) })}
          className={styles.slider}
        />
      </div>

      <p className={styles.hint}>Arraste a imagem para reposicionar · Use o zoom para ajustar</p>
    </div>
  )
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

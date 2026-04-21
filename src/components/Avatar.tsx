import type { AvatarCrop } from '../types'

interface AvatarProps {
  src:   string
  name:  string
  crop?: AvatarCrop | null
  size?: number
  className?: string
}

/**
 * Circle avatar that supports a crop transform:
 *   x, y  — offsets in percent (-50..50, 0 = centered)
 *   scale — zoom multiplier (1..3)
 *
 * When crop is null we just `object-fit: cover` the image.
 */
export function Avatar({ src, name, crop, size = 40, className }: AvatarProps) {
  const hasCrop = !!crop

  return (
    <span
      className={className}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        background: 'var(--color-accent-sage)',
        flexShrink: 0,
        position: 'relative',
      }}
    >
      <img
        src={src}
        alt={name}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          transformOrigin: 'center center',
          transform: hasCrop
            ? `translate(${crop!.x}%, ${crop!.y}%) scale(${crop!.scale})`
            : undefined,
        }}
      />
    </span>
  )
}

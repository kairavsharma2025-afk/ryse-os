import { useState } from 'react'
import { avatarEmoji } from '@/components/icons'

interface Props {
  /** avatar id (e.g. 'wizard', 'ninja', 'archer', …) */
  id: string
  /** sizing / border / shadow classes for the round frame, e.g. "w-16 h-16 border-2 border-accent/40" */
  className?: string
  alt?: string
}

// OpenMoji ships a clean, minimal flat color SVG per emoji codepoint — that's our "picture".
// Filename = hyphen-joined UPPERCASE hex codepoints, with the VS16 (FE0F) stripped from sequences.
function openmojiCodepoint(emoji: string): string {
  const cps = [...emoji].map((ch) => ch.codePointAt(0) ?? 0)
  const parts = cps.length > 1 ? cps.filter((c) => c !== 0xfe0f) : cps
  return parts.map((c) => c.toString(16).toUpperCase()).join('-')
}

function pictureUrl(emoji: string): string {
  return `https://cdn.jsdelivr.net/gh/hfg-gmuend/openmoji@latest/color/svg/${openmojiCodepoint(emoji)}.svg`
}

/** Circular avatar — a clean flat picture of the avatar's namesake (wizard, ninja, dragon, …);
 *  falls back to the emoji glyph if the image can't load (offline / CDN blocked). */
export function Avatar({ id, className = 'w-10 h-10', alt = 'Avatar' }: Props) {
  const emoji = avatarEmoji(id)
  const [failed, setFailed] = useState(false)
  return (
    <span
      role="img"
      aria-label={alt}
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden rounded-full bg-surface2 ${className}`}
    >
      {failed ? (
        <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
          <text x="50" y="53" textAnchor="middle" dominantBaseline="central" fontSize="60">
            {emoji}
          </text>
        </svg>
      ) : (
        <img
          src={pictureUrl(emoji)}
          alt={alt}
          draggable={false}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-[78%] w-[78%] object-contain"
        />
      )}
    </span>
  )
}

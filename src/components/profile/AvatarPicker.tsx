import { useMemo } from 'react'
import { User as UserIcon, Check } from 'lucide-react'
import { Avatar } from '@/components/character/Avatar'
import { AVATAR_OPTIONS } from '@/components/icons'
import { useCharacter } from '@/stores/characterStore'

/**
 * Avatar selection grid. 6 cols on mobile, 8 on sm, 12 on md+. Selected option
 * gets an accent ring + a tiny check badge in the corner so the choice reads
 * at a glance. Active option's label is mirrored under the grid for screen-
 * reader-friendly confirmation.
 */
export function AvatarPicker() {
  const avatar = useCharacter((s) => s.avatar)
  const setAvatar = useCharacter((s) => s.setAvatar)

  const current = useMemo(
    () => AVATAR_OPTIONS.find((a) => a.id === avatar),
    [avatar]
  )

  return (
    <div className="rounded-2xl bg-surface border border-border/10 shadow-card p-5">
      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-accent" strokeWidth={1.8} />
            <h2 className="font-display text-xl tracking-wide">Avatar</h2>
          </div>
          <p className="text-xs text-muted leading-relaxed mt-1 max-w-md">
            Pick the figure that feels right. Switches everywhere — sidebar, hero, celebrations.
          </p>
        </div>
        <div className="text-[10px] uppercase tracking-wider text-muted text-right">
          <div>Current</div>
          <div className="text-accent2 tracking-normal text-xs normal-case">
            {current?.label ?? '—'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
        {AVATAR_OPTIONS.map((a) => {
          const selected = a.id === avatar
          return (
            <button
              key={a.id}
              onClick={() => setAvatar(a.id)}
              title={a.label}
              aria-label={a.label}
              aria-pressed={selected}
              className={`relative aspect-square rounded-lg border p-1 transition-colors flex items-center justify-center ${
                selected
                  ? 'border-accent bg-accent/10 ring-1 ring-accent/40'
                  : 'border-border/40 bg-surface2/40 hover:bg-surface2 hover:border-accent/30'
              }`}
            >
              <Avatar id={a.id} alt={a.label} className="h-full w-full" />
              {selected && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-accent text-white flex items-center justify-center shadow-card">
                  <Check className="w-2.5 h-2.5" strokeWidth={2.6} />
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

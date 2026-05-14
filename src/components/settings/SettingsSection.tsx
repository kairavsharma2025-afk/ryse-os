import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * Shared section frame for the Settings page. Picks up the new shadow-card +
 * border/10 design tokens; supplies a consistent header row (icon, title,
 * optional right-aligned slot). All section bodies live underneath as children.
 *
 *   <SettingsSection id="appearance" icon={Palette} title="Appearance">
 *     …
 *   </SettingsSection>
 */
export function SettingsSection({
  id,
  icon: Icon,
  title,
  description,
  right,
  tone,
  children,
}: {
  id: string
  icon: LucideIcon
  title: string
  description?: ReactNode
  right?: ReactNode
  tone?: 'danger'
  children: ReactNode
}) {
  return (
    <section
      id={`settings-${id}`}
      className={`rounded-2xl border shadow-card p-5 scroll-mt-24 ${
        tone === 'danger' ? 'border-red-500/30 bg-red-950/10' : 'border-border/10 bg-surface'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Icon
              className={`w-4 h-4 ${tone === 'danger' ? 'text-red-400' : 'text-accent'}`}
              strokeWidth={1.8}
            />
            <h2
              className={`font-display text-xl tracking-wide ${
                tone === 'danger' ? 'text-red-400' : 'text-text'
              }`}
            >
              {title}
            </h2>
          </div>
          {description && (
            <p className="text-xs text-muted leading-relaxed mt-1 max-w-xl">{description}</p>
          )}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
      {children}
    </section>
  )
}

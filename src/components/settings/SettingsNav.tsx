import { useEffect, useRef, useState } from 'react'
import {
  Bot,
  Palette,
  Bell,
  Sunrise,
  Gamepad2,
  Smartphone,
  AlertTriangle,
  User as UserIcon,
  type LucideIcon,
} from 'lucide-react'

/**
 * Sticky pill-row navigation for the Settings page. Scrolls horizontally on
 * mobile; on desktop, the bar sits below the page header at the top of the
 * scroll container. Click a pill → smooth-scroll to the matching section.
 * IntersectionObserver tracks which section is in view so the pill highlights
 * stay in sync.
 */
export interface SettingsNavItem {
  id: string
  label: string
  icon: LucideIcon
}

export const SETTINGS_SECTIONS: SettingsNavItem[] = [
  { id: 'account', label: 'Account', icon: UserIcon },
  { id: 'assistant', label: 'Assistant', icon: Bot },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'routine', label: 'Routine', icon: Sunrise },
  { id: 'game', label: 'Game', icon: Gamepad2 },
  { id: 'install', label: 'Install', icon: Smartphone },
  { id: 'danger', label: 'Danger', icon: AlertTriangle },
]

export function SettingsNav({ visibleIds }: { visibleIds: string[] }) {
  const [active, setActive] = useState<string>('account')
  const refsToObserve = useRef<HTMLElement[]>([])

  useEffect(() => {
    const els: HTMLElement[] = []
    for (const id of visibleIds) {
      const el = document.getElementById(`settings-${id}`)
      if (el) els.push(el)
    }
    refsToObserve.current = els
    if (els.length === 0) return

    const obs = new IntersectionObserver(
      (entries) => {
        // Pick the most-visible entry above the bottom.
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length === 0) return
        visible.sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        const id = visible[0].target.id.replace('settings-', '')
        setActive(id)
      },
      { rootMargin: '-20% 0px -55% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    )
    for (const el of els) obs.observe(el)
    return () => obs.disconnect()
  }, [visibleIds.join(',')]) // eslint-disable-line react-hooks/exhaustive-deps

  const onJump = (id: string) => {
    const el = document.getElementById(`settings-${id}`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActive(id)
  }

  const items = SETTINGS_SECTIONS.filter((s) => visibleIds.includes(s.id))

  return (
    <div className="sticky top-[60px] md:top-2 z-20 -mx-1 px-1 overflow-x-auto bg-bg/85 backdrop-blur-md py-2 -my-1">
      <div className="inline-flex p-1 rounded-xl bg-surface2/60 border border-border/10 gap-0.5">
        {items.map((s) => {
          const Icon = s.icon
          const isActive = active === s.id
          return (
            <button
              key={s.id}
              onClick={() => onJump(s.id)}
              className={`px-3 h-9 rounded-lg text-sm transition-colors duration-80 flex items-center gap-1.5 whitespace-nowrap ${
                isActive
                  ? 'bg-accent text-white font-semibold shadow-card'
                  : 'text-muted hover:text-text'
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={isActive ? 2.2 : 1.8} />
              {s.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

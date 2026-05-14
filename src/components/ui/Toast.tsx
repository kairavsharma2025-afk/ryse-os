import { create } from 'zustand'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, AlertTriangle, X as XIcon, Info } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * Global toast system. Bottom-center, 3 max stacked, 3s auto-dismiss.
 *
 *   toast.success('Task complete')
 *   toast.error("Couldn't save")
 *   toast.info('Synced')
 *   toast.show({ title: 'Custom', icon: <X/>, duration: 5000 })
 *
 * Mount <ToastHost/> once at the app root so toasts render.
 */
export type ToastTone = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  tone: ToastTone
  title: ReactNode
  description?: ReactNode
  duration: number
  icon?: ReactNode
}

type ShowInput = Omit<ToastItem, 'id' | 'duration'> & { id?: string; duration?: number }

interface ToastState {
  items: ToastItem[]
  show(item: ShowInput): string
  dismiss(id: string): void
  clearAll(): void
}

const MAX_STACKED = 3
const DEFAULT_DURATION = 3000

export const useToastStore = create<ToastState>((set, get) => ({
  items: [],
  show(item) {
    const id = item.id ?? (crypto.randomUUID?.() ?? `t_${Date.now()}_${Math.random()}`)
    const entry: ToastItem = {
      id,
      tone: item.tone,
      title: item.title,
      description: item.description,
      duration: item.duration ?? DEFAULT_DURATION,
      icon: item.icon,
    }
    set((s) => ({ items: [...s.items.slice(-(MAX_STACKED - 1)), entry] }))
    if (entry.duration > 0) {
      setTimeout(() => get().dismiss(id), entry.duration)
    }
    return id
  },
  dismiss(id) {
    set((s) => ({ items: s.items.filter((t) => t.id !== id) }))
  },
  clearAll() {
    set({ items: [] })
  },
}))

/** Imperative API — call from anywhere. */
export const toast = {
  success: (title: ReactNode, description?: ReactNode) =>
    useToastStore.getState().show({ tone: 'success', title, description }),
  error: (title: ReactNode, description?: ReactNode) =>
    useToastStore.getState().show({ tone: 'error', title, description }),
  warning: (title: ReactNode, description?: ReactNode) =>
    useToastStore.getState().show({ tone: 'warning', title, description }),
  info: (title: ReactNode, description?: ReactNode) =>
    useToastStore.getState().show({ tone: 'info', title, description }),
  show: (item: ShowInput) => useToastStore.getState().show(item),
  dismiss: (id: string) => useToastStore.getState().dismiss(id),
  clearAll: () => useToastStore.getState().clearAll(),
}

const ICONS: Record<ToastTone, ReactNode> = {
  success: <Check className="w-4 h-4" strokeWidth={2.5} />,
  error: <AlertTriangle className="w-4 h-4" strokeWidth={2.2} />,
  warning: <AlertTriangle className="w-4 h-4" strokeWidth={2.2} />,
  info: <Info className="w-4 h-4" strokeWidth={2.2} />,
}

const TONE_STYLES: Record<ToastTone, { ring: string; bg: string; fg: string }> = {
  success: { ring: 'ring-success/40', bg: 'bg-success/15', fg: 'text-success' },
  error: { ring: 'ring-danger/40', bg: 'bg-danger/15', fg: 'text-danger' },
  warning: { ring: 'ring-warning/40', bg: 'bg-warning/15', fg: 'text-warning' },
  info: { ring: 'ring-accent/40', bg: 'bg-accent/15', fg: 'text-accent' },
}

export function ToastHost() {
  const items = useToastStore((s) => s.items)
  const dismiss = useToastStore((s) => s.dismiss)
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] flex flex-col items-center gap-2 pointer-events-none"
    >
      <AnimatePresence initial={false}>
        {items.map((t) => {
          const tone = TONE_STYLES[t.tone]
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="pointer-events-auto min-w-[260px] max-w-[420px] rounded-xl bg-surface shadow-elevated border border-border/10 px-3 py-2.5 flex items-start gap-2.5"
              role="alert"
            >
              <span
                className={`shrink-0 mt-0.5 inline-flex items-center justify-center w-6 h-6 rounded-full ring-1 ${tone.ring} ${tone.bg} ${tone.fg}`}
              >
                {t.icon ?? ICONS[t.tone]}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-text leading-snug">{t.title}</div>
                {t.description && (
                  <div className="text-xs text-muted leading-snug mt-0.5">{t.description}</div>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 -mr-1 -mt-0.5 p-1 text-muted hover:text-text transition-colors duration-80"
                aria-label="Dismiss"
              >
                <XIcon className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

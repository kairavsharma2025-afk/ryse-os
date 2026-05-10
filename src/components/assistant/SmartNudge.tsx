import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Car, X } from 'lucide-react'
import { useSchedule } from '@/stores/scheduleStore'
import { useSettings } from '@/stores/settingsStore'
import {
  computeActiveNudge,
  dismissNudge,
  markNotified,
  wasNotifiedToday,
  bookUber,
  bookOla,
  type ActiveNudge,
} from '@/engine/nudges'

const TICK_MS = 30_000

/** Floating "want me to book an Uber?"-style card, driven by today's schedule.
 *  A side time-management feature — not part of the dashboard / nav. */
export function SmartNudge() {
  const events = useSchedule((s) => s.events)
  const enabled = useSettings((s) => s.rideNudges)
  const leaveLeadMin = useSettings((s) => s.officeLeaveLeadMin)
  const [nudge, setNudge] = useState<ActiveNudge | null>(null)

  useEffect(() => {
    const check = () => {
      if (!enabled) {
        setNudge(null)
        return
      }
      const n = computeActiveNudge(events, new Date(), leaveLeadMin)
      setNudge(n)
      if (n && !wasNotifiedToday(n.key)) {
        markNotified(n.key)
        const N = typeof window !== 'undefined' ? window.Notification : undefined
        if (N && N.permission === 'granted' && document.visibilityState !== 'visible') {
          try {
            new N(`${n.emoji} ${n.title}`, { body: n.body })
          } catch {
            /* ignore */
          }
        }
      }
    }
    check()
    const id = window.setInterval(check, TICK_MS)
    return () => window.clearInterval(id)
  }, [events, enabled, leaveLeadMin])

  const close = () => {
    if (nudge) dismissNudge(nudge.key)
    setNudge(null)
  }
  const ride = (fn: () => void) => {
    if (nudge) dismissNudge(nudge.key)
    fn()
    setNudge(null)
  }

  return (
    <AnimatePresence>
      {nudge && (
        <motion.div
          key={nudge.key}
          initial={{ opacity: 0, y: -16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ type: 'spring', damping: 22, stiffness: 240 }}
          className="fixed z-50 top-16 left-4 right-4 md:top-auto md:bottom-6 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[26rem] rounded-2xl bg-surface border border-accent/40 shadow-glow p-4"
        >
          <button
            onClick={close}
            className="absolute top-2.5 right-2.5 p-1 rounded-lg text-muted hover:text-text hover:bg-surface2/50"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-start gap-3 pr-6">
            <span className="shrink-0 w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center text-lg">
              {nudge.emoji}
            </span>
            <div className="min-w-0">
              <div className="font-display tracking-wide text-[15px] leading-snug">{nudge.title}</div>
              <div className="text-sm text-muted mt-0.5 leading-relaxed">{nudge.body}</div>
            </div>
          </div>
          <div className="mt-3.5 flex items-center gap-2">
            <button
              onClick={() => ride(bookUber)}
              className="flex-1 h-10 rounded-xl bg-accent text-bg font-medium text-sm hover:bg-accent2 transition-colors flex items-center justify-center gap-1.5"
            >
              <Car className="w-4 h-4" /> Book Uber
            </button>
            <button
              onClick={() => ride(bookOla)}
              className="h-10 px-4 rounded-xl bg-surface2/60 border border-border text-text text-sm hover:bg-surface2 transition-colors"
            >
              Ola
            </button>
            <button
              onClick={close}
              className="h-10 px-3 rounded-xl text-muted text-sm hover:text-text hover:bg-surface2/40 transition-colors"
            >
              Not now
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

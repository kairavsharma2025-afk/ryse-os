import { useMemo, useState } from 'react'
import { AnimatePresence, motion, type PanInfo } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useQuests } from '@/stores/questsStore'
import { useGoals } from '@/stores/goalsStore'
import { useSchedule } from '@/stores/scheduleStore'
import { useReminders } from '@/stores/remindersStore'
import { actionCompleteQuest, actionLogGoal } from '@/engine/gameLoop'
import { todayISO } from '@/engine/dates'
import { AREA_ICONS } from '@/components/icons'
import { Zap, Check, Flame, Calendar, Bell, Target, Brain, Sparkles } from 'lucide-react'
import type { AreaId } from '@/types'

/**
 * Today's tasks, scrollable as a vertical stack of premium cards.
 *
 *   • CSS scroll-snap-type: y mandatory for the slot-machine feel.
 *   • Swipe right → complete (green sweep + collapse).
 *   • Swipe left  → reveal Skip / Reschedule actions (Reschedule routes to
 *                    Plan in Wave 3; for now it's a no-op chip).
 *   • Tap        → complete (same as swipe-right) — power users want one tap.
 *
 * Data is unified across the four sources (quest / goal / event / reminder)
 * into a single TodayItem shape, so the card UI stays simple. The completion
 * branch dispatches the correct gameLoop action by item.kind.
 */
type ItemKind = 'quest' | 'goal' | 'event' | 'reminder'

interface TodayItem {
  id: string
  kind: ItemKind
  title: string
  category: AreaId | null
  time?: string // HH:MM
  xp?: number
  // True if this item is already finished today.
  done: boolean
  // Used for click-through / "Open" affordance.
  href?: string
}

const ENERGY_ICON: Record<ItemKind, typeof Zap> = {
  quest: Sparkles,
  goal: Target,
  event: Calendar,
  reminder: Bell,
}

export function TaskCardScroller() {
  const nav = useNavigate()
  const todayQuests = useQuests((s) => s.todayQuests)
  const goals = useGoals((s) => s.goals)
  const events = useSchedule((s) => s.events)
  const reminders = useReminders((s) => s.reminders)
  const today = todayISO()
  const [pulseCompleteId, setPulseCompleteId] = useState<string | null>(null)

  const items = useMemo<TodayItem[]>(() => {
    const out: TodayItem[] = []

    // Quests (3 daily) — area inferred from the linked goal when present.
    for (const q of todayQuests) {
      const linked = q.linkedGoalId ? goals.find((g) => g.id === q.linkedGoalId) : undefined
      out.push({
        id: `quest:${q.id}`,
        kind: 'quest',
        title: q.title,
        category: linked?.area ?? null,
        xp: q.xpReward,
        done: !!q.completedAt,
      })
    }

    // Events (today's schedule).
    for (const e of events.filter((e) => e.date === today)) {
      out.push({
        id: `event:${e.id}`,
        kind: 'event',
        title: e.title,
        category: (e.category ?? null) as AreaId | null,
        time: e.startTime,
        done: false, // events don't have a "done" flag yet
      })
    }

    // Goals — show daily-cadence goals that haven't been logged today.
    for (const g of goals) {
      if (g.cadence !== 'daily' && g.cadence !== 'weekdays') continue
      const loggedToday = g.lastLoggedAt && g.lastLoggedAt.slice(0, 10) === today
      out.push({
        id: `goal:${g.id}`,
        kind: 'goal',
        title: g.title,
        category: g.area as AreaId,
        xp: undefined,
        done: !!loggedToday,
        href: `/goals/${g.id}`,
      })
    }

    // Reminders due today that aren't already done.
    const todayReminders = reminders.filter((r) => r.date === today && !r.done)
    for (const r of todayReminders) {
      out.push({
        id: `reminder:${r.id}`,
        kind: 'reminder',
        title: r.title,
        category: (r.category ?? null) as AreaId | null,
        time: r.time,
        done: false,
      })
    }

    // Sort: unfinished first, then by time if present, else by kind.
    out.sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1
      if (a.time && b.time) return a.time.localeCompare(b.time)
      if (a.time) return -1
      if (b.time) return 1
      return 0
    })
    return out
  }, [todayQuests, goals, events, reminders, today])

  const remaining = items.filter((i) => !i.done).length

  function handleComplete(item: TodayItem) {
    if (item.done) return
    setPulseCompleteId(item.id)
    // Run the actual completion action in the background; let the animation
    // play even if the store update is synchronous.
    setTimeout(() => {
      if (item.kind === 'quest') {
        const id = item.id.replace(/^quest:/, '')
        actionCompleteQuest(id)
      } else if (item.kind === 'goal') {
        const id = item.id.replace(/^goal:/, '')
        actionLogGoal(id)
      }
      // Events and reminders don't have a "complete" gameLoop yet —
      // optimistic UI for now; real completion lands with Wave 3's unified
      // task model.
      setPulseCompleteId(null)
    }, 320)
  }

  function handleSwipeEnd(item: TodayItem, info: PanInfo) {
    if (info.offset.x > 80 || info.velocity.x > 600) {
      handleComplete(item)
    }
    // Left swipe → Wave 4 will reveal action drawer (Skip/Reschedule/Delegate).
    // For now, swipe-left is ignored.
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-border/10 bg-surface p-8 text-center">
        <Brain className="w-6 h-6 text-muted mx-auto mb-2" />
        <div className="text-md text-text mb-1">Nothing today.</div>
        <div className="text-sm text-muted leading-relaxed">
          Add a goal, log a quest, or schedule something — your day is a blank canvas.
        </div>
      </div>
    )
  }

  return (
    <div>
      <div
        className="flex flex-col gap-2 overflow-y-auto pr-1"
        style={{
          scrollSnapType: 'y mandatory',
          // Show roughly 2.5 cards on desktop, 2 on mobile.
          maxHeight: 'min(72vh, 480px)',
        }}
      >
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <TaskCard
              key={item.id}
              item={item}
              completing={pulseCompleteId === item.id}
              onTap={() => (item.href ? nav(item.href) : handleComplete(item))}
              onCompleteTap={() => handleComplete(item)}
              onSwipeEnd={(info) => handleSwipeEnd(item, info)}
            />
          ))}
        </AnimatePresence>
      </div>
      <div className="text-xs text-muted mt-3 text-center">
        {remaining} of {items.length} task{items.length === 1 ? '' : 's'} remaining
      </div>
    </div>
  )
}

interface TaskCardProps {
  item: TodayItem
  completing: boolean
  onTap: () => void
  onCompleteTap: () => void
  onSwipeEnd: (info: PanInfo) => void
}

function TaskCard({ item, completing, onTap, onCompleteTap, onSwipeEnd }: TaskCardProps) {
  const KindIcon = ENERGY_ICON[item.kind]
  const AreaIcon = item.category ? AREA_ICONS[item.category] : null
  const categoryColor = item.category ?? 'accent'

  if (completing) {
    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 1, scale: 1, height: 'auto' }}
        animate={{ opacity: 0, scale: 0.95, y: -8, height: 0, marginBottom: 0 }}
        transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
        className="overflow-hidden"
        style={{ scrollSnapAlign: 'start' }}
      >
        <div
          className="relative rounded-2xl border border-success/40 bg-success/10 px-4 py-6 flex items-center justify-center gap-2 shadow-card"
          style={{ minHeight: '140px' }}
        >
          <Check className="w-5 h-5 text-success" strokeWidth={2.5} />
          <span className="text-md text-success">Done</span>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.button
      key={item.id}
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      whileTap={{ scale: 0.98 }}
      drag="x"
      dragConstraints={{ left: -120, right: 120 }}
      dragElastic={0.18}
      onDragEnd={(_, info) => onSwipeEnd(info)}
      onClick={onTap}
      className={`relative w-full text-left rounded-2xl border border-border/10 shadow-card px-4 py-3.5 transition-colors duration-80 hover:bg-surface2/30 cursor-pointer ${
        item.done ? 'opacity-50 bg-surface2/40' : 'bg-surface'
      }`}
      style={{
        minHeight: '140px',
        scrollSnapAlign: 'start',
        borderLeftWidth: '4px',
        borderLeftColor: `rgb(var(--${categoryColor}))`,
      }}
    >
      <div className="flex items-start gap-3 h-full">
        <span
          className="shrink-0 mt-0.5 w-9 h-9 rounded-full flex items-center justify-center"
          style={{
            background: `rgb(var(--${categoryColor}) / 0.12)`,
            color: `rgb(var(--${categoryColor}))`,
          }}
        >
          {AreaIcon ? <AreaIcon className="w-4.5 h-4.5" strokeWidth={1.8} /> : <KindIcon className="w-4.5 h-4.5" strokeWidth={1.8} />}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 text-xs text-muted">
            <span className="uppercase">
              {item.category ?? item.kind}
            </span>
            {item.time && (
              <>
                <span className="text-muted/40">·</span>
                <span className="text-muted">{item.time}</span>
              </>
            )}
            {item.done && (
              <>
                <span className="text-muted/40">·</span>
                <span className="text-success flex items-center gap-0.5">
                  <Check className="w-3 h-3" /> Done
                </span>
              </>
            )}
          </div>
          <div className="text-md text-text leading-snug line-clamp-2">{item.title}</div>
        </div>

        {item.xp != null && (
          <div className="shrink-0 text-right">
            <div className="text-[10px] uppercase tracking-wider text-muted mb-0.5">XP</div>
            <div className="text-md text-warning flex items-center justify-end gap-0.5">
              <Zap className="w-3.5 h-3.5" />
              {item.xp}
            </div>
          </div>
        )}
      </div>

      {!item.done && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onCompleteTap()
          }}
          className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-surface2 border border-border/10 hover:bg-success/15 hover:border-success/40 hover:text-success text-muted flex items-center justify-center transition-colors duration-80"
          aria-label="Mark complete"
        >
          <Check className="w-4 h-4" strokeWidth={2.2} />
        </button>
      )}

      {/* Streak hint corner */}
      {item.kind === 'goal' && !item.done && (
        <div className="absolute bottom-3 left-4 text-[11px] text-muted flex items-center gap-1">
          <Flame className="w-3 h-3 text-warning" />
          tap or swipe right to log
        </div>
      )}
    </motion.button>
  )
}

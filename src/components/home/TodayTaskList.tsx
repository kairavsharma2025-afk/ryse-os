import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronDown } from 'lucide-react'
import { useQuests } from '@/stores/questsStore'
import { useGoals } from '@/stores/goalsStore'
import { useSchedule } from '@/stores/scheduleStore'
import { useReminders } from '@/stores/remindersStore'
import { actionCompleteQuest, actionLogGoal } from '@/engine/gameLoop'
import { todayISO } from '@/engine/dates'
import { AREAS } from '@/data/areas'
import { XPFloat } from '@/components/ui/XPFloat'
import type { AreaId } from '@/types'

type ItemKind = 'quest' | 'goal' | 'event' | 'reminder'

interface TodayItem {
  id: string
  kind: ItemKind
  title: string
  category: AreaId | null
  time?: string
  xp?: number
  done: boolean
  href?: string
  linkedGoalId?: string
}

const INITIAL_VISIBLE = 7

/**
 * Vertical task list for the Today page. Replaces the horizontal swipe deck.
 *
 *   • Each row: category-colored left border, category pill, time, and a
 *     44×44 tap-target ✓ button on the far right.
 *   • Completing a row instantly strikes through, dims to 50% opacity, flashes
 *     green, and floats a "+N XP" indicator from the button.
 *   • Up to 7 rows visible by default — a "Show all N tasks" toggle expands.
 *   • Top of the section has a thin progress bar (done / total).
 */
export function TodayTaskList() {
  const nav = useNavigate()
  const todayQuests = useQuests((s) => s.todayQuests)
  const goals = useGoals((s) => s.goals)
  const events = useSchedule((s) => s.events)
  const reminders = useReminders((s) => s.reminders)
  const today = todayISO()

  const allItems = useMemo<TodayItem[]>(() => {
    const out: TodayItem[] = []
    for (const q of todayQuests) {
      const linked = q.linkedGoalId ? goals.find((g) => g.id === q.linkedGoalId) : undefined
      out.push({
        id: `quest:${q.id}`,
        kind: 'quest',
        title: q.title,
        category: linked?.area ?? null,
        xp: q.xpReward,
        done: !!q.completedAt,
        linkedGoalId: linked?.id,
      })
    }
    for (const e of events.filter((e) => e.date === today)) {
      out.push({
        id: `event:${e.id}`,
        kind: 'event',
        title: e.title,
        category: (e.category ?? null) as AreaId | null,
        time: e.startTime,
        done: false,
      })
    }
    for (const g of goals) {
      if (g.cadence !== 'daily' && g.cadence !== 'weekdays') continue
      const loggedToday = g.lastLoggedAt && g.lastLoggedAt.slice(0, 10) === today
      out.push({
        id: `goal:${g.id}`,
        kind: 'goal',
        title: g.title,
        category: g.area as AreaId,
        xp: 25,
        done: !!loggedToday,
        href: `/goals/${g.id}`,
      })
    }
    for (const r of reminders.filter((r) => r.date === today && !r.done)) {
      out.push({
        id: `reminder:${r.id}`,
        kind: 'reminder',
        title: r.title,
        category: (r.category ?? null) as AreaId | null,
        time: r.time,
        done: false,
      })
    }
    out.sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1
      if (a.time && b.time) return a.time.localeCompare(b.time)
      if (a.time) return -1
      if (b.time) return 1
      return 0
    })
    return out
  }, [todayQuests, goals, events, reminders, today])

  const [expanded, setExpanded] = useState(false)
  const [recentlyCompleted, setRecentlyCompleted] = useState<Map<string, number>>(new Map())

  const visible = expanded ? allItems : allItems.slice(0, INITIAL_VISIBLE)
  const overflow = Math.max(0, allItems.length - INITIAL_VISIBLE)
  const done = allItems.filter((i) => i.done).length
  const pct = allItems.length === 0 ? 0 : (done / allItems.length) * 100

  function complete(item: TodayItem) {
    if (item.done) return
    if (item.kind === 'quest') {
      actionCompleteQuest(item.id.replace(/^quest:/, ''))
      if (item.linkedGoalId) actionLogGoal(item.linkedGoalId)
    } else if (item.kind === 'goal') {
      actionLogGoal(item.id.replace(/^goal:/, ''))
    }
    setRecentlyCompleted((prev) => {
      const next = new Map(prev)
      next.set(item.id, item.xp ?? 10)
      return next
    })
    window.setTimeout(() => {
      setRecentlyCompleted((prev) => {
        const next = new Map(prev)
        next.delete(item.id)
        return next
      })
    }, 1500)
  }

  if (allItems.length === 0) {
    return (
      <div className="rounded-2xl border border-border/10 bg-surface p-6 text-center">
        <div className="text-md text-text mb-1">Nothing today.</div>
        <div className="text-sm text-muted">Add a goal or schedule something.</div>
      </div>
    )
  }

  return (
    <section>
      {/* Header + progress */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold tracking-widest uppercase text-muted">
          Today's tasks
        </div>
        <div className="text-[11px] text-muted tabular-nums">
          {done} / {allItems.length} done
        </div>
      </div>
      <div className="h-1 rounded-full bg-surface2/70 overflow-hidden mb-3">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{
            width: `${pct}%`,
            background: 'rgb(var(--color-success))',
          }}
        />
      </div>

      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {visible.map((item) => (
            <motion.li
              key={item.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              <TaskRow
                item={item}
                onComplete={() => complete(item)}
                onOpen={() => item.href && nav(item.href)}
                xpFloating={recentlyCompleted.get(item.id)}
              />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {!expanded && overflow > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-3 w-full inline-flex items-center justify-center gap-1.5 text-xs text-muted hover:text-text border border-border/30 rounded-xl py-2 hover:border-border/60 transition-colors"
        >
          <ChevronDown className="w-3.5 h-3.5" />
          Show all {allItems.length} tasks
        </button>
      )}
    </section>
  )
}

function TaskRow({
  item,
  onComplete,
  onOpen,
  xpFloating,
}: {
  item: TodayItem
  onComplete: () => void
  onOpen: () => void
  xpFloating?: number
}) {
  const cat = item.category
  const catMeta = cat ? AREAS[cat] : null
  const catColorVar = cat ? `--${cat}` : '--accent'
  const just = xpFloating != null

  return (
    <div
      onClick={() => (item.href ? onOpen() : onComplete())}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          item.href ? onOpen() : onComplete()
        }
      }}
      className={`group relative flex items-center gap-3 pl-4 pr-2 py-2.5 rounded-xl bg-surface border border-border/10 hover:bg-surface2/40 hover:border-border/30 transition-colors duration-150 cursor-pointer ${
        item.done ? 'opacity-50' : ''
      } ${just ? 'animate-completeFlash' : ''}`}
      style={{
        borderLeft: `4px solid rgb(var(${catColorVar}))`,
      }}
    >
      {/* category pill */}
      {catMeta && (
        <span
          className="shrink-0 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full"
          style={{
            background: `rgb(var(${catColorVar}) / 0.15)`,
            color: `rgb(var(${catColorVar}))`,
          }}
        >
          {catMeta.name}
        </span>
      )}

      <div className="flex-1 min-w-0">
        <div
          className={`text-sm leading-snug truncate ${
            item.done ? 'line-through text-muted' : 'text-text'
          }`}
        >
          {item.title}
        </div>
      </div>

      {item.time && (
        <span className="shrink-0 text-[11px] tabular-nums text-muted">{item.time}</span>
      )}

      {item.xp != null && !item.done && (
        <span className="shrink-0 hidden sm:inline-flex items-center gap-0.5 text-[11px] font-semibold text-reward">
          +{item.xp}
        </span>
      )}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onComplete()
        }}
        className={`relative shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-colors duration-150 ${
          item.done
            ? 'bg-success/15 text-success'
            : 'bg-surface2/60 border border-border/20 text-muted hover:bg-success/15 hover:text-success hover:border-success/40'
        }`}
        aria-label={item.done ? 'Completed' : 'Mark complete'}
        disabled={item.done}
      >
        <Check className="w-4 h-4" strokeWidth={2.4} />
        {xpFloating != null && <XPFloat amount={xpFloating} />}
      </button>
    </div>
  )
}

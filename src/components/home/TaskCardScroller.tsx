import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, type PanInfo, type Variants } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useQuests } from '@/stores/questsStore'
import { useGoals } from '@/stores/goalsStore'
import { useSchedule } from '@/stores/scheduleStore'
import { useReminders } from '@/stores/remindersStore'
import { actionCompleteQuest, actionLogGoal } from '@/engine/gameLoop'
import { todayISO } from '@/engine/dates'
import { AREA_ICONS } from '@/components/icons'
import { Zap, Check, Calendar, Bell, Target, Brain, Sparkles, ChevronUp, ChevronDown } from 'lucide-react'
import type { AreaId } from '@/types'

/**
 * Today's tasks as a 3D card stack. One active card sits center-frame, with the
 * previous task peeking in from the top and the next task peeking in from the
 * bottom — both blurred + dimmed so the active one reads cleanly.
 *
 * Completing the active card flips it backward on the Y axis; the next card
 * flips in to take its place. The "pending" set hides the just-completed item
 * from the visible stack while the flip plays, so the swap reads as a real
 * exchange rather than a fade.
 *
 *   • Tap the active card → existing onTap behaviour (open href, else complete)
 *   • Tap the prev/next peeks → navigate backward/forward without completing
 *   • Drag right on the active card → complete (existing gesture preserved)
 *   • Up/down chevrons in the gutter → keyboard-friendly nav for non-touch users
 */
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
  // For quest-kind items only: id of the goal this quest is tied to (if any).
  // Completing the quest also logs progress against this goal so the user
  // doesn't have to log twice.
  linkedGoalId?: string
}

const ENERGY_ICON: Record<ItemKind, typeof Zap> = {
  quest: Sparkles,
  goal: Target,
  event: Calendar,
  reminder: Bell,
}

// Stack geometry — tuned so a 144px card sits centered in a 220px frame with
// roughly a 35px peek of the prev/next card at either edge after scale(0.88).
const STACK_H = 220
const CARD_H = 144
const PEEK_OFFSET = 138
const PEEK_SCALE = 0.88
const PEEK_BLUR = 5
const PEEK_OPACITY = 0.42

interface ActiveTransition {
  // Completion flips the card backward; plain navigation slides it.
  mode: 'flip' | 'slide'
  // +1 = moving forward in time (next task), -1 = backward (previous task).
  dir: 1 | -1
}

// rotateX (not rotateY) — the card tilts top-down like a deck flip rather than
// swinging open like a door. For plain nav, mode === 'slide' produces a clean
// vertical translate so chevron/peek taps don't flip the card.
const ACTIVE_VARIANTS: Variants = {
  enter: (t: ActiveTransition) =>
    t.mode === 'flip'
      ? { rotateX: -90, opacity: 0, y: 0 }
      : { opacity: 0, y: 24 * t.dir },
  center: { rotateX: 0, opacity: 1, y: 0 },
  exit: (t: ActiveTransition) =>
    t.mode === 'flip'
      ? { rotateX: 90, opacity: 0, y: 0 }
      : { opacity: 0, y: -24 * t.dir },
}

// Picks the next-upcoming timed task as the default active card, so the front
// of the deck is whatever's coming up — not the earliest task of the day,
// which is usually already in the past.
function findInitialActiveIdx(items: TodayItem[]): number {
  if (items.length === 0) return 0
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  for (let i = 0; i < items.length; i++) {
    const t = items[i].time
    if (!t) continue
    const [h, m] = t.split(':').map(Number)
    if (h * 60 + m >= nowMin) return i
  }
  // No upcoming timed item — fall back to the first untimed one (they sort
  // after all timed items), then to index 0.
  for (let i = 0; i < items.length; i++) {
    if (!items[i].time) return i
  }
  return 0
}

export function TaskCardScroller() {
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
        done: !!loggedToday,
        href: `/goals/${g.id}`,
      })
    }

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

    out.sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1
      if (a.time && b.time) return a.time.localeCompare(b.time)
      if (a.time) return -1
      if (b.time) return 1
      return 0
    })
    return out
  }, [todayQuests, goals, events, reminders, today])

  // Items hidden by the flip-and-swap animation, indexed by id. They're
  // already mid-removal from the store; we strip them client-side so the new
  // active card slides into place the moment the flip starts.
  const [pendingComplete, setPendingComplete] = useState<Set<string>>(new Set())
  const visibleItems = useMemo(
    () => allItems.filter((i) => !pendingComplete.has(i.id) && !i.done),
    [allItems, pendingComplete]
  )
  const doneCount = allItems.length - allItems.filter((i) => !i.done).length

  // Tracking by id (not idx) so the right card stays "active" even when the
  // visible list changes underneath us — adds, removes, completions.
  const [activeId, setActiveId] = useState<string | null>(null)
  const [transition, setTransition] = useState<ActiveTransition>({ mode: 'slide', dir: 1 })

  const activeIdx = useMemo(() => {
    if (activeId) {
      const idx = visibleItems.findIndex((i) => i.id === activeId)
      if (idx >= 0) return idx
    }
    return findInitialActiveIdx(visibleItems)
  }, [visibleItems, activeId])

  // Keep activeId in sync with the resolved idx so subsequent re-renders
  // don't keep falling back to "next upcoming" after the user has navigated.
  useEffect(() => {
    if (visibleItems.length === 0) return
    const resolved = visibleItems[activeIdx]?.id
    if (resolved && resolved !== activeId) {
      setActiveId(resolved)
    }
  }, [activeIdx, visibleItems, activeId])

  if (allItems.length === 0) {
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

  if (visibleItems.length === 0) {
    return (
      <div className="rounded-2xl border border-success/30 bg-success/5 p-8 text-center">
        <Check className="w-6 h-6 text-success mx-auto mb-2" />
        <div className="text-md text-text mb-1">Today is clear.</div>
        <div className="text-sm text-muted leading-relaxed">
          {doneCount} task{doneCount === 1 ? '' : 's'} done. Coast the rest of the day.
        </div>
      </div>
    )
  }

  const active = visibleItems[activeIdx]
  const prev = activeIdx > 0 ? visibleItems[activeIdx - 1] : null
  const next = activeIdx < visibleItems.length - 1 ? visibleItems[activeIdx + 1] : null

  function goPrev() {
    if (activeIdx <= 0) return
    setTransition({ mode: 'slide', dir: -1 })
    setActiveId(visibleItems[activeIdx - 1].id)
  }
  function goNext() {
    if (activeIdx >= visibleItems.length - 1) return
    setTransition({ mode: 'slide', dir: 1 })
    setActiveId(visibleItems[activeIdx + 1].id)
  }

  function handleComplete(item: TodayItem) {
    if (item.done || pendingComplete.has(item.id)) return
    setTransition({ mode: 'flip', dir: 1 })
    // Point activeId at the task that *follows* the one being completed so the
    // next-upcoming logic doesn't yank focus to an earlier card after the
    // completed item gets filtered out.
    const curIdx = visibleItems.findIndex((i) => i.id === item.id)
    const successor = visibleItems[curIdx + 1] ?? visibleItems[curIdx - 1] ?? null
    setActiveId(successor?.id ?? null)
    setPendingComplete((p) => new Set(p).add(item.id))
    // Let the flip play out; dispatch the real store action partway through so
    // the underlying data settles before the pending mask is lifted.
    window.setTimeout(() => {
      if (item.kind === 'quest') {
        actionCompleteQuest(item.id.replace(/^quest:/, ''))
        // Auto-log the linked goal so completing a quest off the scroller
        // also feeds the goal's streak. actionLogGoal caps at one log per
        // day so this is safe even if the user logs the goal again elsewhere.
        if (item.linkedGoalId) {
          actionLogGoal(item.linkedGoalId)
        }
      } else if (item.kind === 'goal') {
        actionLogGoal(item.id.replace(/^goal:/, ''))
      }
      // Events/reminders: optimistic only — gameLoop integration lands later.
    }, 220)
    window.setTimeout(() => {
      setPendingComplete((p) => {
        const n = new Set(p)
        n.delete(item.id)
        return n
      })
    }, 700)
  }

  function handleActiveTap(item: TodayItem) {
    if (item.href) {
      nav(item.href)
    } else {
      handleComplete(item)
    }
  }

  function handleSwipeEnd(item: TodayItem, info: PanInfo) {
    if (info.offset.x > 80 || info.velocity.x > 600) {
      handleComplete(item)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-muted uppercase tracking-wider">Today's tasks</div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goPrev}
            disabled={!prev}
            className="w-7 h-7 rounded-full bg-surface border border-border/10 text-muted hover:text-text hover:border-border/30 disabled:opacity-30 disabled:hover:text-muted disabled:hover:border-border/10 flex items-center justify-center transition-colors duration-80"
            aria-label="Previous task"
          >
            <ChevronUp className="w-4 h-4" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={!next}
            className="w-7 h-7 rounded-full bg-surface border border-border/10 text-muted hover:text-text hover:border-border/30 disabled:opacity-30 disabled:hover:text-muted disabled:hover:border-border/10 flex items-center justify-center transition-colors duration-80"
            aria-label="Next task"
          >
            <ChevronDown className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      </div>

      <div
        className="relative"
        style={{
          height: STACK_H,
          perspective: '1000px',
          overflow: 'hidden',
        }}
      >
        {/* Previous task — peeks in from the top, blurred. */}
        <PeekSlot
          item={prev}
          position="prev"
          onClick={goPrev}
        />

        {/* Next task — peeks in from the bottom, blurred. */}
        <PeekSlot
          item={next}
          position="next"
          onClick={goNext}
        />

        {/* Active task — center stage, with flip animation on swap. */}
        <div
          className="absolute left-0 right-0 px-1"
          style={{
            top: '50%',
            transform: 'translateY(-50%)',
            transformStyle: 'preserve-3d',
          }}
        >
          <AnimatePresence mode="popLayout" initial={false} custom={transition}>
            <motion.div
              key={active.id}
              custom={transition}
              variants={ACTIVE_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.42, ease: [0.4, 0, 0.2, 1] }}
              style={{
                transformStyle: 'preserve-3d',
                transformOrigin: 'center',
                backfaceVisibility: 'hidden',
              }}
            >
              <ActiveCard
                item={active}
                onTap={() => handleActiveTap(active)}
                onCompleteTap={() => handleComplete(active)}
                onSwipeEnd={(info) => handleSwipeEnd(active, info)}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="text-xs text-muted mt-3 text-center">
        {activeIdx + 1} of {visibleItems.length}
        {doneCount > 0 && (
          <span className="text-success">  ·  {doneCount} done</span>
        )}
      </div>
    </div>
  )
}

interface PeekSlotProps {
  item: TodayItem | null
  position: 'prev' | 'next'
  onClick: () => void
}

function PeekSlot({ item, position, onClick }: PeekSlotProps) {
  const top = position === 'prev' ? `calc(50% - ${PEEK_OFFSET}px)` : `calc(50% + ${PEEK_OFFSET}px)`
  return (
    <div
      className="absolute left-0 right-0 px-1"
      style={{
        top,
        transform: 'translateY(-50%)',
        pointerEvents: item ? 'auto' : 'none',
      }}
    >
      <AnimatePresence mode="wait">
        {item && (
          <motion.button
            type="button"
            key={item.id}
            onClick={onClick}
            initial={{ opacity: 0 }}
            animate={{ opacity: PEEK_OPACITY }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="w-full text-left cursor-pointer"
            style={{
              transform: `scale(${PEEK_SCALE})`,
              filter: `blur(${PEEK_BLUR}px)`,
              transformOrigin: position === 'prev' ? 'center bottom' : 'center top',
            }}
            aria-label={position === 'prev' ? 'Previous task' : 'Next task'}
            tabIndex={-1}
          >
            <TaskCardSurface item={item} active={false} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

interface ActiveCardProps {
  item: TodayItem
  onTap: () => void
  onCompleteTap: () => void
  onSwipeEnd: (info: PanInfo) => void
}

function ActiveCard({ item, onTap, onCompleteTap, onSwipeEnd }: ActiveCardProps) {
  return (
    <motion.button
      type="button"
      drag="x"
      dragConstraints={{ left: -120, right: 120 }}
      dragElastic={0.18}
      onDragEnd={(_, info) => onSwipeEnd(info)}
      onClick={onTap}
      whileTap={{ scale: 0.985 }}
      className="w-full text-left cursor-pointer"
      style={{ transformOrigin: 'center' }}
    >
      <TaskCardSurface
        item={item}
        active
        onCompleteTap={onCompleteTap}
      />
    </motion.button>
  )
}

interface TaskCardSurfaceProps {
  item: TodayItem
  active: boolean
  onCompleteTap?: () => void
}

function TaskCardSurface({ item, active, onCompleteTap }: TaskCardSurfaceProps) {
  const KindIcon = ENERGY_ICON[item.kind]
  const AreaIcon = item.category ? AREA_ICONS[item.category] : null
  const categoryColor = item.category ?? 'accent'

  return (
    <div
      className="relative rounded-2xl px-4 py-3.5 transition-colors duration-80"
      style={{
        height: CARD_H,
        background: active ? 'rgb(var(--surface))' : 'rgb(var(--surface))',
        border: active
          ? '1px solid rgb(var(--border) / 0.18)'
          : '1px solid rgb(var(--border) / 0.10)',
        borderLeft: `4px solid rgb(var(--${categoryColor}))`,
        boxShadow: active
          ? `0 8px 32px rgb(0 0 0 / 0.15), 0 2px 8px rgb(var(--${categoryColor}) / 0.12)`
          : 'var(--shadow-card)',
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
          {AreaIcon ? (
            <AreaIcon className="w-4.5 h-4.5" strokeWidth={1.8} />
          ) : (
            <KindIcon className="w-4.5 h-4.5" strokeWidth={1.8} />
          )}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 text-xs text-muted">
            <span className="uppercase tracking-wider">
              {item.category ?? item.kind}
            </span>
            {item.time && (
              <>
                <span className="text-muted/40">·</span>
                <span className="text-muted tabular-nums">{item.time}</span>
              </>
            )}
          </div>
          <div
            className="text-md text-text leading-snug line-clamp-2"
            style={{ fontWeight: active ? 700 : 500 }}
          >
            {item.title}
          </div>
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

      {active && onCompleteTap && (
        <button
          type="button"
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
    </div>
  )
}

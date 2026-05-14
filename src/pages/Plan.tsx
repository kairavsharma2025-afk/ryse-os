import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Calendar as CalendarIcon,
  CalendarRange,
  LayoutGrid,
  Inbox as InboxIcon,
  StickyNote,
  type LucideIcon,
} from 'lucide-react'
import { WeekGrid } from '@/components/schedule/WeekGrid'
import { PlanDay } from '@/components/plan/PlanDay'
import { PlanMatrix } from '@/components/plan/PlanMatrix'
import { PlanInbox } from '@/components/plan/PlanInbox'
import { PlanNotes } from '@/components/plan/PlanNotes'
import { useTasks } from '@/stores/tasksStore'
import { useNotes } from '@/stores/notesStore'

type ViewId = 'day' | 'week' | 'matrix' | 'inbox' | 'notes'

interface ViewDef {
  id: ViewId
  label: string
  icon: LucideIcon
}

const VIEWS: ViewDef[] = [
  { id: 'day', label: 'Day', icon: CalendarIcon },
  { id: 'week', label: 'Week', icon: CalendarRange },
  { id: 'matrix', label: 'Matrix', icon: LayoutGrid },
  { id: 'inbox', label: 'Inbox', icon: InboxIcon },
  { id: 'notes', label: 'Notes', icon: StickyNote },
]

const isView = (s: string | null): s is ViewId =>
  s === 'day' || s === 'week' || s === 'matrix' || s === 'inbox' || s === 'notes'

/**
 * Plan tab — the consolidated home for Schedule + Inbox + Matrix + Notes.
 *
 *   Day     — vertical agenda for one day (events + reminders), focus tasks
 *             due today/overdue underneath.
 *   Week    — the existing Schedule grid (Mon-Sun, drag-add per day).
 *   Matrix  — Eisenhower 2x2 of all open tasks. Urgent auto-derives from
 *             dueDate ≤ today; Important is user-set (or P1 implies both).
 *   Inbox   — every open task plus a Waiting-On lane for delegated work.
 *   Notes   — quick-capture text snippets, pinnable.
 *
 * The active view is mirrored to ?v=… so deep links + back/forward work.
 */
export function Plan() {
  const [params, setParams] = useSearchParams()
  const initial = isView(params.get('v')) ? (params.get('v') as ViewId) : 'day'
  const [view, setView] = useState<ViewId>(initial)

  // Keep the URL in sync (replace so we don't pollute back/forward).
  useEffect(() => {
    if (params.get('v') !== view) {
      const next = new URLSearchParams(params)
      next.set('v', view)
      setParams(next, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view])

  // Inbox/Notes badge counts in the segmented control.
  const inboxCount = useTasks((s) => s.tasks.filter((t) => !t.completedAt && !t.assignedTo).length)
  const noteCount = useNotes((s) => s.notes.length)
  const badge = useMemo(
    () => ({ inbox: inboxCount, notes: noteCount }) as Partial<Record<ViewId, number>>,
    [inboxCount, noteCount]
  )

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-3xl tracking-wide">Plan</h1>
          <p className="text-sm text-muted mt-1">
            Time, tasks, decisions, capture — one tab.
          </p>
        </div>
      </header>

      {/* Segmented control. Scrolls horizontally on tiny screens. */}
      <div className="-mx-1 px-1 overflow-x-auto">
        <div
          role="tablist"
          aria-label="Plan view"
          className="inline-flex p-1 rounded-xl bg-surface2/50 border border-border/10 gap-0.5"
        >
          {VIEWS.map((v) => {
            const Icon = v.icon
            const active = view === v.id
            const count = badge[v.id]
            return (
              <button
                key={v.id}
                role="tab"
                aria-selected={active}
                onClick={() => setView(v.id)}
                className={`px-3 h-9 rounded-lg text-sm transition-colors duration-80 flex items-center gap-1.5 whitespace-nowrap ${
                  active
                    ? 'bg-accent text-white font-semibold shadow-card'
                    : 'text-muted hover:text-text'
                }`}
              >
                <Icon className="w-4 h-4" strokeWidth={active ? 2.2 : 1.8} />
                {v.label}
                {!!count && (
                  <span
                    className={`text-[10px] px-1 rounded-full font-bold ${
                      active ? 'bg-white/25 text-white' : 'bg-surface2 text-muted'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        {view === 'day' && <PlanDay />}
        {view === 'week' && <WeekGrid />}
        {view === 'matrix' && <PlanMatrix />}
        {view === 'inbox' && <PlanInbox />}
        {view === 'notes' && <PlanNotes />}
      </div>
    </div>
  )
}

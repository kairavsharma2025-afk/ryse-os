import { useMemo, useState } from 'react'
import { Bell, BellPlus, Bot, AlarmClock, CheckCircle2, Filter } from 'lucide-react'
import { addDays, isAfter, isBefore } from 'date-fns'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Empty } from '@/components/ui/Empty'
import { useReminders } from '@/stores/remindersStore'
import { useAssistant } from '@/stores/assistantStore'
import { useSettings } from '@/stores/settingsStore'
import { useGoals } from '@/stores/goalsStore'
import { AREA_LIST } from '@/data/areas'
import { AREA_ICONS } from '@/components/icons'
import { nextFireTime } from '@/engine/remindersEngine'
import { todayISO } from '@/engine/dates'
import { RemindersBanner } from '@/components/reminders/RemindersBanner'
import { ReminderRow } from '@/components/reminders/ReminderRow'
import { ReminderForm, type ReminderFormDraft } from '@/components/reminders/ReminderForm'
import type { AreaId, Reminder } from '@/types'

const prioRank = (r: Reminder): number => (r.priority === 'high' ? 0 : r.priority === 'low' ? 2 : 1)

type StatusTab = 'upcoming' | 'snoozed' | 'archive'

interface DecoratedReminder {
  r: Reminder
  next: Date | null
}

const STATUS: { id: StatusTab; label: string; icon: typeof Bell }[] = [
  { id: 'upcoming', label: 'Upcoming', icon: Bell },
  { id: 'snoozed', label: 'Snoozed', icon: AlarmClock },
  { id: 'archive', label: 'Done & past', icon: CheckCircle2 },
]

/**
 * Reminders page redesigned. Banner with stats up top, a status segmented
 * control (Upcoming / Snoozed / Done & past), an area chip filter, and the
 * upcoming list broken into time buckets — Today / Tomorrow / This week /
 * Later — so the list reads as a calendar rather than one long stack.
 */
export function Reminders() {
  const reminders = useReminders((s) => s.reminders)
  const addReminder = useReminders((s) => s.addReminder)
  const updateReminder = useReminders((s) => s.updateReminder)
  const openAssistant = useAssistant((s) => s.setPanelOpen)
  const quietHours = useSettings((s) => s.quietHours)
  const goals = useGoals((s) => s.goals)
  const linkableGoals = useMemo(
    () => goals.filter((g) => !g.archivedAt && !g.completedAt),
    [goals]
  )
  const goalById = useMemo(() => new Map(goals.map((g) => [g.id, g])), [goals])

  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Reminder | null>(null)
  const [statusTab, setStatusTab] = useState<StatusTab>('upcoming')
  const [areaFilter, setAreaFilter] = useState<AreaId | 'all'>('all')

  const { upcoming, snoozed, archived } = useMemo(() => {
    const now = new Date()
    const decorated: DecoratedReminder[] = reminders.map((r) => ({
      r,
      next: nextFireTime(r, now, quietHours),
    }))
    const upcoming = decorated
      .filter((x): x is { r: Reminder; next: Date } => x.next !== null && !x.r.snoozedUntil)
      .sort(
        (a, b) =>
          Math.floor(a.next.getTime() / 60_000) - Math.floor(b.next.getTime() / 60_000) ||
          prioRank(a.r) - prioRank(b.r)
      )
    const snoozed = decorated
      .filter((x): x is { r: Reminder; next: Date } => x.next !== null && !!x.r.snoozedUntil)
      .sort((a, b) => a.next.getTime() - b.next.getTime())
    const archived = decorated.filter((x) => x.next === null)
    return { upcoming, snoozed, archived }
  }, [reminders, quietHours])

  const tabCounts: Record<StatusTab, number> = {
    upcoming: upcoming.length,
    snoozed: snoozed.length,
    archive: archived.length,
  }

  const pool: DecoratedReminder[] =
    statusTab === 'upcoming' ? upcoming : statusTab === 'snoozed' ? snoozed : archived

  const filteredPool =
    areaFilter === 'all' ? pool : pool.filter((x) => x.r.category === areaFilter)

  const groups = useMemo(() => buildGroups(filteredPool, statusTab), [filteredPool, statusTab])

  const handleSave = (v: ReminderFormDraft, id?: string) => {
    if (id) {
      updateReminder(id, {
        title: v.title,
        date: v.date,
        time: v.time,
        repeat: v.repeat,
        category: v.category,
        notes: v.notes || undefined,
        priority: v.priority,
        goalId: v.goalId || undefined,
        lastFiredOn: undefined,
        snoozedUntil: undefined,
        done: false,
      })
    } else {
      addReminder({
        title: v.title,
        date: v.date,
        time: v.time,
        repeat: v.repeat,
        category: v.category,
        notes: v.notes || undefined,
        priority: v.priority,
        goalId: v.goalId || undefined,
        source: 'manual',
      })
    }
    setAdding(false)
    setEditing(null)
  }

  const isEmpty = reminders.length === 0
  const dueSoonNow = upcoming.filter(
    (x) => x.next.getTime() - Date.now() <= 2 * 3600_000 && x.next.getTime() >= Date.now()
  ).length

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-3xl tracking-wide">Reminders</h1>
          <p className="text-sm text-muted mt-1">
            {isEmpty
              ? 'Set the kind of pings you want — desktop or in-app.'
              : dueSoonNow > 0
                ? <>Desktop pings at the right moment. <span className="text-accent">{dueSoonNow} in the next 2 hours.</span></>
                : 'Desktop pings at the right moment. Nothing imminent.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => openAssistant(true)}>
            <Bot className="w-3.5 h-3.5" />
            Ask the assistant
          </Button>
          <Button size="sm" onClick={() => setAdding(true)}>
            <BellPlus className="w-3.5 h-3.5" />
            New reminder
          </Button>
        </div>
      </header>

      {!isEmpty && <RemindersBanner />}

      {isEmpty ? (
        <Empty
          icon={Bell}
          title="No reminders yet."
          body='Add one, or tell the Game Master "remind me to meditate at 7am every day."'
          cta={<Button onClick={() => setAdding(true)}>New reminder</Button>}
        />
      ) : (
        <>
          {/* Status segmented control */}
          <div className="-mx-1 px-1 overflow-x-auto">
            <div
              role="tablist"
              aria-label="Reminder status"
              className="inline-flex p-1 rounded-xl bg-surface2/50 border border-border/10 gap-0.5"
            >
              {STATUS.map((t) => {
                const Icon = t.icon
                const active = statusTab === t.id
                const count = tabCounts[t.id]
                return (
                  <button
                    key={t.id}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setStatusTab(t.id)}
                    className={`px-3 h-9 rounded-lg text-sm transition-colors duration-80 flex items-center gap-1.5 whitespace-nowrap ${
                      active
                        ? 'bg-accent text-white font-semibold shadow-card'
                        : 'text-muted hover:text-text'
                    }`}
                  >
                    <Icon className="w-4 h-4" strokeWidth={active ? 2.2 : 1.8} />
                    {t.label}
                    {count > 0 && (
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

          {/* Area chips */}
          <div className="flex gap-1.5 items-center flex-wrap">
            <span className="text-[10px] uppercase tracking-wider text-muted mr-1 inline-flex items-center gap-1">
              <Filter className="w-3 h-3" />
              Area
            </span>
            <AreaChip
              active={areaFilter === 'all'}
              onClick={() => setAreaFilter('all')}
              label="All"
            />
            {AREA_LIST.map((a) => {
              const Icon = AREA_ICONS[a.id]
              const count = pool.filter((x) => x.r.category === a.id).length
              if (count === 0 && areaFilter !== a.id) return null
              return (
                <AreaChip
                  key={a.id}
                  active={areaFilter === a.id}
                  onClick={() => setAreaFilter(a.id)}
                  label={a.name}
                  icon={Icon}
                  color={a.color}
                  count={count}
                />
              )
            })}
          </div>

          {filteredPool.length === 0 ? (
            <div className="rounded-2xl border border-border/10 bg-surface shadow-card p-6 text-center text-sm text-muted">
              {statusTab === 'snoozed'
                ? 'Nothing snoozed right now.'
                : statusTab === 'archive'
                  ? "Quiet hall. Past and done reminders will collect here."
                  : 'Nothing in this filter. Try another area or add a new reminder.'}
            </div>
          ) : (
            <div className="space-y-5">
              {groups.map((g) => (
                <section
                  key={g.id}
                  className="rounded-2xl border border-border/10 bg-surface shadow-card p-4"
                >
                  <div className="text-[10px] uppercase tracking-[0.28em] text-muted mb-3 px-1 flex items-center justify-between">
                    <span>{g.label}</span>
                    <span className="text-muted/70 tabular-nums">{g.items.length}</span>
                  </div>
                  <ul className="space-y-2">
                    {g.items.map(({ r, next }) => (
                      <ReminderRow
                        key={r.id}
                        reminder={r}
                        next={next}
                        goal={r.goalId ? goalById.get(r.goalId) : undefined}
                        onOpen={setEditing}
                      />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="New reminder" size="sm">
        <ReminderForm
          goals={linkableGoals}
          onSave={(v) => handleSave(v)}
          onCancel={() => setAdding(false)}
        />
      </Modal>
      <Modal open={editing !== null} onClose={() => setEditing(null)} title="Edit reminder" size="sm">
        {editing && (
          <ReminderForm
            initial={editing}
            goals={linkableGoals}
            onSave={(v) => handleSave(v, editing.id)}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  )
}

interface Group {
  id: string
  label: string
  items: DecoratedReminder[]
}

function buildGroups(pool: DecoratedReminder[], status: StatusTab): Group[] {
  if (status === 'archive') return [{ id: 'all', label: 'Done & past', items: pool }]
  if (status === 'snoozed') return [{ id: 'all', label: 'Snoozed', items: pool }]

  const now = new Date()
  const startOfToday = new Date(`${todayISO()}T00:00:00`)
  const endOfToday = new Date(`${todayISO()}T23:59:59`)
  const endOfTomorrow = new Date(endOfToday.getTime() + 86_400_000)
  const endOfWeek = addDays(startOfToday, 7)

  const today: DecoratedReminder[] = []
  const tomorrow: DecoratedReminder[] = []
  const week: DecoratedReminder[] = []
  const later: DecoratedReminder[] = []
  for (const x of pool) {
    const next = x.next!
    if (isBefore(next, endOfToday)) today.push(x)
    else if (isBefore(next, endOfTomorrow)) tomorrow.push(x)
    else if (isBefore(next, endOfWeek)) week.push(x)
    else if (isAfter(next, endOfWeek)) later.push(x)
  }
  const groups: Group[] = []
  if (today.length) groups.push({ id: 'today', label: 'Today', items: today })
  if (tomorrow.length) groups.push({ id: 'tomorrow', label: 'Tomorrow', items: tomorrow })
  if (week.length) groups.push({ id: 'week', label: 'This week', items: week })
  if (later.length) groups.push({ id: 'later', label: 'Later', items: later })
  // Silence unused-import warning by referencing `now` once.
  void now
  return groups
}

function AreaChip({
  active,
  onClick,
  label,
  icon: Icon,
  color,
  count,
}: {
  active: boolean
  onClick: () => void
  label: string
  icon?: typeof Bell
  color?: string
  count?: number
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 h-7 rounded-full text-xs border transition-colors duration-80 inline-flex items-center gap-1.5 ${
        active
          ? 'border-transparent text-white font-semibold'
          : 'border-border/40 bg-surface2/40 text-muted hover:text-text'
      }`}
      style={
        active && color
          ? { background: `rgb(var(--${color}))` }
          : active
            ? { background: 'rgb(var(--accent))' }
            : undefined
      }
    >
      {Icon && <Icon className="w-3.5 h-3.5" strokeWidth={1.8} />}
      {label}
      {count !== undefined && count > 0 && (
        <span className={`text-[10px] ${active ? 'opacity-90' : 'text-muted/60'}`}>{count}</span>
      )}
    </button>
  )
}


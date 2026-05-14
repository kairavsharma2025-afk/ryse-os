import { useMemo, useState, type FormEvent } from 'react'
import { differenceInCalendarDays, format } from 'date-fns'
import { Cake, Trash2, Plus, Heart } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Empty } from '@/components/ui/Empty'
import { useBirthdays } from '@/stores/birthdaysStore'
import type { Birthday } from '@/types'

const daysInMonth = (year: number, m1to12: number) => new Date(year, m1to12, 0).getDate()
const REF_YEAR = 2000
const monthDay = (b: { month: number; day: number }) =>
  new Date(REF_YEAR, b.month - 1, Math.min(b.day, daysInMonth(REF_YEAR, b.month)))

function nextOccurrence(b: Birthday, from: Date): Date {
  const todayMid = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const mk = (year: number) =>
    new Date(year, b.month - 1, Math.min(b.day, daysInMonth(year, b.month)))
  let d = mk(from.getFullYear())
  if (d < todayMid) d = mk(from.getFullYear() + 1)
  return d
}
function countdownLabel(b: Birthday): { label: string; daysAway: number } {
  const n = differenceInCalendarDays(nextOccurrence(b, new Date()), new Date())
  if (n <= 0) return { label: 'Today 🎉', daysAway: 0 }
  if (n === 1) return { label: 'Tomorrow', daysAway: 1 }
  if (n < 30) return { label: `in ${n} days`, daysAway: n }
  if (n < 60) return { label: `in ${Math.round(n / 7)} weeks`, daysAway: n }
  return { label: `in ${Math.round(n / 30)} months`, daysAway: n }
}

const toDateInput = (b: { month: number; day: number }) =>
  `${REF_YEAR}-${String(b.month).padStart(2, '0')}-${String(
    Math.min(b.day, daysInMonth(REF_YEAR, b.month))
  ).padStart(2, '0')}`
const fromDateInput = (s: string): { month: number; day: number } => {
  const parts = s.split('-').map(Number)
  return { month: parts[1] || 1, day: parts[2] || 1 }
}

const inputCls =
  'w-full bg-surface2 border border-border/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent/60 transition-colors'
const labelCls = 'text-[10px] uppercase tracking-[0.2em] text-muted mb-1.5 block'

function BirthdayForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Birthday
  onSave(v: { name: string; month: number; day: number; relation?: string }): void
  onCancel(): void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [date, setDate] = useState(initial ? toDateInput(initial) : `${REF_YEAR}-01-01`)
  const [relation, setRelation] = useState(initial?.relation ?? '')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const { month, day } = fromDateInput(date)
    onSave({ name: name.trim(), month, day, relation: relation.trim() || undefined })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className={labelCls}>Whose birthday?</label>
        <input
          className={inputCls}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Mom"
          autoFocus
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Date</label>
          <input
            type="date"
            className={inputCls}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <div className="text-[10px] text-muted/60 mt-1">Year is ignored — month &amp; day only.</div>
        </div>
        <div>
          <label className={labelCls}>Relation (optional)</label>
          <input
            className={inputCls}
            value={relation}
            onChange={(e) => setRelation(e.target.value)}
            placeholder="mom · best friend · …"
          />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="submit">Save</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

export function Birthdays() {
  const birthdays = useBirthdays((s) => s.birthdays)
  const addBirthday = useBirthdays((s) => s.addBirthday)
  const updateBirthday = useBirthdays((s) => s.updateBirthday)
  const deleteBirthday = useBirthdays((s) => s.deleteBirthday)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Birthday | null>(null)

  const sorted = useMemo(() => {
    const now = new Date()
    return [...birthdays]
      .map((b) => ({ b, ...countdownLabel(b), next: nextOccurrence(b, now) }))
      .sort((a, c) => a.next.getTime() - c.next.getTime())
  }, [birthdays])

  const next30 = sorted.filter((x) => x.daysAway <= 30)

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-3xl tracking-wide">Birthdays</h1>
          <p className="text-sm text-muted mt-1">
            The people who matter. Heads-up the day before, nudge on the day — never get caught off
            guard.
          </p>
        </div>
        <Button size="sm" onClick={() => setAdding(true)}>
          <Plus className="w-3.5 h-3.5" />
          Add birthday
        </Button>
      </header>

      {sorted.length === 0 ? (
        <Empty
          icon={Cake}
          title="No birthdays yet."
          body="Add your friends' and family's birthdays — Ryse will remind you so you never miss one."
          cta={<Button onClick={() => setAdding(true)}>Add a birthday</Button>}
        />
      ) : (
        <>
          {next30.length > 0 && (
            <section>
              <div className="text-[10px] uppercase tracking-[0.28em] text-muted mb-2 px-1">
                Next 30 days
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {next30.map(({ b, label, daysAway }) => {
                  const today = daysAway === 0
                  return (
                    <button
                      key={b.id}
                      onClick={() => setEditing(b)}
                      className={`text-left rounded-2xl shadow-card border p-4 transition-colors ${
                        today
                          ? 'border-accent/50 bg-accent/[0.06]'
                          : 'border-border/10 bg-surface hover:bg-surface2/40'
                      }`}
                      style={today ? { boxShadow: '0 0 18px rgb(var(--accent) / 0.25)' } : undefined}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            today
                              ? 'bg-accent text-white'
                              : 'bg-accent/10 border border-accent/20 text-accent'
                          }`}
                        >
                          {today ? <Heart className="w-4 h-4" strokeWidth={2.2} /> : <Cake className="w-4 h-4" />}
                        </span>
                        <div className="font-display text-lg tabular-nums">
                          {format(monthDay(b), 'MMM d')}
                        </div>
                      </div>
                      <div className="text-sm text-text truncate">
                        {b.name}
                      </div>
                      {b.relation && (
                        <div className="text-[11px] text-muted truncate">{b.relation}</div>
                      )}
                      <div className="text-[11px] mt-2 text-accent2/90 tabular-nums">{label}</div>
                    </button>
                  )
                })}
              </div>
            </section>
          )}

          <section className="rounded-2xl bg-surface border border-border/10 shadow-card p-4">
            <div className="text-[10px] uppercase tracking-[0.28em] text-muted mb-3 px-1">
              All birthdays · {sorted.length}
            </div>
            <ul className="space-y-2">
              {sorted.map(({ b, label }) => (
                <li
                  key={b.id}
                  className="flex items-center gap-3 rounded-xl border border-border/40 bg-surface2/30 px-3 py-2.5"
                >
                  <span className="shrink-0 w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 text-accent flex items-center justify-center">
                    <Cake className="w-4 h-4" />
                  </span>
                  <button onClick={() => setEditing(b)} className="min-w-0 flex-1 text-left">
                    <div className="text-sm text-text truncate">
                      {b.name}
                      {b.relation && <span className="text-muted"> · {b.relation}</span>}
                    </div>
                    <div className="text-[11px] text-muted">
                      {format(monthDay(b), 'MMMM d')} ·{' '}
                      <span className="text-accent2/80">{label}</span>
                    </div>
                  </button>
                  <button
                    onClick={() => deleteBirthday(b.id)}
                    className="shrink-0 p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-surface2/50 transition-colors"
                    title="Delete"
                    aria-label="Delete birthday"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Add a birthday" size="sm">
        <BirthdayForm
          onSave={(v) => {
            addBirthday(v)
            setAdding(false)
          }}
          onCancel={() => setAdding(false)}
        />
      </Modal>
      <Modal open={editing !== null} onClose={() => setEditing(null)} title="Edit birthday" size="sm">
        {editing && (
          <BirthdayForm
            initial={editing}
            onSave={(v) => {
              updateBirthday(editing.id, {
                ...v,
                lastNotifiedOn: undefined,
                lastHeraldedOn: undefined,
              })
              setEditing(null)
            }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  )
}

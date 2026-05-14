import { useState } from 'react'
import { Plus, Check, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useGoals } from '@/stores/goalsStore'
import { AREAS } from '@/data/areas'
import type { Goal } from '@/types'

/**
 * Milestone breakdown for a goal. Header shows N/M complete + progress bar
 * keyed to the goal's area colour. Body is a checkbox list with delete.
 * Footer is an inline add-new-input.
 */
export function GoalMilestones({ goal }: { goal: Goal }) {
  const addMilestone = useGoals((s) => s.addMilestone)
  const toggleMilestone = useGoals((s) => s.toggleMilestone)
  const updateGoal = useGoals((s) => s.updateGoal)

  const [title, setTitle] = useState('')

  const area = AREAS[goal.area]
  const total = goal.milestones.length
  const done = goal.milestones.filter((m) => m.completedAt).length
  const pct = total === 0 ? 0 : (done / total) * 100

  const submit = () => {
    if (!title.trim()) return
    addMilestone(goal.id, title.trim())
    setTitle('')
  }

  const removeMilestone = (mid: string) => {
    updateGoal(goal.id, {
      milestones: goal.milestones.filter((m) => m.id !== mid),
    })
  }

  return (
    <div className="rounded-2xl bg-surface border border-border/10 shadow-card p-5">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-[0.28em] text-muted">Milestones</div>
          <div className="font-display text-lg">
            {total === 0 ? (
              'Break it into pieces.'
            ) : (
              <>
                <span className="tabular-nums">{done}</span> of{' '}
                <span className="tabular-nums">{total}</span> complete
                {done === total && <span className="text-success"> · all done</span>}
              </>
            )}
          </div>
        </div>
        {total > 0 && (
          <div className="text-[11px] text-muted tabular-nums">
            +150 XP each
          </div>
        )}
      </div>

      {total > 0 && (
        <div className="h-1.5 rounded-full bg-surface2/60 border border-border/30 overflow-hidden mb-4">
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, rgb(var(--${area.color})), rgb(var(--accent2)))`,
            }}
          />
        </div>
      )}

      {total === 0 ? (
        <p className="text-sm text-muted mb-3">
          Each milestone is a checkpoint along the path. Hitting one drops +150 XP and counts
          toward area mastery.
        </p>
      ) : (
        <ul className="space-y-1.5 mb-3">
          {goal.milestones.map((m) => {
            const isDone = !!m.completedAt
            return (
              <li
                key={m.id}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
                  isDone
                    ? 'border-border/30 bg-surface2/20 opacity-60'
                    : 'border-border/40 bg-surface2/30 hover:border-accent/30'
                }`}
              >
                <button
                  onClick={() => toggleMilestone(goal.id, m.id)}
                  className={`shrink-0 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] transition-colors ${
                    isDone
                      ? 'bg-accent border-accent text-white'
                      : 'border-border text-transparent hover:border-accent'
                  }`}
                  aria-label={isDone ? 'Mark not done' : 'Mark done'}
                >
                  <Check className="w-3 h-3" strokeWidth={2.5} />
                </button>
                <span
                  className={`text-sm flex-1 min-w-0 truncate ${
                    isDone ? 'line-through text-muted' : 'text-text'
                  }`}
                >
                  {m.title}
                </span>
                <button
                  onClick={() => removeMilestone(m.id)}
                  className="shrink-0 p-1.5 rounded-md text-muted hover:text-red-400 hover:bg-surface2/50"
                  aria-label="Remove milestone"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <div className="flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
          }}
          placeholder="Add a milestone…"
          className="flex-1 bg-surface2 border border-border/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
        />
        <Button size="sm" onClick={submit} disabled={!title.trim()}>
          <Plus className="w-3.5 h-3.5" strokeWidth={2.2} />
          Add
        </Button>
      </div>
    </div>
  )
}

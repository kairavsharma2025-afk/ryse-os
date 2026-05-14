import { useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { ChevronLeft, Pencil, Check, Archive as ArchiveIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { GoalForm } from '@/components/goals/GoalForm'
import { GoalHero } from '@/components/goals/detail/GoalHero'
import { GoalLogPanel } from '@/components/goals/detail/GoalLogPanel'
import { GoalMilestones } from '@/components/goals/detail/GoalMilestones'
import { GoalLogTimeline } from '@/components/goals/detail/GoalLogTimeline'
import { useGoals } from '@/stores/goalsStore'
import { actionCompleteGoal } from '@/engine/gameLoop'

/**
 * Redesigned goal detail page. Composes the four detail-only components
 * over the same goalsStore + gameLoop wiring as before.
 *
 *   GoalHero          — title, status pills, streak, 4-stat tiles
 *   GoalLogPanel      — standard log card OR boss attack panel
 *   GoalMilestones    — milestone list with progress bar + add input
 *   GoalLogTimeline   — reverse-chronological logs with relative dates
 *   Footer            — edit, mark complete (if not already), archive
 */
export function GoalDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const goal = useGoals((s) => s.goalById(id ?? ''))
  const archive = useGoals((s) => s.archiveGoal)
  const [editing, setEditing] = useState(false)

  if (!goal) {
    return (
      <div className="text-center py-16">
        <div className="text-muted text-sm">Goal not found.</div>
        <Button className="mt-4" onClick={() => nav('/goals')}>
          Back to goals
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <button
        onClick={() => nav('/goals')}
        className="inline-flex items-center gap-1 text-xs text-muted hover:text-text transition-colors"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        Goals
      </button>

      <GoalHero goal={goal} />

      {!goal.completedAt && <GoalLogPanel goal={goal} />}

      <GoalMilestones goal={goal} />

      <GoalLogTimeline goal={goal} />

      <div className="flex flex-wrap gap-2 pt-2">
        <Button variant="ghost" onClick={() => setEditing(true)}>
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </Button>
        {!goal.completedAt && (
          <Button variant="ghost" onClick={() => actionCompleteGoal(goal.id)}>
            <Check className="w-3.5 h-3.5" strokeWidth={2.4} />
            Mark complete
          </Button>
        )}
        {!goal.archivedAt && (
          <Button
            variant="subtle"
            className="ml-auto"
            onClick={() => {
              archive(goal.id)
              nav('/goals')
            }}
          >
            <ArchiveIcon className="w-3.5 h-3.5" />
            Archive
          </Button>
        )}
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} title="Edit goal">
        <GoalForm goal={goal} onDone={() => setEditing(false)} />
      </Modal>
    </div>
  )
}

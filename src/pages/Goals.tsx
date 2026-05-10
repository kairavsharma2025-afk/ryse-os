import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Pill } from '@/components/ui/Pill'
import { GoalForm } from '@/components/goals/GoalForm'
import { useGoals } from '@/stores/goalsStore'
import { AREAS, AREA_LIST } from '@/data/areas'
import type { AreaId } from '@/types'
import { streakVisualState } from '@/engine/streakEngine'
import { Empty } from '@/components/ui/Empty'
import { AREA_ICONS, STREAK_ICONS } from '@/components/icons'
import { Skull } from 'lucide-react'

export function Goals() {
  const goals = useGoals((s) =>
    [...s.goals]
      .filter((g) => !g.archivedAt)
      .sort((a, b) => a.priority - b.priority || a.createdAt.localeCompare(b.createdAt))
  )
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState<AreaId | 'all'>('all')

  const filtered = filter === 'all' ? goals : goals.filter((g) => g.area === filter)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl tracking-wide">Goals</h1>
          <p className="text-muted text-sm">{goals.length} active</p>
        </div>
        <Button onClick={() => setOpen(true)}>+ New Goal</Button>
      </div>

      <div className="flex gap-1.5 mb-6 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-2.5 py-1 rounded-full text-xs border ${
            filter === 'all'
              ? 'border-accent text-accent bg-accent/10'
              : 'border-border text-muted'
          }`}
        >
          All
        </button>
        {AREA_LIST.map((a) => {
          const Icon = AREA_ICONS[a.id]
          return (
            <button
              key={a.id}
              onClick={() => setFilter(a.id)}
              className={`px-2.5 py-1 rounded-full text-xs border transition inline-flex items-center gap-1.5 ${
                filter === a.id
                  ? 'border-accent text-accent bg-accent/10'
                  : 'border-border text-muted hover:text-text'
              }`}
            >
              <Icon className="w-3.5 h-3.5" strokeWidth={1.8} />
              {a.name}
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <Empty
          emoji="·"
          title={filter === 'all' ? 'No goals yet.' : 'Nothing here.'}
          body="A goal is a quest. A quest is a rope you throw at the future."
          cta={<Button onClick={() => setOpen(true)}>Create one</Button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((g) => {
            const area = AREAS[g.area]
            const AreaIcon = AREA_ICONS[area.id]
            const state = streakVisualState(g.currentStreak)
            const StreakIcon = STREAK_ICONS[state]
            return (
              <Link key={g.id} to={`/goals/${g.id}`} className="group">
                <Card className="p-4 hover:border-accent/40 transition relative overflow-hidden">
                  <div
                    aria-hidden
                    className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-30 blur-2xl"
                    style={{ background: `rgb(var(--${area.color}))` }}
                  />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-1">
                      <Pill color={area.color}>
                        <span className="inline-flex items-center gap-1">
                          <AreaIcon className="w-3 h-3" strokeWidth={1.8} />
                          {area.name}
                        </span>
                      </Pill>
                      {g.isBossBattle && (
                        <Pill color="rare">
                          <span className="inline-flex items-center gap-1">
                            <Skull className="w-3 h-3" strokeWidth={1.8} />
                            boss
                          </span>
                        </Pill>
                      )}
                    </div>
                    <div className="font-display text-lg leading-tight mb-2 line-clamp-2">
                      {g.title}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] text-muted">
                        {g.logs.length} logs · {g.milestones.filter((m) => m.completedAt).length}/
                        {g.milestones.length} milestones
                      </div>
                      <div
                        className={`text-sm flex items-center gap-1 ${
                          state === 'legendary' || state === 'inferno'
                            ? 'text-legendary'
                            : state === 'burning'
                              ? 'text-amber-400'
                              : 'text-muted'
                        }`}
                      >
                        {StreakIcon && <StreakIcon className="w-3.5 h-3.5" strokeWidth={2} />}
                        {g.currentStreak}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New Goal">
        <GoalForm onDone={() => setOpen(false)} />
      </Modal>
    </div>
  )
}

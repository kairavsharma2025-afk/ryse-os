import { useMemo, useState } from 'react'
import {
  Filter,
  Plus,
  Skull,
  Trophy,
  Archive as ArchiveIcon,
  Target,
  ArrowUpDown,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Empty } from '@/components/ui/Empty'
import { GoalForm } from '@/components/goals/GoalForm'
import { GoalCard } from '@/components/goals/GoalCard'
import { GoalsBanner, isAtRisk, isNearVictory } from '@/components/goals/GoalsBanner'
import { useGoals } from '@/stores/goalsStore'
import { AREA_LIST, AREAS } from '@/data/areas'
import { AREA_ICONS } from '@/components/icons'
import type { AreaId, Goal } from '@/types'

type StatusFilter = 'active' | 'bosses' | 'near' | 'archived'
type SortMode = 'priority' | 'momentum' | 'streak' | 'area'

const STATUS_TABS: { id: StatusFilter; label: string; icon: typeof Target }[] = [
  { id: 'active', label: 'Active', icon: Target },
  { id: 'bosses', label: 'Bosses', icon: Skull },
  { id: 'near', label: 'Near victory', icon: Trophy },
  { id: 'archived', label: 'Archived', icon: ArchiveIcon },
]

const SORT_LABEL: Record<SortMode, string> = {
  priority: 'Priority',
  momentum: 'Momentum',
  streak: 'Streak',
  area: 'Area',
}

/**
 * Goals tab — portfolio view of every goal the player is running.
 *
 *   • GoalsBanner at the top: at-a-glance pulse (active count, longest fire,
 *     bosses, near-victory, weekly log volume, shields available).
 *   • Status segments (Active / Bosses / Near / Archived) determine the
 *     baseline pool.
 *   • Area chips filter further by life area.
 *   • Sort menu re-orders the pool — Priority (default), Momentum (recent
 *     log date), Streak (current streak), or Area (grouped headers).
 */
export function Goals() {
  const goals = useGoals((s) => s.goals)
  const [open, setOpen] = useState(false)
  const [statusTab, setStatusTab] = useState<StatusFilter>('active')
  const [areaFilter, setAreaFilter] = useState<AreaId | 'all'>('all')
  const [sortMode, setSortMode] = useState<SortMode>('priority')

  // Status pool — applied before area filter.
  const pool = useMemo(() => {
    return goals.filter((g) => {
      if (statusTab === 'archived') return !!g.archivedAt
      if (g.archivedAt) return false
      if (statusTab === 'active') return !g.completedAt
      if (statusTab === 'bosses')
        return (
          !g.completedAt &&
          g.isBossBattle &&
          g.bossBattleConfig &&
          !g.bossBattleConfig.defeated
        )
      if (statusTab === 'near') return !g.completedAt && isNearVictory(g)
      return true
    })
  }, [goals, statusTab])

  const tabCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      active: 0,
      bosses: 0,
      near: 0,
      archived: 0,
    }
    for (const g of goals) {
      if (g.archivedAt) counts.archived++
      else {
        if (!g.completedAt) counts.active++
        if (
          !g.completedAt &&
          g.isBossBattle &&
          g.bossBattleConfig &&
          !g.bossBattleConfig.defeated
        )
          counts.bosses++
        if (!g.completedAt && isNearVictory(g)) counts.near++
      }
    }
    return counts
  }, [goals])

  const filtered = useMemo(() => {
    const list = areaFilter === 'all' ? pool : pool.filter((g) => g.area === areaFilter)
    return [...list].sort((a, b) => byMode(sortMode, a, b))
  }, [pool, areaFilter, sortMode])

  // Group-by-area when sortMode === 'area'. Otherwise single flat grid.
  const grouped = useMemo(() => {
    if (sortMode !== 'area') return null
    const map = new Map<AreaId, Goal[]>()
    for (const g of filtered) {
      const arr = map.get(g.area) ?? []
      arr.push(g)
      map.set(g.area, arr)
    }
    return Array.from(map.entries())
  }, [filtered, sortMode])

  const atRiskCount = useMemo(
    () => goals.filter((g) => !g.archivedAt && !g.completedAt && isAtRisk(g)).length,
    [goals]
  )

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-3xl tracking-wide">Goals</h1>
          <p className="text-sm text-muted mt-1">
            Every quest you've thrown at the future.
            {atRiskCount > 0 && (
              <span className="text-amber-400"> {atRiskCount} at risk — log to save them.</span>
            )}
          </p>
        </div>
        <Button onClick={() => setOpen(true)} size="md">
          <Plus className="w-3.5 h-3.5" strokeWidth={2.2} />
          New goal
        </Button>
      </header>

      <GoalsBanner />

      {/* Status segmented control. */}
      <div className="-mx-1 px-1 overflow-x-auto">
        <div
          role="tablist"
          aria-label="Goal status"
          className="inline-flex p-1 rounded-xl bg-surface2/50 border border-border/10 gap-0.5"
        >
          {STATUS_TABS.map((t) => {
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

      {/* Area chips + sort menu. */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-1.5 flex-wrap items-center min-w-0 flex-1">
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
            const count = pool.filter((g) => g.area === a.id).length
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
        <SortSelect mode={sortMode} onChange={setSortMode} />
      </div>

      {/* The grid (or grouped sections). */}
      {filtered.length === 0 ? (
        <EmptyForState state={statusTab} onAdd={() => setOpen(true)} hasGoals={goals.length > 0} />
      ) : grouped ? (
        <div className="space-y-6">
          {grouped.map(([area, list]) => (
            <section key={area}>
              <div className="text-[10px] uppercase tracking-[0.28em] text-muted mb-2 px-1 flex items-center gap-1.5">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ background: `rgb(var(--${AREAS[area].color}))` }}
                />
                {AREAS[area].name} · {list.length}
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {list.map((g) => (
                  <GoalCard key={g.id} goal={g} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filtered.map((g) => (
            <GoalCard key={g.id} goal={g} />
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New Goal">
        <GoalForm onDone={() => setOpen(false)} />
      </Modal>
    </div>
  )
}

function byMode(mode: SortMode, a: Goal, b: Goal): number {
  if (mode === 'priority') {
    return a.priority - b.priority || a.createdAt.localeCompare(b.createdAt)
  }
  if (mode === 'streak') {
    return b.currentStreak - a.currentStreak || a.priority - b.priority
  }
  if (mode === 'momentum') {
    // Most recently logged first; never-logged sinks.
    const aLast = a.lastLoggedAt ?? ''
    const bLast = b.lastLoggedAt ?? ''
    return bLast.localeCompare(aLast)
  }
  // area: alpha by area name then priority
  return AREAS[a.area].name.localeCompare(AREAS[b.area].name) || a.priority - b.priority
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
  icon?: typeof Target
  color?: string
  count?: number
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 h-7 rounded-full text-xs border transition-colors duration-80 inline-flex items-center gap-1.5 ${
        active
          ? 'border-transparent text-white font-semibold'
          : 'border-border bg-surface2/40 text-muted hover:text-text'
      }`}
      style={active && color ? { background: `rgb(var(--${color}))` } : active ? { background: 'rgb(var(--accent))' } : undefined}
    >
      {Icon && <Icon className="w-3.5 h-3.5" strokeWidth={1.8} />}
      {label}
      {count !== undefined && count > 0 && (
        <span className={`text-[10px] ${active ? 'opacity-90' : 'text-muted/60'}`}>{count}</span>
      )}
    </button>
  )
}

function SortSelect({ mode, onChange }: { mode: SortMode; onChange: (m: SortMode) => void }) {
  return (
    <label className="inline-flex items-center gap-1.5 text-xs text-muted shrink-0">
      <ArrowUpDown className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Sort</span>
      <select
        value={mode}
        onChange={(e) => onChange(e.target.value as SortMode)}
        className="bg-surface2 border border-border/40 rounded-md px-2 py-1 text-xs text-text focus:outline-none focus:border-accent"
      >
        {(['priority', 'momentum', 'streak', 'area'] as SortMode[]).map((m) => (
          <option key={m} value={m}>
            {SORT_LABEL[m]}
          </option>
        ))}
      </select>
    </label>
  )
}

function EmptyForState({
  state,
  onAdd,
  hasGoals,
}: {
  state: StatusFilter
  onAdd: () => void
  hasGoals: boolean
}) {
  if (state === 'active' && !hasGoals) {
    return (
      <Empty
        icon={Target}
        title="No goals yet."
        body="A goal is a quest. A quest is a rope you throw at the future."
        cta={<Button onClick={onAdd}>Create one</Button>}
      />
    )
  }
  const copy: Record<StatusFilter, { title: string; body: string }> = {
    active: { title: 'Nothing here.', body: 'Try a different area filter, or add a new goal.' },
    bosses: {
      title: 'No bosses today.',
      body: 'Promote a goal to a boss battle when something needs a fight — finite HP, daily attacks.',
    },
    near: {
      title: 'Nothing near victory yet.',
      body: 'A goal lands here when it crosses 75% milestone completion or 75% boss HP dealt.',
    },
    archived: { title: 'No archive.', body: 'Archived goals fall here when you put them aside.' },
  }
  const c = copy[state]
  return <Empty icon={Target} title={c.title} body={c.body} />
}

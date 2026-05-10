import { useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Pill } from '@/components/ui/Pill'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { GoalForm } from '@/components/goals/GoalForm'
import { useGoals } from '@/stores/goalsStore'
import { AREAS } from '@/data/areas'
import { actionLogGoal, actionCompleteGoal } from '@/engine/gameLoop'
import { streakVisualState } from '@/engine/streakEngine'
import { todayISO } from '@/engine/dates'
import type { BossBattleConfig } from '@/types'
import { AREA_ICONS, STREAK_ICONS, Star, Check } from '@/components/icons'
import { Skull } from 'lucide-react'

export function GoalDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const goal = useGoals((s) => s.goalById(id ?? ''))
  const archive = useGoals((s) => s.archiveGoal)
  const addMilestone = useGoals((s) => s.addMilestone)
  const toggleMilestone = useGoals((s) => s.toggleMilestone)

  const [editing, setEditing] = useState(false)
  const [logNote, setLogNote] = useState('')
  const [milestoneTitle, setMilestoneTitle] = useState('')
  const [logging, setLogging] = useState(false)
  const [logFlash, setLogFlash] = useState<{ xp: number; bossDmg?: number } | null>(null)

  if (!goal) {
    return (
      <div className="text-center py-12">
        <div className="text-muted">Goal not found.</div>
        <Button className="mt-4" onClick={() => nav('/goals')}>
          Back
        </Button>
      </div>
    )
  }

  const area = AREAS[goal.area]
  const AreaIcon = AREA_ICONS[area.id]
  const today = todayISO()
  const loggedToday = goal.lastLoggedAt?.slice(0, 10) === today
  const state = streakVisualState(goal.currentStreak)
  const StreakIcon = STREAK_ICONS[state]

  const handleLog = () => {
    setLogging(true)
    const r = actionLogGoal(goal.id, { note: logNote })
    setLogFlash({ xp: r.xp, bossDmg: r.bossDamageDealt })
    setTimeout(() => setLogFlash(null), 1500)
    setLogNote('')
    setTimeout(() => setLogging(false), 600)
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => nav('/goals')}
        className="text-xs text-muted hover:text-text"
      >
        ← Goals
      </button>

      <div>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Pill color={area.color}>
            <span className="inline-flex items-center gap-1">
              <AreaIcon className="w-3 h-3" strokeWidth={1.8} />
              {area.name}
            </span>
          </Pill>
          <Pill color="muted">{goal.questType}</Pill>
          <Pill color="accent">
            <span className="inline-flex items-center gap-1">
              <Star className="w-3 h-3" strokeWidth={1.8} fill="currentColor" />
              {goal.difficultyRating}
            </span>
          </Pill>
          {goal.isBossBattle && (
            <Pill color="relationships">
              <span className="inline-flex items-center gap-1">
                <Skull className="w-3 h-3" strokeWidth={1.8} />
                boss
              </span>
            </Pill>
          )}
          {goal.completedAt && <Pill color="health">complete</Pill>}
        </div>
        <h1 className="font-display text-4xl tracking-wide">{goal.title}</h1>
        {goal.description && (
          <p className="text-muted mt-2 max-w-2xl leading-relaxed">{goal.description}</p>
        )}
      </div>

      {goal.isBossBattle && goal.bossBattleConfig && !goal.bossBattleConfig.defeated && (
        <BossPanel
          cfg={goal.bossBattleConfig}
          onAttack={handleLog}
          loggedToday={loggedToday}
          logging={logging}
          flash={logFlash}
        />
      )}

      {!goal.isBossBattle && (
        <Card className="p-5 relative overflow-hidden">
          <AnimatePresence>
            {logFlash && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: -32 }}
                exit={{ opacity: 0 }}
                className="absolute right-6 top-6 text-accent2 font-display text-2xl pointer-events-none"
              >
                +{logFlash.xp} XP
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted">
                Streak {state}
              </div>
              <div
                className="font-display text-4xl flex items-center gap-2"
                style={{
                  color:
                    state === 'legendary'
                      ? 'rgb(var(--legendary))'
                      : state === 'inferno' || state === 'burning'
                        ? 'rgb(234 88 12)'
                        : 'rgb(var(--text))',
                }}
              >
                {StreakIcon && <StreakIcon className="w-7 h-7" strokeWidth={1.8} />}
                {goal.currentStreak}
                <span className="text-base text-muted ml-2">
                  / longest {goal.longestStreak}
                </span>
              </div>
            </div>
            <Button onClick={handleLog} disabled={loggedToday} size="lg">
              {loggedToday ? (
                <span className="inline-flex items-center gap-1.5">
                  <Check className="w-4 h-4" strokeWidth={2.5} /> Logged today
                </span>
              ) : (
                'Log progress'
              )}
            </Button>
          </div>
          <input
            value={logNote}
            onChange={(e) => setLogNote(e.target.value)}
            placeholder="Note (optional)"
            className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm"
          />
        </Card>
      )}

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl tracking-wide">Milestones</h3>
        </div>
        <div className="space-y-2 mb-3">
          {goal.milestones.length === 0 && (
            <div className="text-xs text-muted">
              Break the goal into milestones. Each one = +150 XP when complete.
            </div>
          )}
          {goal.milestones.map((m) => (
            <label
              key={m.id}
              className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-surface2/40"
            >
              <input
                type="checkbox"
                checked={!!m.completedAt}
                onChange={() => toggleMilestone(goal.id, m.id)}
              />
              <span
                className={`text-sm ${m.completedAt ? 'line-through text-muted' : 'text-text'}`}
              >
                {m.title}
              </span>
            </label>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={milestoneTitle}
            onChange={(e) => setMilestoneTitle(e.target.value)}
            placeholder="Add a milestone…"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && milestoneTitle.trim()) {
                addMilestone(goal.id, milestoneTitle.trim())
                setMilestoneTitle('')
              }
            }}
            className="flex-1 bg-surface2 border border-border rounded-lg px-3 py-2 text-sm"
          />
          <Button
            size="sm"
            onClick={() => {
              if (milestoneTitle.trim()) {
                addMilestone(goal.id, milestoneTitle.trim())
                setMilestoneTitle('')
              }
            }}
          >
            Add
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-display text-xl tracking-wide mb-3">Recent logs</h3>
        {goal.logs.length === 0 ? (
          <div className="text-xs text-muted">No logs yet.</div>
        ) : (
          <div className="space-y-2">
            {[...goal.logs]
              .reverse()
              .slice(0, 14)
              .map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between text-xs p-2 rounded bg-surface2/40 border border-border/40"
                >
                  <span className="text-muted">{l.date.slice(0, 10)}</span>
                  <span className="text-text/80 truncate flex-1 mx-3">{l.note}</span>
                  <span className="text-accent">+{l.xpAwarded} XP</span>
                </div>
              ))}
          </div>
        )}
      </Card>

      <div className="flex gap-3">
        <Button variant="ghost" onClick={() => setEditing(true)}>
          Edit
        </Button>
        {!goal.completedAt && (
          <Button
            variant="ghost"
            onClick={() => actionCompleteGoal(goal.id)}
          >
            Mark complete
          </Button>
        )}
        <Button
          variant="subtle"
          className="ml-auto"
          onClick={() => {
            archive(goal.id)
            nav('/goals')
          }}
        >
          Archive
        </Button>
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} title="Edit Goal">
        <GoalForm goal={goal} onDone={() => setEditing(false)} />
      </Modal>
    </div>
  )
}

function BossPanel({
  cfg,
  onAttack,
  loggedToday,
  logging,
  flash,
}: {
  cfg: BossBattleConfig
  onAttack: () => void
  loggedToday: boolean
  logging: boolean
  flash: { xp: number; bossDmg?: number } | null
}) {
  const pct = cfg.bossHp === 0 ? 0 : cfg.currentHp / cfg.bossHp
  return (
    <Card className="p-6 border-red-500/40 bg-gradient-to-br from-red-950/20 to-surface relative overflow-hidden">
      <motion.div
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 2.4, repeat: Infinity }}
        className="absolute -top-16 -right-16 w-64 h-64 bg-red-600/30 rounded-full blur-3xl"
      />
      <div className="relative">
        <div className="text-[10px] uppercase tracking-[0.3em] text-red-400/70 mb-1">
          ─── boss battle ───
        </div>
        <div className="font-display text-4xl tracking-wide">{cfg.bossName}</div>
        <p className="text-muted text-sm mt-2 leading-relaxed max-w-xl">
          {cfg.bossDescription}
        </p>

        <div className="mt-5">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-red-400">Boss HP</span>
            <span className="font-mono">
              {cfg.currentHp} / {cfg.bossHp}
            </span>
          </div>
          <ProgressBar
            value={cfg.currentHp}
            max={cfg.bossHp}
            colorVar="relationships"
            height={12}
            glow
          />
        </div>

        <div className="mt-6 flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.94 }}
            disabled={loggedToday || logging}
            onClick={onAttack}
            className="px-6 py-3 rounded-xl bg-red-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-glow relative overflow-hidden inline-flex items-center gap-2"
            animate={
              logging
                ? { x: [-3, 3, -2, 2, 0] }
                : {}
            }
          >
            <Skull className="w-4 h-4" strokeWidth={2} />
            {loggedToday ? 'Already struck today' : `Attack (${cfg.damagePerLog} dmg)`}
          </motion.button>
          <AnimatePresence>
            {flash && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: -10 }}
                exit={{ opacity: 0 }}
                className="text-red-300 font-display text-xl"
              >
                -{flash.bossDmg ?? cfg.damagePerLog} HP · +{flash.xp} XP
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="mt-3 text-xs text-muted">
          Miss a day and the boss recovers. {cfg.bossCounterattack}
        </div>

        <div className="text-xs text-muted mt-2">
          Damage per log: {cfg.damagePerLog} · Estimated days to victory: {Math.ceil(pct * cfg.bossHp / cfg.damagePerLog)}
        </div>
      </div>
    </Card>
  )
}

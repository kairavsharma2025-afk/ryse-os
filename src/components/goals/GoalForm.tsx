import { useState } from 'react'
import { Button } from '../ui/Button'
import type { AreaId, BossBattleConfig, Goal, QuestType } from '@/types'
import { AREA_LIST } from '@/data/areas'
import { useGoals } from '@/stores/goalsStore'
import { suggestBoss } from '@/data/bossNames'
import { AREA_ICONS, Star } from '@/components/icons'
import { Skull } from 'lucide-react'

interface Props {
  goal?: Goal
  onDone: () => void
}

export function GoalForm({ goal, onDone }: Props) {
  const addGoal = useGoals((s) => s.addGoal)
  const updateGoal = useGoals((s) => s.updateGoal)
  const enableBoss = useGoals((s) => s.enableBoss)

  const [area, setArea] = useState<AreaId>(goal?.area ?? 'career')
  const [title, setTitle] = useState(goal?.title ?? '')
  const [description, setDescription] = useState(goal?.description ?? '')
  const [questType, setQuestType] = useState<QuestType>(goal?.questType ?? 'daily')
  const [difficulty, setDifficulty] = useState<1 | 2 | 3 | 4 | 5>(goal?.difficultyRating ?? 3)
  const [priority, setPriority] = useState<1 | 2 | 3>(goal?.priority ?? 2)
  const [isBoss, setIsBoss] = useState(goal?.isBossBattle ?? false)
  const [bossName, setBossName] = useState(goal?.bossBattleConfig?.bossName ?? '')

  const submit = () => {
    if (!title.trim()) return
    if (goal) {
      updateGoal(goal.id, {
        area,
        title: title.trim(),
        description,
        questType,
        difficultyRating: difficulty,
        priority,
      })
      if (isBoss) {
        const suggestion = suggestBoss(title, area)
        const cfg: BossBattleConfig = {
          bossName: bossName.trim() || suggestion.name,
          bossDescription: suggestion.description,
          bossHp: suggestion.hp,
          currentHp: goal.bossBattleConfig?.currentHp ?? suggestion.hp,
          damagePerLog: 5,
          bossCounterattack: 'Boss recovers 2 HP on missed days.',
          rewardBadgeId: 'unbeaten',
          defeated: goal.bossBattleConfig?.defeated,
        }
        enableBoss(goal.id, cfg)
      }
    } else {
      const created = addGoal({
        area,
        title: title.trim(),
        description,
        cadence: 'daily',
        questType,
        difficultyRating: difficulty,
        priority,
        milestones: [],
        isBossBattle: isBoss,
        bossBattleConfig: undefined,
      })
      if (isBoss) {
        const suggestion = suggestBoss(title, area)
        const cfg: BossBattleConfig = {
          bossName: bossName.trim() || suggestion.name,
          bossDescription: suggestion.description,
          bossHp: suggestion.hp,
          currentHp: suggestion.hp,
          damagePerLog: 5,
          bossCounterattack: 'Boss recovers 2 HP on missed days.',
          rewardBadgeId: 'unbeaten',
        }
        enableBoss(created.id, cfg)
      }
    }
    onDone()
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-[10px] uppercase tracking-wide text-muted mb-1.5">Area</div>
        <div className="flex flex-wrap gap-1.5">
          {AREA_LIST.map((a) => {
            const Icon = AREA_ICONS[a.id]
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setArea(a.id)}
                className={`px-2.5 py-1 rounded-full text-xs border transition inline-flex items-center gap-1.5 ${
                  area === a.id
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
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wide text-muted mb-1.5">Title</div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-accent"
          placeholder="e.g. Hit the gym 4× a week"
        />
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wide text-muted mb-1.5">Description</div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
          placeholder="Why this matters."
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-muted mb-1.5">Quest type</div>
          <select
            value={questType}
            onChange={(e) => setQuestType(e.target.value as QuestType)}
            className="w-full bg-surface2 border border-border rounded-lg px-2 py-2 text-sm"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="epic">Epic</option>
          </select>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-muted mb-1.5">Difficulty</div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setDifficulty(n as 1 | 2 | 3 | 4 | 5)}
                className={`flex-1 py-2 rounded flex items-center justify-center ${
                  difficulty >= n ? 'bg-accent/30 text-accent' : 'bg-surface2 text-muted'
                }`}
              >
                <Star
                  className="w-3.5 h-3.5"
                  strokeWidth={1.8}
                  fill={difficulty >= n ? 'currentColor' : 'none'}
                />
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-muted mb-1.5">Priority</div>
          <select
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value) as 1 | 2 | 3)}
            className="w-full bg-surface2 border border-border rounded-lg px-2 py-2 text-sm"
          >
            <option value={1}>1 — top</option>
            <option value={2}>2 — normal</option>
            <option value={3}>3 — back-burner</option>
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-red-500/30 bg-red-950/10 p-3">
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isBoss}
            onChange={(e) => setIsBoss(e.target.checked)}
            className="mt-1"
          />
          <div className="flex-1">
            <div className="text-sm font-medium flex items-center gap-1.5">
              Make this a boss battle
              <Skull className="w-4 h-4 text-red-400" strokeWidth={1.8} />
            </div>
            <div className="text-xs text-muted leading-relaxed">
              Personifies the goal as a villain with HP. Each log deals damage. Defeating it drops loot.
            </div>
            {isBoss && (
              <input
                value={bossName}
                onChange={(e) => setBossName(e.target.value)}
                placeholder={`Auto: ${suggestBoss(title, area).name}`}
                className="mt-3 w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm"
              />
            )}
          </div>
        </label>
      </div>

      <div className="flex gap-3 justify-end">
        <Button variant="ghost" onClick={onDone}>Cancel</Button>
        <Button disabled={!title.trim()} onClick={submit}>
          {goal ? 'Save' : 'Create'}
        </Button>
      </div>
    </div>
  )
}

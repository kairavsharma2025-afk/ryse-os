import { useState } from 'react'
import { useCharacter } from '@/stores/characterStore'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { CharacterHeader } from '@/components/character/CharacterHeader'
import { GoalForm } from '@/components/goals/GoalForm'
import { AREA_LIST, AREA_PASSIVES } from '@/data/areas'
import { CLASSES } from '@/data/classes'
import { useGoals } from '@/stores/goalsStore'
import { masteryForArea } from '@/engine/masteryEngine'
import { Pill } from '@/components/ui/Pill'
import {
  AREA_ICONS,
  AVATAR_OPTIONS,
  CLASS_ICONS,
  Sparkles,
  Crown,
  Star,
} from '@/components/icons'
import { Avatar } from '@/components/character/Avatar'

export function Profile() {
  const c = useCharacter()
  const goals = useGoals((s) => s.goals.filter((g) => !g.archivedAt))
  const cls = CLASSES[c.classId]
  const [editName, setEditName] = useState(false)
  const [draftName, setDraftName] = useState(c.name)
  const [newGoalOpen, setNewGoalOpen] = useState(false)

  const commitName = () => {
    if (draftName.trim() && draftName.trim() !== c.name) {
      c.setName(draftName.trim())
    } else {
      setDraftName(c.name)
    }
    setEditName(false)
  }

  return (
    <div className="space-y-6">
      <CharacterHeader />

      {/* Identity editor: avatar + name */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div>
            <h3 className="font-display text-xl tracking-wide">Identity</h3>
            <p className="text-xs text-muted">Pick an avatar. Change your name.</p>
          </div>
          <Button size="sm" onClick={() => setNewGoalOpen(true)}>
            + New Goal
          </Button>
        </div>

        {/* Name */}
        <div className="mb-5">
          <div className="text-[10px] uppercase tracking-wide text-muted mb-1.5">Name</div>
          {editName ? (
            <div className="flex gap-2">
              <input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitName()
                  if (e.key === 'Escape') {
                    setDraftName(c.name)
                    setEditName(false)
                  }
                }}
                autoFocus
                className="flex-1 bg-surface2 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-accent"
                placeholder="Your name"
              />
              <Button size="sm" onClick={commitName}>
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDraftName(c.name)
                  setEditName(false)
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="font-display text-2xl">{c.name || 'Hero'}</div>
              <button
                onClick={() => setEditName(true)}
                className="text-[11px] uppercase tracking-wide text-muted hover:text-accent border border-border/60 hover:border-accent/40 rounded px-2 py-1 transition"
              >
                Edit
              </button>
            </div>
          )}
        </div>

        {/* Avatar grid */}
        <div>
          <div className="text-[10px] uppercase tracking-wide text-muted mb-2">Avatar</div>
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
            {AVATAR_OPTIONS.map((a) => {
              const selected = a.id === c.avatar
              return (
                <button
                  key={a.id}
                  onClick={() => c.setAvatar(a.id)}
                  title={a.label}
                  aria-label={a.label}
                  className={`aspect-square rounded-lg border p-1 transition flex items-center justify-center ${
                    selected
                      ? 'border-accent bg-accent/15 ring-1 ring-accent/40 shadow-glow'
                      : 'border-border bg-surface2/40 hover:bg-surface2'
                  }`}
                >
                  <Avatar id={a.id} alt={a.label} className="h-full w-full" />
                </button>
              )
            })}
          </div>
          <div className="text-[10px] text-muted mt-2 font-mono">
            Selected: {AVATAR_OPTIONS.find((a) => a.id === c.avatar)?.label ?? '—'}
          </div>
        </div>
      </Card>

      {/* Class */}
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted">Class</div>
            <div className="font-display text-2xl flex items-center gap-2.5">
              {(() => {
                const ClsIcon = CLASS_ICONS[cls.id]
                return (
                  <span className="w-9 h-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                    <ClsIcon className="w-5 h-5" strokeWidth={1.7} />
                  </span>
                )
              })()}
              {cls.name}
            </div>
            <div className="text-xs text-muted">{cls.tagline}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wide text-muted">Active title</div>
            <select
              className="bg-surface2 border border-border rounded px-2 py-1 text-sm"
              value={c.activeTitle}
              onChange={(e) => c.setActiveTitle(e.target.value)}
            >
              {c.titles.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-sm text-muted leading-relaxed max-w-prose">{cls.description}</p>
      </Card>

      {/* Stats */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl tracking-wide">Stats (rolling 30 days)</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {AREA_LIST.map((a) => {
            const v = c.stats[a.id]
            const m = masteryForArea(a.id, goals)
            const passive3 = AREA_PASSIVES[a.id].mastery3
            const passive5 = AREA_PASSIVES[a.id].mastery5
            const Icon = AREA_ICONS[a.id]
            return (
              <div key={a.id} className="rounded-xl border border-border bg-surface2/40 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-8 h-8 rounded-md flex items-center justify-center"
                      style={{
                        background: `rgb(var(--${a.color}) / 0.15)`,
                        color: `rgb(var(--${a.color}))`,
                      }}
                    >
                      <Icon className="w-4 h-4" strokeWidth={1.8} />
                    </span>
                    <span className="font-medium">{a.name}</span>
                  </div>
                  <Pill color={a.color}>
                    <span className="inline-flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className="w-3 h-3"
                          strokeWidth={1.6}
                          fill={i < m.mastery ? 'currentColor' : 'none'}
                          style={{
                            opacity: i < m.mastery ? 1 : 0.4,
                          }}
                        />
                      ))}
                    </span>
                  </Pill>
                </div>
                <ProgressBar value={v} colorVar={a.color} />
                <div className="text-[11px] text-muted mt-2 leading-relaxed">
                  {m.nodes} skill nodes · mastery {m.mastery}/5
                </div>
                {m.mastery >= 3 && (
                  <div className="text-[11px] mt-2 text-accent2 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" strokeWidth={1.8} />
                    {passive3.name} — {passive3.effect}
                  </div>
                )}
                {m.mastery >= 5 && (
                  <div className="text-[11px] mt-1 text-legendary flex items-center gap-1.5">
                    <Crown className="w-3 h-3" strokeWidth={1.8} />
                    {passive5.name} — {passive5.effect}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Stats summary */}
      <Card className="p-6">
        <h3 className="font-display text-xl tracking-wide mb-3">Lifetime</h3>
        <div className="grid sm:grid-cols-4 gap-3">
          <div className="rounded-xl bg-surface2/40 p-3">
            <div className="text-[10px] uppercase tracking-wide text-muted">Days played</div>
            <div className="font-display text-2xl">{c.daysOpened.length}</div>
          </div>
          <div className="rounded-xl bg-surface2/40 p-3">
            <div className="text-[10px] uppercase tracking-wide text-muted">Total XP</div>
            <div className="font-display text-2xl">{c.xp}</div>
          </div>
          <div className="rounded-xl bg-surface2/40 p-3">
            <div className="text-[10px] uppercase tracking-wide text-muted">Achievements</div>
            <div className="font-display text-2xl">{c.achievements.length}</div>
          </div>
          <div className="rounded-xl bg-surface2/40 p-3">
            <div className="text-[10px] uppercase tracking-wide text-muted">Active goals</div>
            <div className="font-display text-2xl">{goals.length}</div>
          </div>
        </div>
      </Card>

      <Modal open={newGoalOpen} onClose={() => setNewGoalOpen(false)} title="New Goal">
        <GoalForm onDone={() => setNewGoalOpen(false)} />
      </Modal>
    </div>
  )
}

import { useState } from 'react'
import { useModules } from '@/stores/modulesStore'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { actionLogSilence } from '@/engine/gameLoop'

const COMMON_TRIGGERS = [
  'Work deadline',
  'Conflict with partner',
  'Money worry',
  'Compare-and-despair',
  'Unread message',
  'Loneliness',
  'Boredom',
  'Hunger',
  'Tiredness',
]

const COMMON_EMOTIONS = [
  'shame',
  'fear',
  'anger',
  'sadness',
  'numb',
  'jealous',
  'tender',
  'small',
  'tight',
]

export function Silence() {
  const logs = useModules((s) => s.silence.logs)
  const [trigger, setTrigger] = useState('')
  const [emotion, setEmotion] = useState('')
  const [pattern, setPattern] = useState('')
  const [insight, setInsight] = useState('')

  const submit = () => {
    if (!trigger.trim() || !emotion.trim()) return
    actionLogSilence({ trigger, emotion, pattern, insight })
    setTrigger('')
    setEmotion('')
    setPattern('')
    setInsight('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl tracking-wide">Silence</h1>
        <p className="text-muted text-sm max-w-prose">
          When did you go quiet today? When did you withdraw? Catch the pattern. Name the emotion.
          The unexamined silence runs the show.
        </p>
      </div>

      <Card className="p-5">
        <div className="space-y-3">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted mb-1.5">
              Trigger
            </div>
            <input
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
              placeholder="What happened just before?"
              className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {COMMON_TRIGGERS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTrigger(t)}
                  className="text-[11px] px-2 py-0.5 rounded-full border border-border text-muted hover:text-text"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted mb-1.5">
              Emotion
            </div>
            <input
              value={emotion}
              onChange={(e) => setEmotion(e.target.value)}
              placeholder="One word. Specific."
              className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {COMMON_EMOTIONS.map((t) => (
                <button
                  key={t}
                  onClick={() => setEmotion(t)}
                  className="text-[11px] px-2 py-0.5 rounded-full border border-border text-muted hover:text-text"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted mb-1.5">
              Pattern (optional)
            </div>
            <input
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="Have I been here before?"
              className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted mb-1.5">
              Insight (optional)
            </div>
            <input
              value={insight}
              onChange={(e) => setInsight(e.target.value)}
              placeholder="What is it asking for?"
              className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div className="flex justify-end">
            <Button disabled={!trigger.trim() || !emotion.trim()} onClick={submit}>
              Log silence (+12 XP)
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-display text-lg mb-3">{logs.length} entries</h3>
        {logs.length === 0 ? (
          <div className="text-xs text-muted">Nothing logged yet.</div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.map((l) => (
              <div
                key={l.id}
                className="rounded-lg border border-border bg-surface2/40 p-3 text-sm"
              >
                <div className="text-[10px] uppercase tracking-wide text-muted mb-1">
                  {l.createdAt.slice(0, 10)}
                </div>
                <div>
                  <span className="text-text/80">{l.trigger}</span>
                  <span className="text-muted"> → </span>
                  <span className="text-accent2">{l.emotion}</span>
                </div>
                {l.pattern && <div className="text-xs text-muted mt-1">↳ {l.pattern}</div>}
                {l.insight && <div className="text-xs text-text/70 mt-1">→ {l.insight}</div>}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

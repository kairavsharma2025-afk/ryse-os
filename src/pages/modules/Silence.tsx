import { useState } from 'react'
import { MoonStar } from 'lucide-react'
import { useModules } from '@/stores/modulesStore'
import { Button } from '@/components/ui/Button'
import { actionLogSilence } from '@/engine/gameLoop'
import { VoiceInputButton } from '@/components/VoiceInputButton'

const append = (cur: string, add: string) => (cur.trim() ? `${cur} ${add}` : add)

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

const inputCls =
  'w-full bg-surface2 border border-border/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent/60 transition-colors'
const labelCls = 'text-[10px] uppercase tracking-[0.2em] text-muted mb-1.5 block'

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
      <header>
        <h1 className="font-display text-3xl tracking-wide">Silence</h1>
        <p className="text-sm text-muted mt-1 max-w-prose leading-relaxed">
          When did you go quiet today? When did you withdraw? Catch the pattern. Name the emotion.
          The unexamined silence runs the show.
        </p>
      </header>

      <div className="rounded-2xl bg-surface border border-border/10 shadow-card p-5">
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Trigger</label>
            <input
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
              placeholder="What happened just before?"
              className={inputCls}
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {COMMON_TRIGGERS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTrigger(t)}
                  className="text-[11px] px-2 py-0.5 rounded-full border border-border/40 text-muted hover:text-text hover:border-accent/40 transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>Emotion</label>
            <input
              value={emotion}
              onChange={(e) => setEmotion(e.target.value)}
              placeholder="One word. Specific."
              className={inputCls}
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {COMMON_EMOTIONS.map((t) => (
                <button
                  key={t}
                  onClick={() => setEmotion(t)}
                  className="text-[11px] px-2 py-0.5 rounded-full border border-border/40 text-muted hover:text-text hover:border-accent/40 transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>Pattern (optional)</label>
            <div className="flex gap-2">
              <input
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="Have I been here before?"
                className={inputCls}
              />
              <VoiceInputButton onTranscript={(t) => setPattern((p) => append(p, t))} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Insight (optional)</label>
            <div className="flex gap-2">
              <input
                value={insight}
                onChange={(e) => setInsight(e.target.value)}
                placeholder="What is it asking for?"
                className={inputCls}
              />
              <VoiceInputButton onTranscript={(t) => setInsight((p) => append(p, t))} />
            </div>
          </div>
          <div className="flex justify-end">
            <Button disabled={!trigger.trim() || !emotion.trim()} onClick={submit}>
              Log silence (+12 XP)
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-surface border border-border/10 shadow-card p-5">
        <h2 className="font-display text-lg tracking-wide mb-3 inline-flex items-center gap-2">
          <MoonStar className="w-4 h-4 text-accent" strokeWidth={1.8} />
          {logs.length} entries
        </h2>
        {logs.length === 0 ? (
          <div className="text-xs text-muted">Nothing logged yet.</div>
        ) : (
          <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">
            {logs.map((l) => (
              <div
                key={l.id}
                className="rounded-lg border border-border/40 bg-surface2/30 p-3 text-sm"
              >
                <div className="text-[10px] uppercase tracking-wide text-muted mb-1 tabular-nums">
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
      </div>
    </div>
  )
}

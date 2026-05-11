import { useEffect, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, RefreshCw, Loader, Bot, Wand2, SendHorizonal } from 'lucide-react'
import { format } from 'date-fns'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { RichText } from '@/components/assistant/RichText'
import { useAssistant } from '@/stores/assistantStore'
import { useSettings } from '@/stores/settingsStore'
import { generateDailyPlan, adjustDailyPlan } from '@/engine/assistantActions'
import { todayISO } from '@/engine/dates'

const TWEAK_SUGGESTIONS = [
  'Move my workout to evening',
  'Add a 30-min lunch break',
  'Free up the afternoon for deep work',
]

export function AiPlanCard() {
  const plan = useAssistant((s) => s.plan)
  const loading = useAssistant((s) => s.planLoading)
  const error = useAssistant((s) => s.error)
  const openPanel = useAssistant((s) => s.setPanelOpen)
  const hasKey = useSettings((s) => !!s.anthropicApiKey?.trim())
  const nav = useNavigate()
  const [tweak, setTweak] = useState('')

  const today = todayISO()
  const planForToday = plan && plan.date === today ? plan : undefined

  const submitTweak = (e?: FormEvent) => {
    e?.preventDefault()
    const text = tweak.trim()
    if (!text || loading) return
    setTweak('')
    void adjustDailyPlan(text)
  }
  const onTweakKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submitTweak()
    }
  }

  // When an API key is present and we don't yet have today's plan, auto-generate it
  // shortly after mount (so the page paints first). generateDailyPlan() handles errors
  // internally — it never throws — so the page can't crash.
  useEffect(() => {
    if (!hasKey || planForToday || loading) return
    const id = window.setTimeout(() => {
      const a = useAssistant.getState()
      if (a.planLoading || (a.plan && a.plan.date === todayISO())) return
      void generateDailyPlan()
    }, 500)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasKey])

  const retry = () => void generateDailyPlan({ force: true })

  return (
    <Card variant="glow" className="p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/30 text-accent flex items-center justify-center">
            <Sparkles className="w-4 h-4" strokeWidth={1.8} />
          </span>
          <div className="leading-tight">
            <h2 className="font-display text-lg tracking-wide">AI Plan for Today</h2>
            <div className="text-[10px] uppercase tracking-[0.24em] text-muted">
              {planForToday
                ? `forged ${format(new Date(planForToday.generatedAt), 'h:mm a')}`
                : 'your battle plan, drafted by the Game Master'}
            </div>
          </div>
        </div>
      </div>

      {!hasKey ? (
        <div className="text-sm text-muted leading-relaxed">
          The assistant is asleep. Add your Anthropic API key in{' '}
          <button onClick={() => nav('/settings')} className="text-accent hover:text-accent2 font-medium">
            Settings
          </button>{' '}
          and it&apos;ll draft your day, build reminders, and plan your season.
        </div>
      ) : loading ? (
        <div className="space-y-3">
          {planForToday && (
            <div className="text-sm text-muted opacity-50">
              <RichText text={planForToday.content} />
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted py-2">
            <Loader className="w-4 h-4 animate-spin text-accent" />
            {planForToday ? 'Reworking your plan…' : 'Drafting your battle plan…'}
          </div>
        </div>
      ) : planForToday ? (
        <>
          <div className="text-sm text-muted">
            <RichText text={planForToday.content} />
          </div>
          {error && (
            <div className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300 flex items-center justify-between gap-3">
              <span>{error}</span>
              <Button size="sm" variant="ghost" onClick={retry}>
                Try again
              </Button>
            </div>
          )}

          <form
            onSubmit={submitTweak}
            className="mt-4 rounded-xl border border-border bg-surface2/40 p-3 space-y-2"
          >
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-muted">
              <Wand2 className="w-3 h-3 text-accent" />
              Tweak this plan
            </div>
            <div className="flex items-end gap-2">
              <textarea
                value={tweak}
                onChange={(e) => setTweak(e.target.value)}
                onKeyDown={onTweakKey}
                placeholder="Tell the GM what to change — e.g. move my workout to evening, free up the afternoon…"
                rows={2}
                className="flex-1 resize-none bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent/50 placeholder:text-muted/60"
              />
              <Button type="submit" size="sm" disabled={!tweak.trim()}>
                <SendHorizonal className="w-3.5 h-3.5" />
                Apply
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TWEAK_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTweak(s)}
                  className="text-[10px] px-2 py-0.5 rounded-full border border-border text-muted hover:text-accent hover:border-accent/40 transition"
                >
                  {s}
                </button>
              ))}
              <button
                type="button"
                onClick={retry}
                className="ml-auto text-[10px] uppercase tracking-wider text-muted hover:text-accent inline-flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Regenerate
              </button>
            </div>
          </form>
        </>
      ) : error ? (
        <div className="space-y-3">
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </div>
          <Button size="sm" onClick={retry}>
            <RefreshCw className="w-3.5 h-3.5" />
            Try again
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted leading-relaxed">
            Time-blocking your day around your schedule, goals and ritual…
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => void generateDailyPlan()}>
              <Sparkles className="w-3.5 h-3.5" />
              Generate today&apos;s plan
            </Button>
            <Button size="sm" variant="ghost" onClick={() => openPanel(true)}>
              <Bot className="w-3.5 h-3.5" />
              Ask the assistant
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

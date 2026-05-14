import { useState } from 'react'
import { Telescope } from 'lucide-react'
import { useModules } from '@/stores/modulesStore'
import { Button } from '@/components/ui/Button'
import { todayISO } from '@/engine/dates'
import { getOneDegreeQuestionForDate, ONE_DEGREE_QUESTIONS } from '@/data/oneDegree'
import { actionAnswerOneDegree } from '@/engine/gameLoop'
import { VoiceInputButton } from '@/components/VoiceInputButton'

export function OneDegree() {
  const today = todayISO()
  const q = getOneDegreeQuestionForDate(today)
  const ans = useModules((s) =>
    s.oneDegree.answers.find((a) => a.date === today && a.questionId === q.id)
  )
  const all = useModules((s) => s.oneDegree.answers)
  const [text, setText] = useState(ans?.text ?? '')
  const [interim, setInterim] = useState('')

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl tracking-wide">One Degree</h1>
        <p className="text-sm text-muted mt-1">
          One question a day. Widen the inner world by one degree.
        </p>
      </header>

      <div className="rounded-2xl bg-surface border border-border/10 shadow-card p-6 sm:p-7 relative overflow-hidden">
        <div
          aria-hidden
          className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-accent2/15 blur-3xl pointer-events-none"
        />
        <div className="relative">
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted mb-3 inline-flex items-center gap-1.5">
            <Telescope className="w-3 h-3" />
            Today's question · {q.category}
          </div>
          <div className="font-display text-2xl md:text-3xl tracking-wide leading-snug mb-5 text-balance">
            {q.text}
          </div>
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder="Write something honest. No one will see it but you."
              className="w-full bg-surface2 border border-border/40 rounded-lg px-4 py-3 pr-12 text-sm leading-relaxed focus:outline-none focus:border-accent/60 transition-colors"
            />
            <div className="absolute top-2 right-2">
              <VoiceInputButton
                onTranscript={(t) => setText((p) => (p.trim() ? `${p} ${t}` : t))}
                onInterim={setInterim}
                title="Answer aloud"
              />
            </div>
          </div>
          {interim && (
            <div className="text-[11px] text-accent2/80 italic mt-1.5 px-1">{interim}</div>
          )}
          <div className="flex items-center justify-between mt-3">
            <div className="text-xs text-muted">+15 XP per answer</div>
            <Button
              disabled={!text.trim()}
              onClick={() => actionAnswerOneDegree(q.id, text.trim())}
            >
              {ans ? 'Update answer' : 'Save answer'}
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-surface border border-border/10 shadow-card p-5">
        <h2 className="font-display text-lg tracking-wide mb-3">
          {all.length} answers
          <span className="text-muted text-sm font-sans ml-2">
            / {ONE_DEGREE_QUESTIONS.length} unique questions
          </span>
        </h2>
        {all.length === 0 ? (
          <div className="text-xs text-muted">No answers yet. Today is day one.</div>
        ) : (
          <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">
            {[...all]
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 50)
              .map((a) => {
                const question = ONE_DEGREE_QUESTIONS.find((x) => x.id === a.questionId)
                return (
                  <div
                    key={a.id}
                    className="rounded-lg border border-border/40 bg-surface2/30 p-3"
                  >
                    <div className="text-[10px] uppercase tracking-wide text-muted mb-1 tabular-nums">
                      {a.date}
                    </div>
                    <div className="text-sm text-text/80 mb-2">{question?.text}</div>
                    <div className="text-sm text-text leading-relaxed whitespace-pre-wrap">
                      {a.text}
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>
    </div>
  )
}

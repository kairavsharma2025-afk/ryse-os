import { useState } from 'react'
import { useModules } from '@/stores/modulesStore'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { todayISO } from '@/engine/dates'
import { getOneDegreeQuestionForDate, ONE_DEGREE_QUESTIONS } from '@/data/oneDegree'
import { actionAnswerOneDegree } from '@/engine/gameLoop'

export function OneDegree() {
  const today = todayISO()
  const q = getOneDegreeQuestionForDate(today)
  const ans = useModules((s) =>
    s.oneDegree.answers.find((a) => a.date === today && a.questionId === q.id)
  )
  const all = useModules((s) => s.oneDegree.answers)
  const [text, setText] = useState(ans?.text ?? '')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl tracking-wide">One Degree</h1>
        <p className="text-muted text-sm">
          One question a day. Widen the inner world by one degree.
        </p>
      </div>

      <Card className="p-7">
        <div className="text-[10px] uppercase tracking-[0.4em] text-muted mb-3">
          ─── today's question · {q.category} ───
        </div>
        <div className="font-display text-2xl md:text-3xl tracking-wide leading-snug mb-5 text-balance">
          {q.text}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder="Write something honest. No one will see it but you."
          className="w-full bg-surface2 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-accent leading-relaxed"
        />
        <div className="flex items-center justify-between mt-3">
          <div className="text-xs text-muted">+15 XP per answer</div>
          <Button
            disabled={!text.trim()}
            onClick={() => actionAnswerOneDegree(q.id, text.trim())}
          >
            {ans ? 'Update answer' : 'Save answer'}
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-display text-lg mb-3">
          {all.length} answers / {ONE_DEGREE_QUESTIONS.length} unique questions
        </h3>
        {all.length === 0 ? (
          <div className="text-xs text-muted">No answers yet.</div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {[...all]
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 50)
              .map((a) => {
                const question = ONE_DEGREE_QUESTIONS.find((x) => x.id === a.questionId)
                return (
                  <div
                    key={a.id}
                    className="rounded-lg border border-border bg-surface2/40 p-3"
                  >
                    <div className="text-[10px] uppercase tracking-wide text-muted mb-1">
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
      </Card>
    </div>
  )
}

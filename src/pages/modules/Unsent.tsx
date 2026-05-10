import { useState } from 'react'
import { useModules } from '@/stores/modulesStore'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { actionWriteUnsent } from '@/engine/gameLoop'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame } from '@/components/icons'

export function Unsent() {
  const drafts = useModules((s) => s.unsent.drafts)
  const burn = useModules((s) => s.burnDraft)
  const [recipient, setRecipient] = useState('')
  const [body, setBody] = useState('')

  const submit = () => {
    if (!recipient.trim() || !body.trim()) return
    actionWriteUnsent({ recipient: recipient.trim(), body: body.trim() })
    setRecipient('')
    setBody('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl tracking-wide">Unsent</h1>
        <p className="text-muted text-sm max-w-prose">
          Write what you would never send. To anyone, living or dead, ever or never. They stay here.
          This is one of the most powerful things you can do for yourself.
        </p>
      </div>

      <Card className="p-5">
        <div className="text-[10px] uppercase tracking-wide text-muted mb-2">
          New unsent letter
        </div>
        <input
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="To… (e.g. Dad, the version of me at 17, my old boss)"
          className="w-full bg-surface2 border border-border rounded-lg px-4 py-2.5 mb-3 focus:outline-none focus:border-accent"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={10}
          placeholder="Write. Don't edit. No one will read this."
          className="w-full bg-surface2 border border-border rounded-lg px-4 py-3 text-sm leading-relaxed focus:outline-none focus:border-accent"
        />
        <div className="flex items-center justify-between mt-3">
          <div className="text-xs text-muted">+20 XP per draft</div>
          <Button disabled={!recipient.trim() || !body.trim()} onClick={submit}>
            Save (never sent)
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-display text-lg mb-3">{drafts.length} drafts</h3>
        {drafts.length === 0 ? (
          <div className="text-xs text-muted">Nothing yet.</div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {drafts.map((d) => (
                <motion.div
                  key={d.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`rounded-lg border p-4 ${
                    d.burnedAt
                      ? 'border-border/40 bg-surface/30 opacity-50 line-through'
                      : 'border-border bg-surface2/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-xs uppercase tracking-wide text-muted">
                      To {d.recipient}
                    </div>
                    <div className="text-[10px] text-muted">
                      {d.createdAt.slice(0, 10)}
                    </div>
                  </div>
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">{d.body}</div>
                  {!d.burnedAt && (
                    <button
                      className="mt-3 text-[10px] uppercase tracking-wide text-muted hover:text-red-400 transition inline-flex items-center gap-1.5"
                      onClick={() => burn(d.id)}
                    >
                      <Flame className="w-3 h-3" strokeWidth={2} />
                      Burn (keep but mark released)
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </Card>
    </div>
  )
}

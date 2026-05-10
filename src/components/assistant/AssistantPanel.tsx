import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Bot, Send, X, Sparkles, Trash2, Loader } from 'lucide-react'
import { useAssistant } from '@/stores/assistantStore'
import { useSettings } from '@/stores/settingsStore'
import { askAssistant } from '@/engine/assistantActions'
import { RichText } from './RichText'

const STARTERS = [
  'What should I focus on today?',
  'Plan my week around my goals.',
  'Remind me to drink water every day at 11am.',
  'I have a job interview next Friday — help me prep.',
]

export function AssistantPanel() {
  const open = useAssistant((s) => s.panelOpen)
  const messages = useAssistant((s) => s.messages)
  const thinking = useAssistant((s) => s.thinking)
  const error = useAssistant((s) => s.error)
  const setOpen = useAssistant((s) => s.setPanelOpen)
  const clearChat = useAssistant((s) => s.clearChat)
  const hasKey = useSettings((s) => !!s.anthropicApiKey?.trim())
  const nav = useNavigate()
  const [draft, setDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, setOpen])

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
        inputRef.current?.focus()
      })
    }
  }, [open])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length, thinking])

  const send = (text: string) => {
    const t = text.trim()
    if (!t || thinking) return
    setDraft('')
    void askAssistant(t)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex justify-end"
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 240 }}
            className="relative w-full sm:max-w-md h-full bg-surface border-l border-border flex flex-col shadow-2xl"
          >
            {/* header */}
            <div className="px-4 py-3 border-b border-border flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center">
                <Bot className="w-5 h-5" strokeWidth={1.8} />
              </span>
              <div className="leading-tight flex-1 min-w-0">
                <div className="font-display tracking-wide text-lg">Game Master</div>
                <div className="text-[10px] uppercase tracking-[0.28em] text-muted">your life assistant</div>
              </div>
              {messages.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('Clear the whole conversation?')) clearChat()
                  }}
                  className="p-2 rounded-lg text-muted hover:text-text hover:bg-surface2/50"
                  title="Clear conversation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg text-muted hover:text-text hover:bg-surface2/50"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* body */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {!hasKey && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm">
                  <div className="font-medium text-red-300 mb-1">Assistant is asleep.</div>
                  <p className="text-muted leading-relaxed mb-3">
                    Add your Anthropic API key in Settings to wake the Game Master. Everything stays on
                    this device.
                  </p>
                  <button
                    onClick={() => {
                      setOpen(false)
                      nav('/settings')
                    }}
                    className="text-accent hover:text-accent2 text-sm font-medium"
                  >
                    Open Settings →
                  </button>
                </div>
              )}

              {messages.length === 0 && (
                <div className="text-center py-8">
                  <Sparkles className="w-8 h-8 text-accent2 mx-auto mb-3" strokeWidth={1.5} />
                  <p className="text-muted text-sm max-w-xs mx-auto leading-relaxed">
                    Tell me about your day. I know your goals, your season, your ritual and your
                    calendar — I&apos;ll plan and remind so you can just play.
                  </p>
                  <div className="mt-5 flex flex-col gap-2">
                    {STARTERS.map((s) => (
                      <button
                        key={s}
                        disabled={!hasKey}
                        onClick={() => send(s)}
                        className="text-left text-sm px-3 py-2 rounded-lg border border-border bg-surface2/40 hover:border-accent/40 hover:text-text text-muted disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m) => (
                <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  <div
                    className={
                      m.role === 'user'
                        ? 'max-w-[85%] rounded-2xl rounded-br-sm bg-accent/15 border border-accent/30 px-3.5 py-2.5 text-sm text-text'
                        : 'max-w-[88%] rounded-2xl rounded-bl-sm bg-surface2/50 border border-border px-3.5 py-2.5 text-sm text-muted'
                    }
                  >
                    {m.role === 'assistant' ? <RichText text={m.content} /> : m.content}
                  </div>
                </div>
              ))}

              {thinking && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-sm bg-surface2/50 border border-border px-3.5 py-2.5 text-sm text-muted flex items-center gap-2">
                    <Loader className="w-4 h-4 animate-spin text-accent" />
                    <span>plotting your next move…</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-300">
                  {error}
                </div>
              )}
            </div>

            {/* composer */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                send(draft)
              }}
              className="border-t border-border p-3 flex items-end gap-2"
            >
              <textarea
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send(draft)
                  }
                }}
                rows={1}
                placeholder={hasKey ? 'Tell me what’s going on…' : 'Add an API key in Settings first'}
                disabled={!hasKey}
                className="flex-1 resize-none max-h-32 bg-surface2 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-accent/50 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!hasKey || thinking || !draft.trim()}
                className="shrink-0 w-10 h-10 rounded-xl bg-accent text-bg flex items-center justify-center hover:bg-accent2 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                title="Send"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

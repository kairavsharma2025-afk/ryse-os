import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Lock } from 'lucide-react'
import { useAssistant } from '@/stores/assistantStore'
import { useSettings } from '@/stores/settingsStore'
import { askAssistant } from '@/engine/assistantActions'
import { AssistantHeader } from './AssistantHeader'
import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'
import { AssistantComposer } from './AssistantComposer'

const STARTERS = [
  'What should I focus on today?',
  'Plan my week around my goals.',
  'Remind me to drink water at 11am every day.',
  'I have a job interview Friday — help me prep.',
]

/**
 * Right-edge drawer for the Ryse assistant. Header → message stream →
 * composer. Components live in components/assistant; this file is the shell
 * (scrim, motion, scroll behaviour, gating on API key).
 */
export function AssistantPanel() {
  const open = useAssistant((s) => s.panelOpen)
  const messages = useAssistant((s) => s.messages)
  const thinking = useAssistant((s) => s.thinking)
  const error = useAssistant((s) => s.error)
  const setOpen = useAssistant((s) => s.setPanelOpen)
  const clearChat = useAssistant((s) => s.clearChat)
  const hasKey = useSettings((s) => !!s.anthropicApiKey?.trim())
  const nav = useNavigate()
  const scrollRef = useRef<HTMLDivElement>(null)

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
      })
    }
  }, [open])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length, thinking])

  const send = (text: string) => {
    if (!text.trim() || thinking) return
    void askAssistant(text)
  }

  const onClear = () => {
    if (confirm('Clear the whole conversation?')) clearChat()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] flex justify-end"
        >
          <div
            className="absolute inset-0 bg-black/55 backdrop-blur-[3px]"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <motion.aside
            role="dialog"
            aria-label="Game Master assistant"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="relative w-full sm:max-w-md h-full bg-surface border-l border-border/10 flex flex-col shadow-elevated"
          >
            <AssistantHeader
              active={hasKey}
              hasMessages={messages.length > 0}
              onClear={onClear}
              onClose={() => setOpen(false)}
            />

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5">
              {!hasKey && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Lock className="w-3.5 h-3.5 text-red-400" strokeWidth={2} />
                    <div className="font-display text-md text-red-300">Assistant is asleep.</div>
                  </div>
                  <p className="text-xs text-muted leading-relaxed mb-3">
                    Add your Anthropic API key in Settings to wake the Game Master. Everything stays
                    on this device.
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

              {messages.length === 0 && hasKey && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/30 text-accent flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-6 h-6" strokeWidth={1.6} />
                  </div>
                  <p className="text-muted text-sm max-w-xs mx-auto leading-relaxed">
                    Tell me about your day. I know your goals, your season, your ritual and your
                    calendar — I'll plan and remind so you can just play.
                  </p>
                  <div className="mt-5 flex flex-col gap-2 text-left">
                    {STARTERS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="group rounded-xl border border-border/30 bg-surface2/40 hover:border-accent/40 hover:bg-surface2/60 px-3 py-2 text-sm text-muted hover:text-text transition-colors flex items-center gap-2"
                      >
                        <Sparkles className="w-3 h-3 text-accent2/70 shrink-0" strokeWidth={1.8} />
                        <span className="truncate">{s}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}

              {thinking && <TypingIndicator />}

              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-300">
                  {error}
                </div>
              )}
            </div>

            <AssistantComposer
              onSend={send}
              disabled={!hasKey}
              thinking={thinking}
              placeholder={hasKey ? "Tell me what's going on…" : 'Add an API key in Settings first'}
            />
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

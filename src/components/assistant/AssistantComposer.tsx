import { useEffect, useRef, useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { VoiceInputButton } from '@/components/VoiceInputButton'

/**
 * Composer for the assistant drawer. Auto-resizing textarea (up to ~6 lines),
 * voice-to-text button that appends transcripts, and a primary send button
 * keyed to non-empty draft + non-thinking state.
 *
 *   • Enter         → send
 *   • Shift+Enter   → newline
 *   • Esc           → blur (delegated to drawer; we don't handle it here)
 */
export function AssistantComposer({
  onSend,
  disabled,
  thinking,
  placeholder,
}: {
  onSend: (text: string) => void
  disabled: boolean
  thinking: boolean
  placeholder: string
}) {
  const [draft, setDraft] = useState('')
  const [interim, setInterim] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)

  // Auto-resize as the user types — capped so the textarea doesn't eat the screen.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = '0px'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }, [draft])

  const submit = () => {
    const t = draft.trim()
    if (!t || disabled || thinking) return
    setDraft('')
    onSend(t)
  }

  const appendDraft = (text: string) => {
    setDraft((d) => (d.trim() ? `${d} ${text}` : text))
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className="border-t border-border/10 bg-surface px-3 py-3 flex flex-col gap-1.5"
    >
      {interim && (
        <div className="text-[11px] text-accent2/80 italic px-1 truncate">{interim}</div>
      )}
      <div className="flex items-end gap-2">
        <textarea
          ref={ref}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              submit()
            }
          }}
          rows={1}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 resize-none max-h-40 bg-surface2/60 border border-border/30 rounded-xl px-3 py-2.5 text-sm leading-snug focus:outline-none focus:border-accent/60 disabled:opacity-50 transition-colors"
        />
        <VoiceInputButton
          onTranscript={appendDraft}
          onInterim={setInterim}
          title="Hold a thought aloud — tap to start, tap to stop"
        />
        <button
          type="submit"
          disabled={disabled || thinking || !draft.trim()}
          className="shrink-0 w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center hover:bg-accent2 disabled:opacity-40 disabled:pointer-events-none transition-colors duration-80"
          title="Send"
          aria-label="Send"
        >
          {thinking ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" strokeWidth={2} />
          )}
        </button>
      </div>
    </form>
  )
}

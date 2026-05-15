import { useRef, useState } from 'react'
import { Sparkles, ArrowRight } from 'lucide-react'
import { useAssistant } from '@/stores/assistantStore'
import { askAssistant } from '@/engine/assistantActions'
import { useSettings } from '@/stores/settingsStore'

/**
 * Persistent "Ask Ryse AI…" input. Sits at the bottom of the main content area
 * on every page. Typing or pressing Enter opens the existing assistant panel
 * and hands off the text — this component never duplicates the assistant
 * logic itself, it's just a convenience trigger.
 *
 * Visually: dark input with a purple left accent border, zinc-500 placeholder.
 */
export function AiQuickInput() {
  const openPanel = useAssistant((s) => s.setPanelOpen)
  const hasKey = useSettings((s) => !!s.anthropicApiKey?.trim())
  const [text, setText] = useState('')
  const ref = useRef<HTMLInputElement>(null)

  const submit = () => {
    const t = text.trim()
    openPanel(true)
    if (!t) return
    setText('')
    if (hasKey) {
      void askAssistant(t)
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className="relative w-full"
    >
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-ai">
        <Sparkles className="w-4 h-4" strokeWidth={2} />
      </div>
      <input
        ref={ref}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFocus={() => openPanel(true)}
        placeholder="Ask Ryse AI to plan, remind, or analyze…"
        className="w-full rounded-xl bg-surface text-text placeholder:text-zinc-500 text-sm pl-9 pr-12 py-3 border border-border/20 focus:outline-none focus:border-ai/60 transition-colors"
        style={{ borderLeft: '4px solid rgb(var(--color-ai))' }}
        aria-label="Ask Ryse AI"
      />
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-ai/15 hover:bg-ai/25 text-ai flex items-center justify-center transition-colors"
        title="Open assistant"
        aria-label="Open assistant"
      >
        <ArrowRight className="w-4 h-4" strokeWidth={2} />
      </button>
    </form>
  )
}

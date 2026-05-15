import { Square } from 'lucide-react'
import { useAssistant } from '@/stores/assistantStore'

/**
 * Non-blocking purple pill that sits in the top-right of the header while the
 * assistant is generating. Click the Stop button to abort the current run
 * (best-effort — flips the `thinking` flag so the UI unwinds; the in-flight
 * fetch is left to settle on its own).
 *
 * Replaces the older bottom-of-screen "Stop Claude" toast so long-running
 * generations no longer cover the content.
 */
export function AssistantStatusPill() {
  const thinking = useAssistant((s) => s.thinking)
  const setThinking = useAssistant((s) => s.setThinking)
  if (!thinking) return null
  return (
    <div
      role="status"
      className="hidden sm:inline-flex items-center gap-2 pl-3 pr-1 py-1 rounded-full border text-[11px] font-medium animate-toastIn"
      style={{
        background: 'rgb(var(--color-ai) / 0.10)',
        borderColor: 'rgb(var(--color-ai) / 0.40)',
        color: 'rgb(var(--color-ai))',
      }}
    >
      <span
        className="inline-block w-1.5 h-1.5 rounded-full animate-pulseDot"
        style={{ background: 'rgb(var(--color-ai))' }}
        aria-hidden="true"
      />
      <span>AI working…</span>
      <button
        type="button"
        onClick={() => setThinking(false)}
        className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-ai/20 hover:bg-ai/30 text-ai font-semibold transition-colors duration-80"
        title="Stop"
        aria-label="Stop AI"
      >
        <Square className="w-2.5 h-2.5 fill-current" strokeWidth={0} />
        Stop
      </button>
    </div>
  )
}

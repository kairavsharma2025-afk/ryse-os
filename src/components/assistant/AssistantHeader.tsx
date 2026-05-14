import { Bot, Trash2, X } from 'lucide-react'

/**
 * Drawer header for the assistant panel. Bot avatar with a gentle pulse when
 * the API key is set ("active"); muted otherwise. Clear-chat button is shown
 * only when there's something to clear. Title + status sub-line sit between
 * the avatar and the action buttons.
 */
export function AssistantHeader({
  active,
  hasMessages,
  onClear,
  onClose,
}: {
  active: boolean
  hasMessages: boolean
  onClear: () => void
  onClose: () => void
}) {
  return (
    <div className="relative px-4 py-3 border-b border-border/10 bg-surface flex items-center gap-3 overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 18% 50%, rgb(var(--accent) / 0.3), transparent 60%), radial-gradient(circle at 95% 50%, rgb(var(--accent2) / 0.25), transparent 55%)',
        }}
      />
      <div className="relative shrink-0">
        <span
          className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
            active
              ? 'border-accent/40 bg-accent/15 text-accent'
              : 'border-border/30 bg-surface2/60 text-muted'
          }`}
        >
          <Bot className="w-5 h-5" strokeWidth={1.8} />
        </span>
        {active && (
          <span
            aria-hidden
            className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success border-2 border-surface animate-pulse"
          />
        )}
      </div>
      <div className="relative leading-tight flex-1 min-w-0">
        <div className="font-display tracking-wide text-lg text-text truncate">Game Master</div>
        <div className="text-[10px] uppercase tracking-[0.24em] text-muted">
          {active ? 'awake · ready' : 'asleep · add API key'}
        </div>
      </div>
      {hasMessages && (
        <button
          onClick={onClear}
          className="relative p-2 rounded-lg text-muted hover:text-text hover:bg-surface2/50 transition-colors"
          title="Clear conversation"
          aria-label="Clear conversation"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
      <button
        onClick={onClose}
        className="relative p-2 rounded-lg text-muted hover:text-text hover:bg-surface2/50 transition-colors"
        title="Close"
        aria-label="Close assistant"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

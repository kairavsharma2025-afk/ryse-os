import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

/**
 * iOS-style toggle switch. Use anywhere a boolean is being flipped — replaces
 * raw `<input type="checkbox">` for a calmer, more design-language-aligned
 * affordance.
 *
 *   <Toggle
 *     checked={settings.hardModeXp}
 *     onChange={(v) => settings.set('hardModeXp', v)}
 *     label="Hard mode (0.7× XP)"
 *     hint="Slows progression. Earn legendary glow on every achievement."
 *   />
 */
export interface ToggleProps {
  checked: boolean
  onChange: (next: boolean) => void
  /** Optional inline label that becomes the click target. */
  label?: ReactNode
  /** Optional secondary line, shown under the label. */
  hint?: ReactNode
  /** Disable the control. */
  disabled?: boolean
  /** Accessible label override when no inline `label` is shown. */
  ariaLabel?: string
  className?: string
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
  disabled,
  ariaLabel,
  className = '',
}: ToggleProps) {
  const Switch = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={!label ? ariaLabel : undefined}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        if (!disabled) onChange(!checked)
      }}
      className={`relative shrink-0 w-10 h-6 rounded-full transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${checked ? 'bg-accent' : 'bg-surface2 border border-border/60'}`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 700, damping: 32 }}
        className={`absolute top-0.5 ${checked ? 'right-0.5' : 'left-0.5'} w-5 h-5 rounded-full shadow-md ${
          checked ? 'bg-white' : 'bg-surface border border-border/40'
        }`}
        aria-hidden="true"
      />
    </button>
  )

  if (!label && !hint) {
    return <div className={className}>{Switch}</div>
  }

  return (
    <label
      className={`flex items-start gap-3 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      <span className="min-w-0 flex-1">
        {label && <div className="text-sm text-text leading-snug">{label}</div>}
        {hint && <div className="text-[11px] text-muted leading-snug mt-0.5">{hint}</div>}
      </span>
      {Switch}
    </label>
  )
}

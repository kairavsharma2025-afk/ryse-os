import { motion } from 'framer-motion'

/**
 * Three-dot typing indicator inside an assistant-style bubble. Replaces the
 * old "plotting your next move…" spinner — same vibe but doesn't introduce a
 * line of running commentary.
 */
export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="rounded-2xl rounded-bl-sm bg-surface2/60 border border-border/30 px-4 py-3 inline-flex items-end gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            animate={{ y: [0, -3, 0], opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 0.9,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
            className="block w-1.5 h-1.5 rounded-full bg-accent"
          />
        ))}
      </div>
    </div>
  )
}

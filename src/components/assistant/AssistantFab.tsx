import { motion } from 'framer-motion'
import { Bot } from 'lucide-react'
import { useAssistant } from '@/stores/assistantStore'

/** Floating "Ask the Game Master" button — present on every page. */
export function AssistantFab() {
  const open = useAssistant((s) => s.panelOpen)
  const setOpen = useAssistant((s) => s.setPanelOpen)
  if (open) return null
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', damping: 18, stiffness: 260 }}
      onClick={() => setOpen(true)}
      className="fixed z-50 right-4 bottom-20 md:right-6 md:bottom-6 w-14 h-14 rounded-2xl bg-accent text-bg shadow-glow border border-accent2/40 flex items-center justify-center hover:bg-accent2 transition-colors"
      title="Ask the Game Master"
      aria-label="Open assistant"
    >
      <Bot className="w-6 h-6" strokeWidth={1.8} />
    </motion.button>
  )
}

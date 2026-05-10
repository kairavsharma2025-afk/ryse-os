import { motion } from 'framer-motion'

interface Props {
  payload: { id: string; xp: number }
}

export function QuestCompleteToast({ payload }: Props) {
  return (
    <motion.div
      initial={{ x: 80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 80, opacity: 0 }}
      transition={{ type: 'spring', damping: 18, stiffness: 220 }}
      className="fixed top-6 right-6 z-[80] glass rounded-xl px-4 py-3 flex items-center gap-3 max-w-xs shadow-glow"
    >
      <span className="text-xl">✓</span>
      <div className="leading-tight">
        <div className="text-sm font-medium">Quest complete</div>
        <div className="text-xs text-accent2">+{payload.xp} XP</div>
      </div>
    </motion.div>
  )
}

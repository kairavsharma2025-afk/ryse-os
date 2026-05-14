import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, type ReactNode } from 'react'

/**
 * iOS-style bottom sheet. Drag down to dismiss, scrim tap to dismiss.
 * Used by Quick-Add FAB, Task Detail Panel on mobile, etc.
 *
 *   <BottomSheet open={open} onClose={() => setOpen(false)}>
 *     <YourContent />
 *   </BottomSheet>
 *
 * Renders into the body via a fixed-position overlay; no portal needed because
 * the z-index is high enough to escape every layout container we use.
 */
interface Props {
  open: boolean
  onClose: () => void
  children: ReactNode
  /** Max height as a percent of viewport. Default 85%. */
  maxHeightPercent?: number
  /** When false, the drag-handle bar is hidden (e.g. for full-screen modes). */
  showHandle?: boolean
  className?: string
}

export function BottomSheet({
  open,
  onClose,
  children,
  maxHeightPercent = 85,
  showHandle = true,
  className = '',
}: Props) {
  // Lock body scroll while open — typical mobile sheet behaviour.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  // Esc to close.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-black/45 backdrop-blur-[2px]"
            aria-hidden="true"
          />
          <motion.div
            key="sheet"
            role="dialog"
            aria-modal="true"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38, mass: 0.9 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose()
            }}
            className={`fixed left-0 right-0 bottom-0 z-[71] bg-surface text-text rounded-t-2xl shadow-modal overflow-hidden ${className}`}
            style={{ maxHeight: `${maxHeightPercent}vh` }}
          >
            {showHandle && (
              <div className="flex justify-center pt-2 pb-1">
                <div className="h-1 w-10 rounded-full bg-muted/30" />
              </div>
            )}
            <div className="overflow-y-auto" style={{ maxHeight: `${maxHeightPercent - 4}vh` }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

import { useCallback, useRef } from 'react'
import { Mic, MicOff } from 'lucide-react'
import { motion } from 'framer-motion'
import { useVoiceInput } from '@/hooks/useVoiceInput'

interface Props {
  /** Called when the user is done speaking — receives the combined finalised text. */
  onTranscript: (text: string) => void
  /** Optional: live interim transcript as the user speaks (e.g. show in a hint). */
  onInterim?: (text: string) => void
  className?: string
  size?: 'sm' | 'md'
  title?: string
}

/**
 * Press-to-record mic button. Buffers finalised utterances while recording and
 * flushes them all to `onTranscript` when the user taps to stop, so the caller
 * gets one clean append per session.
 */
export function VoiceInputButton({
  onTranscript,
  onInterim,
  className = '',
  size = 'md',
  title,
}: Props) {
  const bufferRef = useRef('')
  const handleFinal = useCallback((text: string) => {
    bufferRef.current = bufferRef.current ? `${bufferRef.current} ${text}` : text
  }, [])
  const { supported, listening, toggle, error } = useVoiceInput({
    onFinal: handleFinal,
    onInterim,
  })

  const onClick = () => {
    if (listening) {
      const text = bufferRef.current.trim()
      bufferRef.current = ''
      onInterim?.('')
      toggle()
      if (text) onTranscript(text)
    } else {
      bufferRef.current = ''
      toggle()
    }
  }

  if (!supported) {
    return (
      <button
        type="button"
        disabled
        className={`inline-flex items-center justify-center rounded-lg text-muted/40 cursor-not-allowed ${
          size === 'sm' ? 'w-7 h-7' : 'w-9 h-9'
        } ${className}`}
        title="Voice input isn't supported in this browser"
        aria-label="Voice input unsupported"
      >
        <MicOff className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      </button>
    )
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.92 }}
      title={title ?? (listening ? 'Tap to stop' : 'Tap to speak')}
      aria-label={listening ? 'Stop recording' : 'Start voice input'}
      aria-pressed={listening}
      className={`relative inline-flex items-center justify-center rounded-lg border transition-colors ${
        size === 'sm' ? 'w-7 h-7' : 'w-9 h-9'
      } ${
        listening
          ? 'bg-red-500/20 border-red-500/50 text-red-300'
          : 'bg-surface2/60 border-border text-muted hover:text-accent hover:border-accent/50'
      } ${className}`}
    >
      <Mic className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      {listening && (
        <span className="absolute inset-0 rounded-lg ring-2 ring-red-500/40 animate-pulseGlow pointer-events-none" />
      )}
      {error && (
        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-red-400 whitespace-nowrap">
          {error}
        </span>
      )}
    </motion.button>
  )
}

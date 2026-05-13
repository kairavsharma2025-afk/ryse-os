import { useCallback, useEffect, useRef, useState } from 'react'

// Web Speech API isn't in lib.dom yet; declare the minimum we use.
interface SpeechRecognitionEventResult {
  isFinal: boolean
  0: { transcript: string }
}
interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: ArrayLike<SpeechRecognitionEventResult>
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string
}
interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}
type SRConstructor = new () => SpeechRecognitionLike

function getSR(): SRConstructor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: SRConstructor
    webkitSpeechRecognition?: SRConstructor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export const voiceInputSupported = (): boolean => getSR() !== null

interface Options {
  onFinal?: (text: string) => void
  onInterim?: (text: string) => void
  lang?: string
}

interface VoiceInputApi {
  supported: boolean
  listening: boolean
  start: () => void
  stop: () => void
  toggle: () => void
  error?: string
}

/**
 * Press-to-record voice input. Calls `onFinal(text)` once per finalised
 * utterance (call onFinal multiple times in a single session as the user pauses).
 * `onInterim` fires continuously as the live transcript builds.
 */
export function useVoiceInput(opts: Options = {}): VoiceInputApi {
  const { onFinal, onInterim, lang = 'en-US' } = opts
  const SR = getSR()
  const supported = SR !== null

  const recogRef = useRef<SpeechRecognitionLike | null>(null)
  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  // Keep callbacks fresh without re-creating the recogniser.
  const finalRef = useRef(onFinal)
  const interimRef = useRef(onInterim)
  useEffect(() => {
    finalRef.current = onFinal
    interimRef.current = onInterim
  }, [onFinal, onInterim])

  useEffect(() => {
    if (!SR) return
    const r = new SR()
    r.continuous = true
    r.interimResults = true
    r.lang = lang
    r.onresult = (e) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i]
        const text = res[0].transcript
        if (res.isFinal) {
          const trimmed = text.trim()
          if (trimmed) finalRef.current?.(trimmed)
        } else {
          interim += text
        }
      }
      interimRef.current?.(interim)
    }
    r.onerror = (e) => {
      if (e.error === 'no-speech' || e.error === 'aborted') {
        // benign — quiet
      } else if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setError('Microphone permission denied.')
      } else {
        setError(e.error)
      }
      setListening(false)
    }
    r.onend = () => setListening(false)
    recogRef.current = r
    return () => {
      try {
        r.abort()
      } catch {
        /* ignore */
      }
      recogRef.current = null
    }
  }, [SR, lang])

  const start = useCallback(() => {
    if (!recogRef.current || listening) return
    setError(undefined)
    try {
      recogRef.current.start()
      setListening(true)
    } catch {
      // start() throws if already started — treat as listening.
      setListening(true)
    }
  }, [listening])

  const stop = useCallback(() => {
    if (!recogRef.current) return
    try {
      recogRef.current.stop()
    } catch {
      /* ignore */
    }
    setListening(false)
  }, [])

  const toggle = useCallback(() => {
    if (listening) stop()
    else start()
  }, [listening, start, stop])

  return { supported, listening, start, stop, toggle, error }
}

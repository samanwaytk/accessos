import { useCallback, useEffect, useRef, useState } from 'react'

type SpeechRecognitionEventLike = { resultIndex: number; results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }
type SpeechRecognitionErrorEventLike = { error: string }
type SpeechRecognitionLike = { continuous: boolean; interimResults: boolean; lang: string; onresult: ((event: SpeechRecognitionEventLike) => void) | null; onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null; onend: (() => void) | null; onstart: (() => void) | null; start: () => void; stop: () => void }
type SpeechWindow = Window & { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike }
export type VoiceState = 'listening' | 'processing' | 'speaking' | 'muted'

export function useSpeechRecognition(onFinalResult: (text: string) => void) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const callbackRef = useRef(onFinalResult), desiredRef = useRef(true), holdRef = useRef(false), restartTimer = useRef<number>()
  const [supported, setSupported] = useState(true), [voiceState, setVoiceState] = useState<VoiceState>('muted'), [error, setError] = useState('')
  useEffect(() => { callbackRef.current = onFinalResult }, [onFinalResult])
  const startRecognition = useCallback(() => {
    const speechWindow = window as SpeechWindow, Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition
    if (!Recognition) { setSupported(false); setError('Speech recognition is not supported in this browser. Please use Google Chrome.'); return }
    let recognition = recognitionRef.current
    if (!recognition) {
      recognition = new Recognition(); recognitionRef.current = recognition; recognition.continuous = true; recognition.interimResults = false; recognition.lang = 'en-IN'
      recognition.onstart = () => { if (desiredRef.current && !holdRef.current) { setVoiceState('listening'); setError('') } }
      recognition.onerror = event => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') { desiredRef.current = false; holdRef.current = true; setVoiceState('muted'); setError('Microphone permission was denied. Allow microphone access in your browser, then use the microphone button to try again. Keyboard input remains available.') }
        else if (event.error !== 'no-speech' && event.error !== 'aborted') setError(`Microphone interruption: ${event.error}. Retrying when possible.`)
      }
      recognition.onresult = event => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i], transcript = result[0].transcript.trim()
          if (result.isFinal && transcript && desiredRef.current && !holdRef.current) { holdRef.current = true; setVoiceState('processing'); recognition?.stop(); callbackRef.current(transcript); break }
        }
      }
      recognition.onend = () => {
        if (desiredRef.current && !holdRef.current) { window.clearTimeout(restartTimer.current); restartTimer.current = window.setTimeout(() => { if (desiredRef.current && !holdRef.current) startRecognition() }, 300) }
        else if (!desiredRef.current) setVoiceState('muted')
      }
    }
    if (!desiredRef.current || holdRef.current) return
    try { recognition.start() } catch { /* recognition is already active */ }
  }, [])
  const resume = useCallback(() => { if (!desiredRef.current) return; holdRef.current = false; startRecognition() }, [startRecognition])
  const setSpeaking = useCallback(() => { if (desiredRef.current) { holdRef.current = true; recognitionRef.current?.stop(); setVoiceState('speaking') } }, [])
  const mute = useCallback(() => { desiredRef.current = false; holdRef.current = true; window.clearTimeout(restartTimer.current); recognitionRef.current?.stop(); setVoiceState('muted') }, [])
  const toggle = useCallback(() => { if (desiredRef.current) mute(); else { desiredRef.current = true; holdRef.current = false; setError(''); startRecognition() } }, [mute, startRecognition])
  useEffect(() => { startRecognition(); return () => { desiredRef.current = false; window.clearTimeout(restartTimer.current); recognitionRef.current?.stop() } }, [startRecognition])
  return { toggle, mute, resume, setSpeaking, supported, voiceState, error }
}

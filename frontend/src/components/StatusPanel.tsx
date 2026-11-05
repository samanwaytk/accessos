import type { VoiceState } from '../hooks/useSpeechRecognition'
type Props = { connected: boolean; voiceState: VoiceState }

export default function StatusPanel({ connected, voiceState }: Props) {
  return (
    <section className="status-grid" aria-label="System status">
      <div className="status-item"><span className={`dot ${connected ? 'online' : ''}`} /><div><small>Backend</small><strong>{connected ? 'Connected' : 'Disconnected'}</strong></div></div>
      <div className="status-item"><span className={`dot ${voiceState === 'listening' ? 'online' : ''}`} /><div><small>Microphone</small><strong>{voiceState === 'muted' ? 'Muted' : voiceState === 'listening' ? 'Listening' : 'Paused'}</strong></div></div>
      <div className="status-item"><span className={`dot ${voiceState === 'processing' || voiceState === 'speaking' ? 'online' : ''}`} /><div><small>Assistant</small><strong>{voiceState === 'processing' ? 'Processing' : voiceState === 'speaking' ? 'Speaking' : 'Ready'}</strong></div></div>
    </section>
  )
}

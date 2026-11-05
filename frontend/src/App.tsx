import { useCallback, useEffect, useRef, useState } from 'react'
import StatusPanel from './components/StatusPanel'
import { AccessOSSocket } from './services/accessosSocket'
import { useSpeechRecognition } from './hooks/useSpeechRecognition'
import { parseVoiceCommand } from './utils/voiceCommand'
import { useCamera } from './hooks/useCamera'
import { analyzeFrame, clearMemory } from './services/visionApi'

export default function App() {
  const socketRef = useRef<AccessOSSocket | null>(null)
  const [connected, setConnected] = useState(false)
  const [transcript, setTranscript] = useState('Allow microphone access, then speak naturally.')
  const [reply, setReply] = useState('Allow microphone access and ask a question, or use the keyboard fallback.')
  const [busy, setBusy] = useState(false)
  const [manualCommand, setManualCommand] = useState('')
  const [frame, setFrame] = useState('')
  const sessionRef = useRef(crypto.randomUUID())
  const speechTokenRef = useRef(0)
  const camera = useCamera()

  useEffect(() => {
    const socket = new AccessOSSocket((state) => setConnected(state === 'connected'))
    socketRef.current = socket
    socket.connect().then(() => setConnected(true)).catch(() => setConnected(false))
    return () => socket.close()
  }, [])

  const speak = useCallback((text: string) => {
    const token = ++speechTokenRef.current
    if (!('speechSynthesis' in window)) { recognition.resume(); return }
    recognition.setSpeaking()
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-IN'
    utterance.rate = 0.95
    const resumeAfterSpeech = () => { if (speechTokenRef.current === token) recognition.resume() }
    utterance.onend = resumeAfterSpeech
    utterance.onerror = resumeAfterSpeech
    window.speechSynthesis.speak(utterance)
  }, [])

  const askVision = useCallback(async (image: string, question?: string, mode: 'scene' | 'ocr' = 'scene') => {
    setBusy(true)
    try {
      const result = await analyzeFrame(image, question, sessionRef.current, mode)
      setReply(result.answer)
      speak(result.answer)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not analyze the image.'
      setReply(message); speak(message)
    } finally { setBusy(false) }
  }, [speak])

  const startCamera = useCallback(async () => {
    const started = await camera.start()
    if (started) { const message = 'Camera started. You can say capture when you are ready.'; setReply(message); speak(message) }
    else { const message = camera.error || 'I could not start the camera. Check camera permission and try again.'; setReply(message); speak(message) }
  }, [camera, speak])

  const captureFrame = useCallback(async () => {
    if (camera.state !== 'active') {
      const message = 'The camera is currently off. Say start camera to enable it.'
      setReply(message); speak(message); return
    }
    try { const image = await camera.capture(); setFrame(image); await askVision(image) }
    catch (error) { const message = error instanceof Error ? error.message : 'Could not capture frame.'; setReply(message); speak(message) }
  }, [camera, askVision, speak])

  const stopCamera = useCallback(() => {
    camera.stop()
    const message = 'Camera stopped.'
    setReply(message); speak(message)
  }, [camera, speak])

  const resetMemory = useCallback(async () => {
    try { await clearMemory(sessionRef.current); sessionRef.current = crypto.randomUUID(); setFrame(''); const message = 'Session memory cleared.'; setReply(message); speak(message) }
    catch (error) { const message = error instanceof Error ? error.message : 'Could not clear session memory.'; setReply(message); speak(message) }
  }, [speak])

  const processCommand = useCallback(async (raw: string) => {
    setTranscript(raw)
    const parsed = parseVoiceCommand(raw)
    if (!parsed) return
    if (!parsed.command) {
      const prompt = 'I am listening. What would you like me to do?'
      setReply(prompt); speak(prompt); return
    }
    if (parsed.isStopCommand) {
      window.speechSynthesis.cancel()
      const prompt = 'Okay. I will stop listening now.'
      setReply(prompt); recognition.mute(); speak(prompt); return
    }
    if (parsed.action === 'camera_start') { await startCamera(); return }
    if (parsed.action === 'camera_stop') { stopCamera(); return }
    if (parsed.action === 'capture') { await captureFrame(); return }
    if (parsed.action === 'clear_memory') { await resetMemory(); return }
    if (parsed.action === 'read_text') {
      if (!frame) { const message = 'There is no captured frame to read. Start the camera and say capture first.'; setReply(message); speak(message); return }
      await askVision(frame, parsed.command, 'ocr')
      return
    }
    if (frame) {
      await askVision(frame, parsed.command)
      return
    }
    setBusy(true)
    try {
      const result = await socketRef.current?.sendCommand(parsed.command)
      const text = result?.text || 'I could not get a response from the assistant.'
      setReply(text)
      speak(text)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong.'
      setReply(message); speak(message)
    } finally { setBusy(false) }
  }, [speak, frame, askVision, startCamera, stopCamera, captureFrame, resetMemory])

  const recognition = useSpeechRecognition(processCommand)

  const sendManual = async () => {
    if (!manualCommand.trim()) return
    await processCommand(manualCommand)
    setManualCommand('')
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand-mark" aria-hidden="true">A</div>
        <div><p className="eyebrow">VOICE-FIRST ACCESSIBILITY</p><h1>AccessOS</h1></div>
        <span className="version">V2 · LOCAL</span>
      </header>

      <section className="hero">
        <p className="eyebrow">SEE · UNDERSTAND · EXPLAIN</p>
        <h2>Your world, explained<br /><span>through conversation.</span></h2>
        <p className="intro">A voice-first assistant foundation designed to help visually impaired users understand visual information independently.</p>
        <button className={`listen-button ${recognition.voiceState !== 'muted' ? 'active' : ''}`} onClick={recognition.toggle} aria-pressed={recognition.voiceState !== 'muted'}>
          <span className="mic-icon" aria-hidden="true">●</span>
          {recognition.voiceState === 'muted' ? 'Resume listening' : 'Mute microphone'}
        </button>
        <p className="hint">Allow microphone access, then speak naturally. AccessOS pauses while it replies.</p>
      </section>

      <StatusPanel connected={connected} voiceState={recognition.voiceState} />

      {(recognition.error || !recognition.supported) && <div className="notice" role="alert">{recognition.error}</div>}
      {!connected && <div className="notice" role="status">Backend is not connected. Start the FastAPI server on port 8000.</div>}

      <section className="camera-card">
        <div className="section-heading"><h3>Camera capture</h3><span>{camera.state === 'active' ? 'Camera active' : camera.state === 'denied' ? 'Permission denied' : 'Camera off'}</span></div>
        {camera.error && <div className="notice" role="alert">{camera.error}</div>}
        <video ref={camera.videoRef} className="camera-preview" autoPlay muted playsInline aria-label="Live camera preview" />
        {frame && <img className="capture-thumb" src={frame} alt="Most recently captured camera frame" />}
        <div className="camera-actions">
          {camera.state !== 'active' ? <button onClick={() => void startCamera()}>Start camera</button> : <><button onClick={() => void captureFrame()} disabled={busy}>Capture & analyze</button><button className="secondary" onClick={stopCamera}>Stop camera</button></>}
        </div>
      </section>

      <section className="conversation" aria-live="polite">
        <div className="section-heading"><h3>Assistant response</h3><span>{busy ? 'Thinking…' : 'Ready'}</span></div>
        <p className="response">{reply}</p>
        <div className="transcript"><small>LAST HEARD</small><p>{transcript}</p></div>
      </section>

      <section className="manual">
        <label htmlFor="manual-command">Ask about the captured frame (keyboard fallback)</label>
        <div className="manual-row">
          <input id="manual-command" value={manualCommand} onChange={e => setManualCommand(e.target.value)} onKeyDown={e => e.key === 'Enter' && void sendManual()} placeholder="Type a command…" />
          <button onClick={() => void sendManual()} disabled={!manualCommand.trim() || busy}>Send</button>
        </div>
        <div className="camera-actions"><button className="secondary" onClick={() => void resetMemory()}>Clear session memory</button></div>
      </section>

      <footer><span>AccessOS V2</span><span>Frames are processed on demand and are not stored by AccessOS.</span></footer>
    </main>
  )
}

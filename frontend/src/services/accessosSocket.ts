const WS_URL = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8000/api/ws/assistant'

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting'

export type AssistantReply = {
  type: 'assistant_reply'
  request_id: string
  text: string
  intent: string
}

type ErrorReply = { type: 'error'; request_id?: string; text: string }
type PendingRequest = { resolve: (reply: AssistantReply) => void; reject: (error: Error) => void; timeout: number }

export class AccessOSSocket {
  private socket?: WebSocket
  private pending = new Map<string, PendingRequest>()
  private reconnectAttempts = 0
  private reconnectTimer?: number
  private explicitlyClosed = false

  constructor(private readonly onStateChange?: (state: ConnectionState) => void) {}

  connect(): Promise<void> {
    this.explicitlyClosed = false
    this.onStateChange?.(this.reconnectAttempts ? 'reconnecting' : 'connecting')
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(WS_URL)
      this.socket = socket
      socket.onopen = () => {
        this.reconnectAttempts = 0
        this.onStateChange?.('connected')
        resolve()
      }
      socket.onmessage = (event) => this.handleMessage(event)
      socket.onerror = () => reject(new Error('Could not connect to AccessOS backend.'))
      socket.onclose = () => {
        this.onStateChange?.('disconnected')
        this.rejectPending('Backend connection was closed.')
        if (!this.explicitlyClosed) this.scheduleReconnect()
      }
    })
  }

  sendCommand(text: string): Promise<AssistantReply> {
    return new Promise((resolve, reject) => {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        reject(new Error('Backend is disconnected. Start the FastAPI server and try again.'))
        return
      }
      const requestId = crypto.randomUUID()
      const timeout = window.setTimeout(() => {
        this.pending.delete(requestId)
        reject(new Error('Backend response timed out.'))
      }, 10000)
      this.pending.set(requestId, { resolve, reject, timeout })
      this.socket.send(JSON.stringify({ type: 'command', request_id: requestId, text }))
    })
  }

  close() {
    this.explicitlyClosed = true
    window.clearTimeout(this.reconnectTimer)
    this.rejectPending('Assistant connection closed.')
    this.socket?.close()
    this.socket = undefined
  }

  private handleMessage(event: MessageEvent) {
    let data: AssistantReply | ErrorReply
    try {
      data = JSON.parse(String(event.data)) as AssistantReply | ErrorReply
    } catch {
      return
    }
    const requestId = data.request_id
    if (!requestId) return
    const pending = this.pending.get(requestId)
    if (!pending) return
    window.clearTimeout(pending.timeout)
    this.pending.delete(requestId)
    if (data.type === 'assistant_reply') pending.resolve(data)
    else pending.reject(new Error(data.text))
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= 3 || this.reconnectTimer) return
    const delay = 500 * 2 ** this.reconnectAttempts++
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = undefined
      void this.connect().catch(() => undefined)
    }, delay)
  }

  private rejectPending(message: string) {
    for (const pending of this.pending.values()) {
      window.clearTimeout(pending.timeout)
      pending.reject(new Error(message))
    }
    this.pending.clear()
  }
}

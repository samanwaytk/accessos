export type ParsedVoiceCommand = {
  command: string
  wakeDetected: boolean
  isStopCommand: boolean
  action: 'camera_start' | 'camera_stop' | 'capture' | 'clear_memory' | 'read_text' | 'general' | 'stop_listening'
}

const STOP_PATTERNS = ['stop listening', 'pause listening', 'go to sleep']
const ACTION_PATTERNS: Array<[ParsedVoiceCommand['action'], RegExp]> = [
  ['clear_memory', /^(?:clear(?:\s+(?:memory|session(?:\s+memory)?))?|forget\s+everything(?:\s+you\s+saw)?)\s*[.!?]?$/i],
  ['camera_start', /\b(start|open|turn on|enable)\b.*\bcamera\b/i],
  ['camera_stop', /\b(stop|close|turn off|disable)\b.*\bcamera\b/i],
  ['capture', /\b(capture|take)\b.*\b(image|picture|photo|frame)\b|^\s*capture\s*$/i],
  ['read_text', /\b(read\s+(this\s+)?(page|label|text)|read\s+the\s+text\s+in\s+front\s+of\s+me|what\s+is\s+written\s+here)\b/i],
]

export function parseVoiceCommand(transcript: string): ParsedVoiceCommand | null {
  const cleaned = transcript.trim().replace(/\s+/g, ' ')
  if (!cleaned) return null

  const command = cleaned
  const normalizedCommand = command.toLowerCase()
  const isStopCommand = STOP_PATTERNS.some((pattern) => normalizedCommand.includes(pattern))
  const action = isStopCommand ? 'stop_listening' : ACTION_PATTERNS.find(([, pattern]) => pattern.test(command))?.[0] ?? 'general'

  return {
    command,
    wakeDetected: false,
    isStopCommand,
    action,
  }
}

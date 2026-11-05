import { describe, expect, it } from 'vitest'
import { parseVoiceCommand } from './voiceCommand'

describe('parseVoiceCommand', () => {
  it('accepts a complete command without a wake phrase', () => {
    expect(parseVoiceCommand('what can you do?')).toMatchObject({
      command: 'what can you do?',
      wakeDetected: false,
      isStopCommand: false,
      action: 'general',
    })
  })

  it('keeps AccessOS as ordinary command text when spoken', () => {
    expect(parseVoiceCommand('AccessOS what can you do?')?.command).toBe('AccessOS what can you do?')
  })

  it('recognizes a stop command', () => {
    expect(parseVoiceCommand('stop listening')?.isStopCommand).toBe(true)
  })

  it.each([
    ['open camera', 'camera_start'], ['close camera', 'camera_stop'], ['take a picture', 'capture'],
    ['read the text in front of me', 'read_text'],
  ] as const)('maps %s to one camera or memory action', (spoken, action) => {
    expect(parseVoiceCommand(spoken)?.action).toBe(action)
  })

  it.each(['Clear', 'Clear memory', 'Clear session', 'Clear session memory', 'Forget everything', 'Forget everything you saw'])('maps %s to visual session-memory clearing', spoken => {
    expect(parseVoiceCommand(spoken)?.action).toBe('clear_memory')
  })
})

import { useCallback, useEffect, useRef, useState } from 'react'

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [state, setState] = useState<'off' | 'active' | 'denied' | 'error'>('off')
  const [error, setError] = useState('')
  const stop = useCallback(() => { streamRef.current?.getTracks().forEach(track => track.stop()); streamRef.current = null; if (videoRef.current) videoRef.current.srcObject = null; setState('off') }, [])
  const start = useCallback(async (): Promise<boolean> => {
    if (!navigator.mediaDevices?.getUserMedia) { setError('Camera access is not supported in this browser.'); setState('error'); return false }
    try { setError(''); const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false }); streamRef.current = stream; if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play() }; setState('active'); return true }
    catch (cause) { const name = cause instanceof DOMException ? cause.name : ''; setState(name === 'NotAllowedError' ? 'denied' : 'error'); setError(name === 'NotAllowedError' ? 'Camera permission was denied. Allow it in browser settings and try again.' : 'Could not start the camera. Check that a camera is available.'); return false }
  }, [])
  const capture = useCallback((): Promise<string> => new Promise((resolve, reject) => { const video = videoRef.current; if (!video || !video.videoWidth) { reject(new Error('Start the camera before capturing a frame.')); return }; const scale = Math.min(1, 1280 / video.videoWidth); const canvas = document.createElement('canvas'); canvas.width = Math.round(video.videoWidth * scale); canvas.height = Math.round(video.videoHeight * scale); canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height); resolve(canvas.toDataURL('image/jpeg', .78)) }), [])
  useEffect(() => () => { streamRef.current?.getTracks().forEach(track => track.stop()) }, [])
  return { videoRef, state, error, start, stop, capture }
}

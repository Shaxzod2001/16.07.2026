import { useEffect, useRef, useState } from 'react'

export function useCamera(): {
  videoRef: React.RefObject<HTMLVideoElement>
  error: string | null
  ready: boolean
} {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let stream: MediaStream | null = null
    let cancelled = false
    const video = videoRef.current

    const onLoadedMetadata = (): void => setReady(true)
    video?.addEventListener('loadedmetadata', onLoadedMetadata)

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 }, audio: false })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop())
          return
        }
        stream = s
        if (video) {
          video.srcObject = s
          video.play().catch(() => {
            // autoplay hech narsa qilmasa ham video srcObject o'rnatilgan bo'ladi
          })
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Kameraga ulanib bo'lmadi")
      })

    return () => {
      cancelled = true
      video?.removeEventListener('loadedmetadata', onLoadedMetadata)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  return { videoRef, error, ready }
}

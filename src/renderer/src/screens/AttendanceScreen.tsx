import { useEffect, useState } from 'react'
import type { AttendanceType } from '../../../shared/types'
import { useCamera } from '../hooks/useCamera'
import { api } from '../lib/api'
import { detectFaceDescriptor, findBestMatch, loadFaceModels } from '../lib/face'

interface ResultState {
  kind: 'success' | 'error'
  message: string
}

export default function AttendanceScreen(): JSX.Element {
  const { videoRef, error: cameraError } = useCamera()
  const [modelsReady, setModelsReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<ResultState | null>(null)

  useEffect(() => {
    loadFaceModels().then(() => setModelsReady(true))
  }, [])

  async function handlePunch(type: AttendanceType): Promise<void> {
    if (!videoRef.current || !modelsReady || busy) return
    setBusy(true)
    setResult(null)
    try {
      const descriptor = await detectFaceDescriptor(videoRef.current)
      if (!descriptor) {
        setResult({ kind: 'error', message: "Yuz aniqlanmadi. Kameraga to'g'ri qarang." })
        return
      }
      const employees = await api.listEmployees()
      const match = findBestMatch(descriptor, employees)
      if (!match) {
        setResult({
          kind: 'error',
          message: "Siz tanilmadingiz. Avval 'Xodimlar' bo'limida ro'yxatdan o'ting."
        })
        return
      }
      await api.recordAttendance(match.employee.id, type)
      const label = type === 'in' ? 'Kirish' : 'Chiqish'
      const now = new Date().toLocaleTimeString('uz-UZ')
      setResult({
        kind: 'success',
        message: `${match.employee.name}: ${label} qayd qilindi (${now})`
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="screen attendance-screen">
      <h2>Davomat</h2>
      <video ref={videoRef} autoPlay muted playsInline className="camera-preview large" />
      {cameraError && <p className="error">Kamera xatosi: {cameraError}</p>}
      {!modelsReady && <p>Yuz-tanish modeli yuklanmoqda...</p>}

      <div className="punch-actions">
        <button disabled={!modelsReady || busy} onClick={() => handlePunch('in')}>
          Kirish
        </button>
        <button
          className="secondary"
          disabled={!modelsReady || busy}
          onClick={() => handlePunch('out')}
        >
          Chiqish
        </button>
      </div>

      {busy && <p className="status">Tekshirilmoqda...</p>}
      {result && <p className={result.kind === 'success' ? 'success' : 'error'}>{result.message}</p>}
    </div>
  )
}

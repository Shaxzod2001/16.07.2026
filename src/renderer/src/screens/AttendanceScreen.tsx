import { useEffect, useRef, useState } from 'react'
import type { Employee } from '../../../shared/types'
import { useCamera } from '../hooks/useCamera'
import { api } from '../lib/api'
import { detectFaceDescriptor, findBestMatch, loadFaceModels } from '../lib/face'

const SCAN_INTERVAL_MS = 1800
const COOLDOWN_MS = 5000

interface ResultState {
  kind: 'success' | 'error'
  message: string
}

export default function AttendanceScreen(): JSX.Element {
  const { videoRef, error: cameraError, ready: cameraReady } = useCamera()
  const [modelsReady, setModelsReady] = useState(false)
  const [scanning, setScanning] = useState(true)
  const [confirmBusy, setConfirmBusy] = useState(false)
  const [result, setResult] = useState<ResultState | null>(null)
  const [confirmEmployee, setConfirmEmployee] = useState<Employee | null>(null)
  const cooldownRef = useRef<number | null>(null)
  const busyRef = useRef(false)

  useEffect(() => {
    loadFaceModels().then(() => setModelsReady(true))
  }, [])

  useEffect(() => {
    return () => {
      if (cooldownRef.current) window.clearTimeout(cooldownRef.current)
    }
  }, [])

  useEffect(() => {
    if (!modelsReady || !cameraReady || !scanning || confirmEmployee) return
    const interval = window.setInterval(() => {
      void scanOnce()
    }, SCAN_INTERVAL_MS)
    return () => window.clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelsReady, cameraReady, scanning, confirmEmployee])

  function pauseWithCooldown(): void {
    setScanning(false)
    if (cooldownRef.current) window.clearTimeout(cooldownRef.current)
    cooldownRef.current = window.setTimeout(() => {
      setResult(null)
      setScanning(true)
    }, COOLDOWN_MS)
  }

  async function scanOnce(): Promise<void> {
    if (!videoRef.current || busyRef.current) return
    busyRef.current = true
    try {
      const descriptor = await detectFaceDescriptor(videoRef.current)
      if (!descriptor) return

      const employees = await api.listEmployees()
      const match = findBestMatch(descriptor, employees)
      if (!match) return

      const lastType = await api.lastAttendanceType(match.employee.id)
      if (lastType === 'in') {
        setConfirmEmployee(match.employee)
        return
      }

      const log = await api.recordAttendance(match.employee.id, 'in')
      const time = log.timestamp.slice(11, 16)
      setResult({
        kind: 'success',
        message: `Xush kelibsiz, ${match.employee.name}! Kirish muvaffaqiyatli qayd qilindi (${time})`
      })
      pauseWithCooldown()
    } catch {
      // Vaqtinchalik xatolarda jim davom etamiz, keyingi tsiklda qayta urinamiz
    } finally {
      busyRef.current = false
    }
  }

  async function confirmCheckout(shouldCheckout: boolean): Promise<void> {
    if (!confirmEmployee || confirmBusy) return
    setConfirmBusy(true)
    try {
      if (shouldCheckout) {
        const log = await api.recordAttendance(confirmEmployee.id, 'out')
        const time = log.timestamp.slice(11, 16)
        setResult({
          kind: 'success',
          message: `Xayr, ${confirmEmployee.name}! Chiqish muvaffaqiyatli qayd qilindi (${time})`
        })
      } else {
        setResult(null)
      }
      setConfirmEmployee(null)
      pauseWithCooldown()
    } finally {
      setConfirmBusy(false)
    }
  }

  return (
    <div className="screen attendance-screen">
      <h2>Davomat</h2>
      <video ref={videoRef} autoPlay muted playsInline className="camera-preview large" />
      {cameraError && <p className="error">Kamera xatosi: {cameraError}</p>}
      {!cameraError && !cameraReady && <p className="status">Kamera ulanmoqda...</p>}
      {!modelsReady && <p>Yuz-tanish modeli yuklanmoqda...</p>}

      {modelsReady && cameraReady && !confirmEmployee && !result && (
        <p className="status">
          {scanning ? 'Yuzingizni kameraga tuting — avtomatik tanilasiz...' : 'Kuting...'}
        </p>
      )}

      {confirmEmployee && (
        <div className="confirm-box">
          <p>
            <strong>{confirmEmployee.name}</strong>, siz hozir ishdasiz. Chiqishni tasdiqlaysizmi?
          </p>
          <div className="punch-actions">
            <button disabled={confirmBusy} onClick={() => confirmCheckout(true)}>
              Ha, chiqaman
            </button>
            <button
              className="secondary"
              disabled={confirmBusy}
              onClick={() => confirmCheckout(false)}
            >
              Yo'q, orqaga
            </button>
          </div>
        </div>
      )}

      {result && <p className={result.kind === 'success' ? 'success' : 'error'}>{result.message}</p>}
    </div>
  )
}

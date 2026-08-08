import { useEffect, useRef, useState } from 'react'
import type { Employee } from '../../../shared/types'
import { useCamera } from '../hooks/useCamera'
import { api } from '../lib/api'
import { averageDescriptors, detectFaceDescriptor, loadFaceModels } from '../lib/face'

const SHOTS_NEEDED = 3

export default function EmployeesScreen(): JSX.Element {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [showForm, setShowForm] = useState(false)

  async function refresh(): Promise<void> {
    setEmployees(await api.listEmployees())
  }

  useEffect(() => {
    refresh()
  }, [])

  async function handleDelete(id: number): Promise<void> {
    if (!confirm("Ushbu xodimni o'chirishni tasdiqlaysizmi?")) return
    await api.deleteEmployee(id)
    refresh()
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <h2>Xodimlar ({employees.length})</h2>
        <button onClick={() => setShowForm(true)}>+ Yangi xodim</button>
      </div>

      {showForm && (
        <EnrollModal
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false)
            refresh()
          }}
        />
      )}

      <table>
        <thead>
          <tr>
            <th></th>
            <th>Ism</th>
            <th>Qo'shilgan sana</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id}>
              <td>{emp.photo && <img src={emp.photo} alt={emp.name} className="thumb" />}</td>
              <td>{emp.name}</td>
              <td>{emp.created_at}</td>
              <td>
                <button className="danger" onClick={() => handleDelete(emp.id)}>
                  O'chirish
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EnrollModal({
  onClose,
  onSaved
}: {
  onClose: () => void
  onSaved: () => void
}): JSX.Element {
  const [name, setName] = useState('')
  const [shots, setShots] = useState<Float32Array[]>([])
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [modelsReady, setModelsReady] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { videoRef, error: cameraError, ready: cameraReady } = useCamera()

  useEffect(() => {
    loadFaceModels().then(() => setModelsReady(true))
  }, [])

  async function captureShot(): Promise<void> {
    if (!videoRef.current || !modelsReady || !cameraReady) return
    setBusy(true)
    setStatus('Yuz aniqlanmoqda...')
    try {
      const descriptor = await detectFaceDescriptor(videoRef.current)
      if (!descriptor) {
        setStatus("Yuz topilmadi. Kameraga qarab turing va qayta urinib ko'ring.")
        return
      }
      setShots((prev) => [...prev, descriptor])
      setStatus(`Rasm olindi (${shots.length + 1}/${SHOTS_NEEDED})`)
    } catch (err) {
      setStatus(
        `Yuz aniqlashda xatolik: ${err instanceof Error ? err.message : "noma'lum xato"}. Qayta urinib ko'ring.`
      )
    } finally {
      setBusy(false)
    }
  }

  async function saveEmployee(): Promise<void> {
    if (!name.trim() || shots.length < SHOTS_NEEDED) return
    setBusy(true)
    try {
      let photo: string | null = null
      const video = videoRef.current
      if (video && canvasRef.current) {
        const canvas = canvasRef.current
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        canvas.getContext('2d')?.drawImage(video, 0, 0)
        photo = canvas.toDataURL('image/jpeg', 0.7)
      }
      const descriptor = averageDescriptors(shots)
      await api.createEmployee({ name: name.trim(), descriptor, photo })
      onSaved()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Yangi xodim qo'shish</h3>
        <input
          placeholder="Xodim ismi"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <video ref={videoRef} autoPlay muted playsInline className="camera-preview" />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        {cameraError && <p className="error">Kamera xatosi: {cameraError}</p>}
        {!cameraError && !cameraReady && <p className="status">Kamera ulanmoqda...</p>}
        {!modelsReady && <p>Yuz-tanish modeli yuklanmoqda...</p>}
        <p className="status">{status}</p>
        <div className="form-actions">
          <button
            type="button"
            disabled={!modelsReady || !cameraReady || busy || shots.length >= SHOTS_NEEDED}
            onClick={captureShot}
          >
            Rasmga olish ({shots.length}/{SHOTS_NEEDED})
          </button>
          <button
            type="button"
            disabled={!name.trim() || shots.length < SHOTS_NEEDED || busy}
            onClick={saveEmployee}
          >
            Saqlash
          </button>
          <button type="button" className="secondary" onClick={onClose}>
            Bekor qilish
          </button>
        </div>
      </div>
    </div>
  )
}

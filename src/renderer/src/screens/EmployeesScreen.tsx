import { useEffect, useRef, useState } from 'react'
import type { Employee } from '../../../shared/types'
import { useCamera } from '../hooks/useCamera'
import { averageDescriptors, detectFaceDescriptor, loadFaceModels } from '../lib/face'

const SHOTS_NEEDED = 3

export default function EmployeesScreen(): JSX.Element {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [shots, setShots] = useState<Float32Array[]>([])
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [modelsReady, setModelsReady] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { videoRef, error: cameraError } = useCamera()

  async function refresh(): Promise<void> {
    setEmployees(await window.api.listEmployees())
  }

  useEffect(() => {
    refresh()
  }, [])

  useEffect(() => {
    if (!showForm) return
    loadFaceModels().then(() => setModelsReady(true))
  }, [showForm])

  function openForm(): void {
    setShowForm(true)
    setName('')
    setShots([])
    setStatus('')
  }

  function closeForm(): void {
    setShowForm(false)
  }

  async function captureShot(): Promise<void> {
    if (!videoRef.current || !modelsReady) return
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
      await window.api.createEmployee({ name: name.trim(), descriptor, photo })
      closeForm()
      refresh()
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(id: number): Promise<void> {
    if (!confirm("Ushbu xodimni o'chirishni tasdiqlaysizmi?")) return
    await window.api.deleteEmployee(id)
    refresh()
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <h2>Xodimlar ({employees.length})</h2>
        <button onClick={openForm}>+ Yangi xodim</button>
      </div>

      {showForm && (
        <div className="modal-backdrop" onClick={closeForm}>
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
            {!modelsReady && <p>Yuz-tanish modeli yuklanmoqda...</p>}
            <p className="status">{status}</p>
            <div className="form-actions">
              <button
                type="button"
                disabled={!modelsReady || busy || shots.length >= SHOTS_NEEDED}
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
              <button type="button" className="secondary" onClick={closeForm}>
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
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
              <td>
                {emp.photo && <img src={emp.photo} alt={emp.name} className="thumb" />}
              </td>
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

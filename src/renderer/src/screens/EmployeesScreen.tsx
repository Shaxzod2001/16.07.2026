import { useEffect, useRef, useState } from 'react'
import type { Employee } from '../../../shared/types'
import { useCamera } from '../hooks/useCamera'
import { api } from '../lib/api'
import { useLanguage } from '../lib/i18n'
import { averageDescriptors, detectFaceDescriptor, loadFaceModels } from '../lib/face'

const SHOTS_NEEDED = 3

export default function EmployeesScreen(): JSX.Element {
  const { t } = useLanguage()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [showForm, setShowForm] = useState(false)

  async function refresh(): Promise<void> {
    setEmployees(await api.listEmployees())
  }

  useEffect(() => {
    refresh()
  }, [])

  async function handleDelete(id: number): Promise<void> {
    if (!confirm(t('confirmDeleteEmployee'))) return
    await api.deleteEmployee(id)
    refresh()
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <h2>{t('employeesTitle', { count: employees.length })}</h2>
        <button onClick={() => setShowForm(true)}>{t('newEmployee')}</button>
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

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th></th>
              <th>{t('colName')}</th>
              <th>{t('colJoined')}</th>
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
                    {t('delete')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
  const { t } = useLanguage()
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
    setStatus(t('detectingFace'))
    try {
      const descriptor = await detectFaceDescriptor(videoRef.current)
      if (!descriptor) {
        setStatus(t('faceNotFound'))
        return
      }
      setShots((prev) => [...prev, descriptor])
      setStatus(t('shotTaken', { count: shots.length + 1, needed: SHOTS_NEEDED }))
    } catch (err) {
      setStatus(
        t('faceDetectError', {
          error: err instanceof Error ? err.message : t('unknownError')
        })
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
        <h3>{t('newEmployeeModalTitle')}</h3>
        <input
          placeholder={t('employeeNamePlaceholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <video ref={videoRef} autoPlay muted playsInline className="camera-preview" />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        {cameraError && <p className="error">{t('cameraError', { error: cameraError })}</p>}
        {!cameraError && !cameraReady && <p className="status">{t('cameraConnecting')}</p>}
        {!modelsReady && <p>{t('modelsLoading')}</p>}
        <p className="status">{status}</p>
        <div className="form-actions">
          <button
            type="button"
            disabled={!modelsReady || !cameraReady || busy || shots.length >= SHOTS_NEEDED}
            onClick={captureShot}
          >
            {t('captureShot', { count: shots.length, needed: SHOTS_NEEDED })}
          </button>
          <button
            type="button"
            disabled={!name.trim() || shots.length < SHOTS_NEEDED || busy}
            onClick={saveEmployee}
          >
            {t('save')}
          </button>
          <button type="button" className="secondary" onClick={onClose}>
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}

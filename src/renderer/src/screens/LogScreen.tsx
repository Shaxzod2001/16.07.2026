import { useEffect, useState } from 'react'
import type { AttendanceLog } from '../../../shared/types'
import { api } from '../lib/api'

export default function LogScreen(): JSX.Element {
  const [logs, setLogs] = useState<AttendanceLog[]>([])

  useEffect(() => {
    api.listAttendance(300).then(setLogs)
  }, [])

  return (
    <div className="screen">
      <h2>Davomat jurnali</h2>
      {logs.length === 0 ? (
        <p className="empty">Hozircha yozuvlar yo'q.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Xodim</th>
              <th>Turi</th>
              <th>Vaqt</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{log.employee_name}</td>
                <td>{log.type === 'in' ? 'Kirish' : 'Chiqish'}</td>
                <td>{log.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

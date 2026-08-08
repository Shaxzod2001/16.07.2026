import { useEffect, useState } from 'react'
import type { AttendanceLog } from '../../../shared/types'
import { api } from '../lib/api'
import { useLanguage } from '../lib/i18n'

export default function LogScreen(): JSX.Element {
  const { t } = useLanguage()
  const [logs, setLogs] = useState<AttendanceLog[]>([])

  useEffect(() => {
    api.listAttendance(300).then(setLogs)
  }, [])

  return (
    <div className="screen">
      <h2>{t('logTitle')}</h2>
      {logs.length === 0 ? (
        <p className="empty">{t('noRecordsYet')}</p>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>{t('colEmployee')}</th>
                <th>{t('colType')}</th>
                <th>{t('colTime')}</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{log.employee_name}</td>
                  <td>{log.type === 'in' ? t('typeIn') : t('typeOut')}</td>
                  <td>{log.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

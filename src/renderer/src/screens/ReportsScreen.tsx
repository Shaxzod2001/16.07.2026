import { useEffect, useState } from 'react'
import type { AttendanceLog, Employee } from '../../../shared/types'
import { api } from '../lib/api'
import { exportToExcel } from '../lib/exportExcel'
import { useLanguage } from '../lib/i18n'
import {
  computeDailySummary,
  computeLateArrivals,
  computePeriodTable
} from '../lib/reports'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function firstDayOfMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function fmtHours(h: number): string {
  return h.toFixed(1)
}

export default function ReportsScreen(): JSX.Element {
  const { t } = useLanguage()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [workStartTime, setWorkStartTime] = useState('09:00')
  const [savingSettings, setSavingSettings] = useState(false)

  const [dailyDate, setDailyDate] = useState(today())
  const [dailyLogs, setDailyLogs] = useState<AttendanceLog[]>([])

  const [periodStart, setPeriodStart] = useState(firstDayOfMonth())
  const [periodEnd, setPeriodEnd] = useState(today())
  const [periodLogs, setPeriodLogs] = useState<AttendanceLog[]>([])

  useEffect(() => {
    api.listEmployees().then(setEmployees)
    api.getSettings().then((s) => setWorkStartTime(s.workStartTime))
  }, [])

  useEffect(() => {
    api.listAttendanceInRange(dailyDate, dailyDate).then(setDailyLogs)
  }, [dailyDate])

  useEffect(() => {
    api.listAttendanceInRange(periodStart, periodEnd).then(setPeriodLogs)
  }, [periodStart, periodEnd])

  async function saveWorkStartTime(): Promise<void> {
    setSavingSettings(true)
    try {
      const updated = await api.updateSettings({ workStartTime })
      setWorkStartTime(updated.workStartTime)
    } finally {
      setSavingSettings(false)
    }
  }

  const dailyRows = computeDailySummary(employees, dailyLogs, dailyDate, workStartTime)
  const periodRows = computePeriodTable(employees, periodLogs, periodStart, periodEnd, workStartTime)
  const lateRows = computeLateArrivals(employees, periodLogs, periodStart, periodEnd, workStartTime)

  return (
    <div className="screen reports-screen">
      <div className="screen-header">
        <h2>{t('reportsTitle')}</h2>
        <div className="work-start-setting">
          <label>{t('workStartTime')}</label>
          <input
            type="time"
            value={workStartTime}
            onChange={(e) => setWorkStartTime(e.target.value)}
          />
          <button onClick={saveWorkStartTime} disabled={savingSettings}>
            {t('save')}
          </button>
        </div>
      </div>

      <section className="report-section">
        <div className="report-section-header">
          <h3>{t('dailySummary')}</h3>
          <input type="date" value={dailyDate} onChange={(e) => setDailyDate(e.target.value)} />
          <button
            onClick={() =>
              exportToExcel(`davomat_${dailyDate}.xlsx`, [
                {
                  name: t('excelSheetDaily'),
                  rows: dailyRows.map((r) => ({
                    [t('colName')]: r.employee.name,
                    [t('colStatus')]: r.present ? t('present') : t('absent'),
                    [t('colArrival')]: r.firstIn ? r.firstIn.slice(11, 16) : '',
                    [t('colDeparture')]: r.stillIn
                      ? t('stillAtWork')
                      : r.lastOut
                        ? r.lastOut.slice(11, 16)
                        : '',
                    [t('colWorkHours')]: Number(fmtHours(r.hoursWorked)),
                    [t('colLate')]: r.late ? `${r.lateMinutes} ${t('minutesFull')}` : ''
                  }))
                }
              ])
            }
          >
            {t('exportExcel')}
          </button>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>{t('colName')}</th>
                <th>{t('colStatus')}</th>
                <th>{t('colArrival')}</th>
                <th>{t('colDeparture')}</th>
                <th>{t('colWorkHours')}</th>
                <th>{t('colLate')}</th>
              </tr>
            </thead>
            <tbody>
              {dailyRows.map((r) => (
                <tr key={r.employee.id}>
                  <td>{r.employee.name}</td>
                  <td>{r.present ? t('present') : t('absent')}</td>
                  <td>{r.firstIn ? r.firstIn.slice(11, 16) : '—'}</td>
                  <td>{r.stillIn ? t('stillAtWork') : r.lastOut ? r.lastOut.slice(11, 16) : '—'}</td>
                  <td>{r.present ? fmtHours(r.hoursWorked) : '—'}</td>
                  <td className={r.late ? 'error' : ''}>
                    {r.late ? `${r.lateMinutes} ${t('minutesShort')}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="report-section">
        <div className="report-section-header">
          <h3>{t('periodTable')}</h3>
          <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
          <span>—</span>
          <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
          <button
            onClick={() =>
              exportToExcel(`davr_${periodStart}_${periodEnd}.xlsx`, [
                {
                  name: t('excelSheetPeriod'),
                  rows: periodRows.map((r) => ({
                    [t('colName')]: r.employee.name,
                    [t('colDaysPresent')]: r.daysPresent,
                    [t('colTotalHours')]: Number(fmtHours(r.totalHours)),
                    [t('colLateDays')]: r.lateDays
                  }))
                }
              ])
            }
          >
            {t('exportExcel')}
          </button>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>{t('colName')}</th>
                <th>{t('colDaysPresent')}</th>
                <th>{t('colTotalHours')}</th>
                <th>{t('colLateDays')}</th>
              </tr>
            </thead>
            <tbody>
              {periodRows.map((r) => (
                <tr key={r.employee.id}>
                  <td>{r.employee.name}</td>
                  <td>{r.daysPresent}</td>
                  <td>{fmtHours(r.totalHours)}</td>
                  <td>{r.lateDays > 0 ? r.lateDays : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="report-section">
        <div className="report-section-header">
          <h3>{t('lateArrivalsList')}</h3>
          <span className="status">
            ({periodStart} — {periodEnd})
          </span>
          <button
            onClick={() =>
              exportToExcel(`kechikkanlar_${periodStart}_${periodEnd}.xlsx`, [
                {
                  name: t('excelSheetLate'),
                  rows: lateRows.map((r) => ({
                    [t('colName')]: r.employeeName,
                    [t('colDate')]: r.date,
                    [t('colArrival')]: r.arrivalTime,
                    [t('excelColLateMinutes')]: r.lateMinutes
                  }))
                }
              ])
            }
          >
            {t('exportExcel')}
          </button>
        </div>
        {lateRows.length === 0 ? (
          <p className="empty">{t('noLateArrivals')}</p>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{t('colName')}</th>
                  <th>{t('colDate')}</th>
                  <th>{t('colArrival')}</th>
                  <th>{t('colLate')}</th>
                </tr>
              </thead>
              <tbody>
                {lateRows.map((r, i) => (
                  <tr key={`${r.employeeId}-${r.date}-${i}`}>
                    <td>{r.employeeName}</td>
                    <td>{r.date}</td>
                    <td>{r.arrivalTime}</td>
                    <td className="error">
                      {r.lateMinutes} {t('minutesShort')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

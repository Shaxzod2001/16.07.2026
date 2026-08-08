import { useEffect, useState } from 'react'
import type { AttendanceLog, Employee } from '../../../shared/types'
import { api } from '../lib/api'
import { exportToExcel } from '../lib/exportExcel'
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
        <h2>Hisobotlar</h2>
        <div className="work-start-setting">
          <label>Ish boshlanish vaqti:</label>
          <input
            type="time"
            value={workStartTime}
            onChange={(e) => setWorkStartTime(e.target.value)}
          />
          <button onClick={saveWorkStartTime} disabled={savingSettings}>
            Saqlash
          </button>
        </div>
      </div>

      <section className="report-section">
        <div className="report-section-header">
          <h3>Kunlik xulosa</h3>
          <input type="date" value={dailyDate} onChange={(e) => setDailyDate(e.target.value)} />
          <button
            onClick={() =>
              exportToExcel(`davomat_${dailyDate}.xlsx`, [
                {
                  name: 'Kunlik',
                  rows: dailyRows.map((r) => ({
                    Ism: r.employee.name,
                    Holati: r.present ? 'Keldi' : 'Kelmadi',
                    'Kelgan vaqti': r.firstIn ? r.firstIn.slice(11, 16) : '',
                    'Ketgan vaqti': r.stillIn ? 'Hali ishda' : r.lastOut ? r.lastOut.slice(11, 16) : '',
                    'Ish soati': Number(fmtHours(r.hoursWorked)),
                    Kechikish: r.late ? `${r.lateMinutes} daqiqa` : ''
                  }))
                }
              ])
            }
          >
            Excel'ga yuklash
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Ism</th>
              <th>Holati</th>
              <th>Kelgan vaqti</th>
              <th>Ketgan vaqti</th>
              <th>Ish soati</th>
              <th>Kechikish</th>
            </tr>
          </thead>
          <tbody>
            {dailyRows.map((r) => (
              <tr key={r.employee.id}>
                <td>{r.employee.name}</td>
                <td>{r.present ? 'Keldi' : 'Kelmadi'}</td>
                <td>{r.firstIn ? r.firstIn.slice(11, 16) : '—'}</td>
                <td>{r.stillIn ? 'Hali ishda' : r.lastOut ? r.lastOut.slice(11, 16) : '—'}</td>
                <td>{r.present ? fmtHours(r.hoursWorked) : '—'}</td>
                <td className={r.late ? 'error' : ''}>{r.late ? `${r.lateMinutes} daq.` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="report-section">
        <div className="report-section-header">
          <h3>Davr bo'yicha jadval</h3>
          <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
          <span>—</span>
          <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
          <button
            onClick={() =>
              exportToExcel(`davr_${periodStart}_${periodEnd}.xlsx`, [
                {
                  name: 'Davr',
                  rows: periodRows.map((r) => ({
                    Ism: r.employee.name,
                    'Kelgan kunlar': r.daysPresent,
                    'Umumiy soat': Number(fmtHours(r.totalHours)),
                    'Kechikkan kunlar': r.lateDays
                  }))
                }
              ])
            }
          >
            Excel'ga yuklash
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Ism</th>
              <th>Kelgan kunlar</th>
              <th>Umumiy soat</th>
              <th>Kechikkan kunlar</th>
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
      </section>

      <section className="report-section">
        <div className="report-section-header">
          <h3>Kechikkanlar ro'yxati</h3>
          <span className="status">
            ({periodStart} — {periodEnd})
          </span>
          <button
            onClick={() =>
              exportToExcel(`kechikkanlar_${periodStart}_${periodEnd}.xlsx`, [
                {
                  name: 'Kechikkanlar',
                  rows: lateRows.map((r) => ({
                    Ism: r.employeeName,
                    Sana: r.date,
                    'Kelgan vaqti': r.arrivalTime,
                    'Kechikish (daqiqa)': r.lateMinutes
                  }))
                }
              ])
            }
          >
            Excel'ga yuklash
          </button>
        </div>
        {lateRows.length === 0 ? (
          <p className="empty">Bu davrda kechikishlar yo'q.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Ism</th>
                <th>Sana</th>
                <th>Kelgan vaqti</th>
                <th>Kechikish</th>
              </tr>
            </thead>
            <tbody>
              {lateRows.map((r, i) => (
                <tr key={`${r.employeeId}-${r.date}-${i}`}>
                  <td>{r.employeeName}</td>
                  <td>{r.date}</td>
                  <td>{r.arrivalTime}</td>
                  <td className="error">{r.lateMinutes} daq.</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}

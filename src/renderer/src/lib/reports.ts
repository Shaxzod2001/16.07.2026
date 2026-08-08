import type { AttendanceLog, Employee } from '../../../shared/types'

export interface DailySummaryRow {
  employee: Employee
  present: boolean
  firstIn: string | null
  lastOut: string | null
  hoursWorked: number
  late: boolean
  lateMinutes: number
  stillIn: boolean
}

export interface PeriodRow {
  employee: Employee
  daysPresent: number
  totalHours: number
  lateDays: number
}

export interface LateArrivalRow {
  employeeId: number
  employeeName: string
  date: string
  arrivalTime: string
  lateMinutes: number
}

function toDate(timestamp: string): Date {
  return new Date(timestamp.replace(' ', 'T'))
}

function timeOfDay(timestamp: string): string {
  return timestamp.slice(11, 16)
}

function isLate(firstIn: string, workStartTime: string): { late: boolean; lateMinutes: number } {
  const arrival = timeOfDay(firstIn)
  const [ah, am] = arrival.split(':').map(Number)
  const [wh, wm] = workStartTime.split(':').map(Number)
  const diff = ah * 60 + am - (wh * 60 + wm)
  return { late: diff > 0, lateMinutes: Math.max(0, diff) }
}

function computeDaySessions(dayLogs: AttendanceLog[]): {
  firstIn: string | null
  lastOut: string | null
  hours: number
  stillIn: boolean
} {
  const sorted = [...dayLogs].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  let firstIn: string | null = null
  let lastOut: string | null = null
  let openIn: Date | null = null
  let totalMs = 0

  for (const log of sorted) {
    if (log.type === 'in') {
      if (firstIn === null) firstIn = log.timestamp
      if (openIn === null) openIn = toDate(log.timestamp)
    } else {
      lastOut = log.timestamp
      if (openIn) {
        totalMs += toDate(log.timestamp).getTime() - openIn.getTime()
        openIn = null
      }
    }
  }

  return { firstIn, lastOut, hours: totalMs / 3_600_000, stillIn: openIn !== null }
}

export function enumerateDates(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  let cur = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10))
    cur = new Date(cur.getTime() + 86_400_000)
  }
  return dates
}

function logsFor(logs: AttendanceLog[], employeeId: number, date: string): AttendanceLog[] {
  return logs.filter((l) => l.employee_id === employeeId && l.timestamp.slice(0, 10) === date)
}

export function computeDailySummary(
  employees: Employee[],
  logs: AttendanceLog[],
  date: string,
  workStartTime: string
): DailySummaryRow[] {
  return employees.map((employee) => {
    const dayLogs = logsFor(logs, employee.id, date)
    if (dayLogs.length === 0) {
      return {
        employee,
        present: false,
        firstIn: null,
        lastOut: null,
        hoursWorked: 0,
        late: false,
        lateMinutes: 0,
        stillIn: false
      }
    }
    const { firstIn, lastOut, hours, stillIn } = computeDaySessions(dayLogs)
    const lateInfo = firstIn ? isLate(firstIn, workStartTime) : { late: false, lateMinutes: 0 }
    return {
      employee,
      present: true,
      firstIn,
      lastOut,
      hoursWorked: hours,
      late: lateInfo.late,
      lateMinutes: lateInfo.lateMinutes,
      stillIn
    }
  })
}

export function computePeriodTable(
  employees: Employee[],
  logs: AttendanceLog[],
  startDate: string,
  endDate: string,
  workStartTime: string
): PeriodRow[] {
  const dates = enumerateDates(startDate, endDate)
  return employees.map((employee) => {
    let daysPresent = 0
    let totalHours = 0
    let lateDays = 0
    for (const date of dates) {
      const dayLogs = logsFor(logs, employee.id, date)
      if (dayLogs.length === 0) continue
      daysPresent++
      const { firstIn, hours } = computeDaySessions(dayLogs)
      totalHours += hours
      if (firstIn && isLate(firstIn, workStartTime).late) lateDays++
    }
    return { employee, daysPresent, totalHours, lateDays }
  })
}

export function computeLateArrivals(
  employees: Employee[],
  logs: AttendanceLog[],
  startDate: string,
  endDate: string,
  workStartTime: string
): LateArrivalRow[] {
  const dates = enumerateDates(startDate, endDate)
  const result: LateArrivalRow[] = []
  for (const employee of employees) {
    for (const date of dates) {
      const dayLogs = logsFor(logs, employee.id, date)
      if (dayLogs.length === 0) continue
      const { firstIn } = computeDaySessions(dayLogs)
      if (!firstIn) continue
      const { late, lateMinutes } = isLate(firstIn, workStartTime)
      if (late) {
        result.push({
          employeeId: employee.id,
          employeeName: employee.name,
          date,
          arrivalTime: timeOfDay(firstIn),
          lateMinutes
        })
      }
    }
  }
  return result.sort((a, b) => b.date.localeCompare(a.date) || a.employeeName.localeCompare(b.employeeName))
}

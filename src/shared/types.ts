export interface Employee {
  id: number
  name: string
  descriptor: string
  photo: string | null
  created_at: string
}

export interface NewEmployee {
  name: string
  descriptor: number[]
  photo: string | null
}

export type AttendanceType = 'in' | 'out'

export interface AttendanceLog {
  id: number
  employee_id: number
  employee_name: string
  type: AttendanceType
  timestamp: string
}

export interface MatchResult {
  employee: Employee
  distance: number
}

export interface Settings {
  workStartTime: string
}

export interface AttendanceApi {
  listEmployees(): Promise<Employee[]>
  createEmployee(data: NewEmployee): Promise<Employee>
  deleteEmployee(id: number): Promise<void>
  listAttendance(limit?: number): Promise<AttendanceLog[]>
  listAttendanceInRange(startDate: string, endDate: string): Promise<AttendanceLog[]>
  lastAttendanceType(employeeId: number): Promise<AttendanceType | null>
  recordAttendance(employeeId: number, type: AttendanceType): Promise<AttendanceLog>
  getSettings(): Promise<Settings>
  updateSettings(settings: Partial<Settings>): Promise<Settings>
}

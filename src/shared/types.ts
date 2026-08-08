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

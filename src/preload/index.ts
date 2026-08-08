import { contextBridge, ipcRenderer } from 'electron'
import type {
  AttendanceApi,
  AttendanceLog,
  AttendanceType,
  Employee,
  NewEmployee,
  Settings
} from '../shared/types'

const api: AttendanceApi = {
  listEmployees: (): Promise<Employee[]> => ipcRenderer.invoke('employees:list'),
  createEmployee: (data: NewEmployee): Promise<Employee> =>
    ipcRenderer.invoke('employees:create', data),
  deleteEmployee: (id: number): Promise<void> => ipcRenderer.invoke('employees:delete', id),

  listAttendance: (limit = 200): Promise<AttendanceLog[]> =>
    ipcRenderer.invoke('attendance:list', limit),
  listAttendanceInRange: (startDate: string, endDate: string): Promise<AttendanceLog[]> =>
    ipcRenderer.invoke('attendance:listRange', startDate, endDate),
  lastAttendanceType: (employeeId: number): Promise<AttendanceType | null> =>
    ipcRenderer.invoke('attendance:lastType', employeeId),
  recordAttendance: (employeeId: number, type: AttendanceType): Promise<AttendanceLog> =>
    ipcRenderer.invoke('attendance:record', employeeId, type),

  getSettings: (): Promise<Settings> => ipcRenderer.invoke('settings:get'),
  updateSettings: (settings: Partial<Settings>): Promise<Settings> =>
    ipcRenderer.invoke('settings:update', settings)
}

contextBridge.exposeInMainWorld('api', api)

declare global {
  interface Window {
    api?: AttendanceApi
  }
}

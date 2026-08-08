import { contextBridge, ipcRenderer } from 'electron'
import type { AttendanceApi, AttendanceLog, AttendanceType, Employee, NewEmployee } from '../shared/types'

const api: AttendanceApi = {
  listEmployees: (): Promise<Employee[]> => ipcRenderer.invoke('employees:list'),
  createEmployee: (data: NewEmployee): Promise<Employee> =>
    ipcRenderer.invoke('employees:create', data),
  deleteEmployee: (id: number): Promise<void> => ipcRenderer.invoke('employees:delete', id),

  listAttendance: (limit = 200): Promise<AttendanceLog[]> =>
    ipcRenderer.invoke('attendance:list', limit),
  lastAttendanceType: (employeeId: number): Promise<AttendanceType | null> =>
    ipcRenderer.invoke('attendance:lastType', employeeId),
  recordAttendance: (employeeId: number, type: AttendanceType): Promise<AttendanceLog> =>
    ipcRenderer.invoke('attendance:record', employeeId, type)
}

contextBridge.exposeInMainWorld('api', api)

declare global {
  interface Window {
    api?: AttendanceApi
  }
}

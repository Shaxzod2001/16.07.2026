import type {
  AttendanceApi,
  AttendanceLog,
  AttendanceType,
  Employee,
  NewEmployee,
  Settings
} from '../../../shared/types'

const DB_NAME = 'attendance-db'
const DB_VERSION = 2
const EMPLOYEES_STORE = 'employees'
const ATTENDANCE_STORE = 'attendance'
const SETTINGS_STORE = 'settings'

const DEFAULT_SETTINGS: Settings = {
  workStartTime: '09:00'
}

function nowStamp(): string {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(EMPLOYEES_STORE)) {
        db.createObjectStore(EMPLOYEES_STORE, { keyPath: 'id', autoIncrement: true })
      }
      if (!db.objectStoreNames.contains(ATTENDANCE_STORE)) {
        const store = db.createObjectStore(ATTENDANCE_STORE, { keyPath: 'id', autoIncrement: true })
        store.createIndex('employee_id', 'employee_id')
      }
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function listEmployees(): Promise<Employee[]> {
  const db = await openDb()
  const tx = db.transaction(EMPLOYEES_STORE, 'readonly')
  const all = await reqToPromise(tx.objectStore(EMPLOYEES_STORE).getAll())
  return (all as Employee[]).sort((a, b) => a.name.localeCompare(b.name))
}

async function createEmployee(data: NewEmployee): Promise<Employee> {
  const db = await openDb()
  const tx = db.transaction(EMPLOYEES_STORE, 'readwrite')
  const record = {
    name: data.name,
    descriptor: JSON.stringify(data.descriptor),
    photo: data.photo,
    created_at: nowStamp()
  }
  const id = await reqToPromise(tx.objectStore(EMPLOYEES_STORE).add(record))
  return { ...record, id: id as number }
}

async function deleteEmployee(id: number): Promise<void> {
  const db = await openDb()
  const tx = db.transaction([EMPLOYEES_STORE, ATTENDANCE_STORE], 'readwrite')
  tx.objectStore(EMPLOYEES_STORE).delete(id)
  const index = tx.objectStore(ATTENDANCE_STORE).index('employee_id')
  const cursorReq = index.openCursor(IDBKeyRange.only(id))
  await new Promise<void>((resolve, reject) => {
    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result
      if (cursor) {
        cursor.delete()
        cursor.continue()
      } else {
        resolve()
      }
    }
    cursorReq.onerror = () => reject(cursorReq.error)
  })
}

async function lastAttendanceType(employeeId: number): Promise<AttendanceType | null> {
  const db = await openDb()
  const tx = db.transaction(ATTENDANCE_STORE, 'readonly')
  const index = tx.objectStore(ATTENDANCE_STORE).index('employee_id')
  const all = (await reqToPromise(index.getAll(IDBKeyRange.only(employeeId)))) as (AttendanceLog & {
    id: number
  })[]
  if (all.length === 0) return null
  all.sort((a, b) => b.id - a.id)
  return all[0].type
}

async function recordAttendance(employeeId: number, type: AttendanceType): Promise<AttendanceLog> {
  const db = await openDb()
  const employee = (await reqToPromise(
    db.transaction(EMPLOYEES_STORE, 'readonly').objectStore(EMPLOYEES_STORE).get(employeeId)
  )) as Employee | undefined
  if (!employee) throw new Error('Xodim topilmadi')

  const tx = db.transaction(ATTENDANCE_STORE, 'readwrite')
  const record = {
    employee_id: employeeId,
    employee_name: employee.name,
    type,
    timestamp: nowStamp()
  }
  const id = await reqToPromise(tx.objectStore(ATTENDANCE_STORE).add(record))
  return { ...record, id: id as number }
}

async function listAttendance(limit = 200): Promise<AttendanceLog[]> {
  const db = await openDb()
  const tx = db.transaction(ATTENDANCE_STORE, 'readonly')
  const all = (await reqToPromise(tx.objectStore(ATTENDANCE_STORE).getAll())) as AttendanceLog[]
  return all.sort((a, b) => b.id - a.id).slice(0, limit)
}

async function listAttendanceInRange(startDate: string, endDate: string): Promise<AttendanceLog[]> {
  const db = await openDb()
  const tx = db.transaction(ATTENDANCE_STORE, 'readonly')
  const all = (await reqToPromise(tx.objectStore(ATTENDANCE_STORE).getAll())) as AttendanceLog[]
  return all
    .filter((log) => {
      const day = log.timestamp.slice(0, 10)
      return day >= startDate && day <= endDate
    })
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
}

async function getSettings(): Promise<Settings> {
  const db = await openDb()
  const tx = db.transaction(SETTINGS_STORE, 'readonly')
  const rows = (await reqToPromise(tx.objectStore(SETTINGS_STORE).getAll())) as {
    key: string
    value: string
  }[]
  const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]))
  return { ...DEFAULT_SETTINGS, ...stored }
}

async function updateSettings(partial: Partial<Settings>): Promise<Settings> {
  const db = await openDb()
  const tx = db.transaction(SETTINGS_STORE, 'readwrite')
  const store = tx.objectStore(SETTINGS_STORE)
  for (const [key, value] of Object.entries(partial)) {
    if (value !== undefined) store.put({ key, value: String(value) })
  }
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  return getSettings()
}

export const webApi: AttendanceApi = {
  listEmployees,
  createEmployee,
  deleteEmployee,
  listAttendance,
  listAttendanceInRange,
  lastAttendanceType,
  recordAttendance,
  getSettings,
  updateSettings
}

import type {
  AttendanceApi,
  AttendanceLog,
  AttendanceType,
  Employee,
  NewEmployee
} from '../../../shared/types'

const DB_NAME = 'attendance-db'
const DB_VERSION = 1
const EMPLOYEES_STORE = 'employees'
const ATTENDANCE_STORE = 'attendance'

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

export const webApi: AttendanceApi = {
  listEmployees,
  createEmployee,
  deleteEmployee,
  listAttendance,
  lastAttendanceType,
  recordAttendance
}

import Database, { type Database as DatabaseType } from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import type { AttendanceLog, AttendanceType, Employee, NewEmployee } from '../shared/types'

const dbPath = join(app.getPath('userData'), 'attendance.db')
export const db: DatabaseType = new Database(dbPath)

db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    descriptor TEXT NOT NULL,
    photo TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS attendance_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK(type IN ('in','out')),
    timestamp TEXT NOT NULL DEFAULT (datetime('now'))
  );
`)

export function listEmployees(): Employee[] {
  return db.prepare('SELECT * FROM employees ORDER BY name ASC').all() as Employee[]
}

export function createEmployee(data: NewEmployee): Employee {
  const info = db
    .prepare('INSERT INTO employees (name, descriptor, photo) VALUES (@name, @descriptor, @photo)')
    .run({ name: data.name, descriptor: JSON.stringify(data.descriptor), photo: data.photo })
  return db.prepare('SELECT * FROM employees WHERE id = ?').get(info.lastInsertRowid) as Employee
}

export function deleteEmployee(id: number): void {
  db.prepare('DELETE FROM employees WHERE id = ?').run(id)
}

export function lastAttendanceType(employeeId: number): AttendanceType | null {
  const row = db
    .prepare('SELECT type FROM attendance_logs WHERE employee_id = ? ORDER BY id DESC LIMIT 1')
    .get(employeeId) as { type: AttendanceType } | undefined
  return row?.type ?? null
}

export function recordAttendance(employeeId: number, type: AttendanceType): AttendanceLog {
  const info = db
    .prepare('INSERT INTO attendance_logs (employee_id, type) VALUES (?, ?)')
    .run(employeeId, type)
  return db
    .prepare(
      `SELECT a.id, a.employee_id, e.name as employee_name, a.type, a.timestamp
       FROM attendance_logs a JOIN employees e ON e.id = a.employee_id
       WHERE a.id = ?`
    )
    .get(info.lastInsertRowid) as AttendanceLog
}

export function listAttendance(limit = 200): AttendanceLog[] {
  return db
    .prepare(
      `SELECT a.id, a.employee_id, e.name as employee_name, a.type, a.timestamp
       FROM attendance_logs a JOIN employees e ON e.id = a.employee_id
       ORDER BY a.id DESC LIMIT ?`
    )
    .all(limit) as AttendanceLog[]
}

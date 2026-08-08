import Database, { type Database as DatabaseType } from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import type { Customer, NewCustomer } from '../shared/types'

const dbPath = join(app.getPath('userData'), 'crm.db')
export const db: DatabaseType = new Database(dbPath)

db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    company TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`)

export type { Customer, NewCustomer }

export function listCustomers(search = ''): Customer[] {
  if (search.trim()) {
    const like = `%${search.trim()}%`
    return db
      .prepare(
        `SELECT * FROM customers
         WHERE name LIKE ? OR phone LIKE ? OR email LIKE ? OR company LIKE ?
         ORDER BY created_at DESC`
      )
      .all(like, like, like, like) as Customer[]
  }
  return db.prepare('SELECT * FROM customers ORDER BY created_at DESC').all() as Customer[]
}

export function createCustomer(data: NewCustomer): Customer {
  const stmt = db.prepare(
    'INSERT INTO customers (name, phone, email, company, notes) VALUES (@name, @phone, @email, @company, @notes)'
  )
  const info = stmt.run(data)
  return db.prepare('SELECT * FROM customers WHERE id = ?').get(info.lastInsertRowid) as Customer
}

export function updateCustomer(id: number, data: NewCustomer): Customer {
  db.prepare(
    'UPDATE customers SET name=@name, phone=@phone, email=@email, company=@company, notes=@notes WHERE id=@id'
  ).run({ ...data, id })
  return db.prepare('SELECT * FROM customers WHERE id = ?').get(id) as Customer
}

export function deleteCustomer(id: number): void {
  db.prepare('DELETE FROM customers WHERE id = ?').run(id)
}

import { useEffect, useState } from 'react'
import type { Customer } from '../../shared/types'

const emptyForm = { name: '', phone: '', email: '', company: '', notes: '' }

export default function App(): JSX.Element {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)

  async function refresh(q = search): Promise<void> {
    const rows = await window.api.listCustomers(q)
    setCustomers(rows)
  }

  useEffect(() => {
    refresh('')
  }, [])

  useEffect(() => {
    const t = setTimeout(() => refresh(search), 200)
    return () => clearTimeout(t)
  }, [search])

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (!form.name.trim()) return
    if (editingId != null) {
      await window.api.updateCustomer(editingId, form)
    } else {
      await window.api.createCustomer(form)
    }
    setForm(emptyForm)
    setEditingId(null)
    refresh()
  }

  function startEdit(c: Customer): void {
    setEditingId(c.id)
    setForm({
      name: c.name,
      phone: c.phone ?? '',
      email: c.email ?? '',
      company: c.company ?? '',
      notes: c.notes ?? ''
    })
  }

  function cancelEdit(): void {
    setEditingId(null)
    setForm(emptyForm)
  }

  async function handleDelete(id: number): Promise<void> {
    if (!confirm("Ushbu mijozni o'chirishni tasdiqlaysizmi?")) return
    await window.api.deleteCustomer(id)
    if (editingId === id) cancelEdit()
    refresh()
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Mijozlar CRM</h1>
        <input
          className="search"
          placeholder="Qidirish (ism, telefon, email, kompaniya)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </header>

      <main className="app-main">
        <form className="customer-form" onSubmit={handleSubmit}>
          <h2>{editingId != null ? 'Mijozni tahrirlash' : 'Yangi mijoz qo’shish'}</h2>
          <input
            placeholder="Ism *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            placeholder="Telefon"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <input
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            placeholder="Kompaniya"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
          />
          <textarea
            placeholder="Izoh"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <div className="form-actions">
            <button type="submit">{editingId != null ? 'Saqlash' : "Qo'shish"}</button>
            {editingId != null && (
              <button type="button" className="secondary" onClick={cancelEdit}>
                Bekor qilish
              </button>
            )}
          </div>
        </form>

        <section className="customer-list">
          <h2>Mijozlar ({customers.length})</h2>
          {customers.length === 0 ? (
            <p className="empty">Hozircha mijozlar yo'q.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Ism</th>
                  <th>Telefon</th>
                  <th>Email</th>
                  <th>Kompaniya</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.phone}</td>
                    <td>{c.email}</td>
                    <td>{c.company}</td>
                    <td className="row-actions">
                      <button onClick={() => startEdit(c)}>Tahrirlash</button>
                      <button className="danger" onClick={() => handleDelete(c.id)}>
                        O'chirish
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  )
}

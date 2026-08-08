import { useState } from 'react'
import AttendanceScreen from './screens/AttendanceScreen'
import EmployeesScreen from './screens/EmployeesScreen'
import LogScreen from './screens/LogScreen'
import ReportsScreen from './screens/ReportsScreen'

type Tab = 'attendance' | 'employees' | 'log' | 'reports'

const TABS: { id: Tab; label: string }[] = [
  { id: 'attendance', label: 'Davomat' },
  { id: 'employees', label: 'Xodimlar' },
  { id: 'log', label: 'Jurnal' },
  { id: 'reports', label: 'Hisobotlar' }
]

export default function App(): JSX.Element {
  const [tab, setTab] = useState<Tab>('attendance')

  return (
    <div className="app">
      <header className="app-header">
        <h1>Davomat nazorati</h1>
        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={t.id === tab ? 'tab active' : 'tab'}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="app-main">
        {tab === 'attendance' && <AttendanceScreen />}
        {tab === 'employees' && <EmployeesScreen />}
        {tab === 'log' && <LogScreen />}
        {tab === 'reports' && <ReportsScreen />}
      </main>
    </div>
  )
}

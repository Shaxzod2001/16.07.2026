import { useState } from 'react'
import AttendanceScreen from './screens/AttendanceScreen'
import EmployeesScreen from './screens/EmployeesScreen'
import LogScreen from './screens/LogScreen'
import ReportsScreen from './screens/ReportsScreen'
import { useLanguage } from './lib/i18n'

type Tab = 'attendance' | 'employees' | 'log' | 'reports'

export default function App(): JSX.Element {
  const [tab, setTab] = useState<Tab>('attendance')
  const { lang, setLang, t } = useLanguage()

  const TABS: { id: Tab; label: string }[] = [
    { id: 'attendance', label: t('tabAttendance') },
    { id: 'employees', label: t('tabEmployees') },
    { id: 'log', label: t('tabLog') },
    { id: 'reports', label: t('tabReports') }
  ]

  return (
    <div className="app">
      <header className="app-header">
        <h1>{t('appTitle')}</h1>
        <nav className="tabs">
          {TABS.map((tabItem) => (
            <button
              key={tabItem.id}
              className={tabItem.id === tab ? 'tab active' : 'tab'}
              onClick={() => setTab(tabItem.id)}
            >
              {tabItem.label}
            </button>
          ))}
        </nav>
        <div className="lang-switch">
          <button
            className={lang === 'uz' ? 'lang-btn active' : 'lang-btn'}
            onClick={() => setLang('uz')}
          >
            UZ
          </button>
          <button
            className={lang === 'ru' ? 'lang-btn active' : 'lang-btn'}
            onClick={() => setLang('ru')}
          >
            RU
          </button>
        </div>
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

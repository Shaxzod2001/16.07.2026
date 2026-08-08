import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Lang = 'uz' | 'ru'

type Dict = Record<string, string>

const translations: Record<Lang, Dict> = {
  uz: {
    appTitle: 'Davomat nazorati',
    tabAttendance: 'Davomat',
    tabEmployees: 'Xodimlar',
    tabLog: 'Jurnal',
    tabReports: 'Hisobotlar',

    cameraError: 'Kamera xatosi: {error}',
    cameraConnecting: 'Kamera ulanmoqda...',
    modelsLoading: 'Yuz-tanish modeli yuklanmoqda...',
    scanningPrompt: 'Yuzingizni kameraga tuting — avtomatik tanilasiz...',
    waiting: 'Kuting...',
    welcomeCheckin: 'Xush kelibsiz, {name}! Kirish muvaffaqiyatli qayd qilindi ({time})',
    farewellCheckout: 'Xayr, {name}! Chiqish muvaffaqiyatli qayd qilindi ({time})',
    confirmCheckoutQuestion: '{name}, siz hozir ishdasiz. Chiqishni tasdiqlaysizmi?',
    yesCheckout: 'Ha, chiqaman',
    noBack: "Yo'q, orqaga",

    employeesTitle: 'Xodimlar ({count})',
    newEmployee: '+ Yangi xodim',
    colName: 'Ism',
    colJoined: "Qo'shilgan sana",
    delete: "O'chirish",
    confirmDeleteEmployee: "Ushbu xodimni o'chirishni tasdiqlaysizmi?",
    newEmployeeModalTitle: "Yangi xodim qo'shish",
    employeeNamePlaceholder: 'Xodim ismi',
    detectingFace: 'Yuz aniqlanmoqda...',
    faceNotFound: "Yuz topilmadi. Kameraga qarab turing va qayta urinib ko'ring.",
    shotTaken: 'Rasm olindi ({count}/{needed})',
    faceDetectError: "Yuz aniqlashda xatolik: {error}. Qayta urinib ko'ring.",
    unknownError: "noma'lum xato",
    captureShot: 'Rasmga olish ({count}/{needed})',
    save: 'Saqlash',
    cancel: 'Bekor qilish',

    logTitle: 'Davomat jurnali',
    noRecordsYet: "Hozircha yozuvlar yo'q.",
    colEmployee: 'Xodim',
    colType: 'Turi',
    colTime: 'Vaqt',
    typeIn: 'Kirish',
    typeOut: 'Chiqish',

    reportsTitle: 'Hisobotlar',
    workStartTime: 'Ish boshlanish vaqti:',
    dailySummary: 'Kunlik xulosa',
    exportExcel: "Excel'ga yuklash",
    colStatus: 'Holati',
    colArrival: 'Kelgan vaqti',
    colDeparture: 'Ketgan vaqti',
    colWorkHours: 'Ish soati',
    colLate: 'Kechikish',
    present: 'Keldi',
    absent: 'Kelmadi',
    stillAtWork: 'Hali ishda',
    periodTable: "Davr bo'yicha jadval",
    colDaysPresent: 'Kelgan kunlar',
    colTotalHours: 'Umumiy soat',
    colLateDays: 'Kechikkan kunlar',
    lateArrivalsList: "Kechikkanlar ro'yxati",
    noLateArrivals: "Bu davrda kechikishlar yo'q.",
    colDate: 'Sana',
    minutesShort: 'daq.',
    minutesFull: 'daqiqa',

    excelSheetDaily: 'Kunlik',
    excelSheetPeriod: 'Davr',
    excelSheetLate: 'Kechikkanlar',
    excelColLateMinutes: 'Kechikish (daqiqa)'
  },
  ru: {
    appTitle: 'Контроль посещаемости',
    tabAttendance: 'Посещаемость',
    tabEmployees: 'Сотрудники',
    tabLog: 'Журнал',
    tabReports: 'Отчёты',

    cameraError: 'Ошибка камеры: {error}',
    cameraConnecting: 'Подключение камеры...',
    modelsLoading: 'Загрузка модели распознавания лиц...',
    scanningPrompt: 'Смотрите в камеру — вы будете распознаны автоматически...',
    waiting: 'Подождите...',
    welcomeCheckin: 'Добро пожаловать, {name}! Приход успешно зафиксирован ({time})',
    farewellCheckout: 'До свидания, {name}! Уход успешно зафиксирован ({time})',
    confirmCheckoutQuestion: '{name}, вы сейчас на работе. Подтвердить уход?',
    yesCheckout: 'Да, ухожу',
    noBack: 'Нет, назад',

    employeesTitle: 'Сотрудники ({count})',
    newEmployee: '+ Новый сотрудник',
    colName: 'Имя',
    colJoined: 'Дата добавления',
    delete: 'Удалить',
    confirmDeleteEmployee: 'Вы уверены, что хотите удалить этого сотрудника?',
    newEmployeeModalTitle: 'Добавить нового сотрудника',
    employeeNamePlaceholder: 'Имя сотрудника',
    detectingFace: 'Распознавание лица...',
    faceNotFound: 'Лицо не найдено. Смотрите в камеру и попробуйте снова.',
    shotTaken: 'Снимок сделан ({count}/{needed})',
    faceDetectError: 'Ошибка распознавания лица: {error}. Попробуйте снова.',
    unknownError: 'неизвестная ошибка',
    captureShot: 'Сделать снимок ({count}/{needed})',
    save: 'Сохранить',
    cancel: 'Отмена',

    logTitle: 'Журнал посещаемости',
    noRecordsYet: 'Записей пока нет.',
    colEmployee: 'Сотрудник',
    colType: 'Тип',
    colTime: 'Время',
    typeIn: 'Приход',
    typeOut: 'Уход',

    reportsTitle: 'Отчёты',
    workStartTime: 'Время начала работы:',
    dailySummary: 'Дневная сводка',
    exportExcel: 'Скачать Excel',
    colStatus: 'Статус',
    colArrival: 'Время прихода',
    colDeparture: 'Время ухода',
    colWorkHours: 'Часы работы',
    colLate: 'Опоздание',
    present: 'Пришёл',
    absent: 'Не пришёл',
    stillAtWork: 'Ещё на работе',
    periodTable: 'Таблица за период',
    colDaysPresent: 'Дни присутствия',
    colTotalHours: 'Всего часов',
    colLateDays: 'Дни с опозданием',
    lateArrivalsList: 'Список опозданий',
    noLateArrivals: 'За этот период опозданий нет.',
    colDate: 'Дата',
    minutesShort: 'мин.',
    minutesFull: 'минут',

    excelSheetDaily: 'День',
    excelSheetPeriod: 'Период',
    excelSheetLate: 'Опоздания',
    excelColLateMinutes: 'Опоздание (мин.)'
  }
}

interface LanguageContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

const STORAGE_KEY = 'app-lang'

function readStoredLang(): Lang {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'ru' ? 'ru' : 'uz'
  } catch {
    return 'uz'
  }
}

export function LanguageProvider({ children }: { children: ReactNode }): JSX.Element {
  const [lang, setLangState] = useState<Lang>(readStoredLang)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      // localStorage mavjud bo'lmasa (masalan xususiy rejim), jim o'tkazamiz
    }
  }, [lang])

  function t(key: string, params?: Record<string, string | number>): string {
    let str = translations[lang][key] ?? translations.uz[key] ?? key
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        str = str.replaceAll(`{${k}}`, String(v))
      }
    }
    return str
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang: setLangState, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}

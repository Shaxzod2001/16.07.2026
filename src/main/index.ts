import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import {
  createEmployee,
  deleteEmployee,
  lastAttendanceType,
  listAttendance,
  listEmployees,
  recordAttendance
} from './db'
import type { AttendanceType, NewEmployee } from '../shared/types'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1100,
    height: 760,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  ipcMain.handle('employees:list', () => listEmployees())
  ipcMain.handle('employees:create', (_e, data: NewEmployee) => createEmployee(data))
  ipcMain.handle('employees:delete', (_e, id: number) => deleteEmployee(id))

  ipcMain.handle('attendance:list', (_e, limit: number) => listAttendance(limit))
  ipcMain.handle('attendance:lastType', (_e, employeeId: number) => lastAttendanceType(employeeId))
  ipcMain.handle('attendance:record', (_e, employeeId: number, type: AttendanceType) =>
    recordAttendance(employeeId, type)
  )

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

import { contextBridge, ipcRenderer } from 'electron'
import type { Customer, NewCustomer } from '../shared/types'

const api = {
  listCustomers: (search = ''): Promise<Customer[]> => ipcRenderer.invoke('customers:list', search),
  createCustomer: (data: NewCustomer): Promise<Customer> =>
    ipcRenderer.invoke('customers:create', data),
  updateCustomer: (id: number, data: NewCustomer): Promise<Customer> =>
    ipcRenderer.invoke('customers:update', id, data),
  deleteCustomer: (id: number): Promise<void> => ipcRenderer.invoke('customers:delete', id)
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api

declare global {
  interface Window {
    api: Api
  }
}

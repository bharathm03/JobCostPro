import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  customers: {
    list: () => ipcRenderer.invoke('customers:list'),
    create: (data) => ipcRenderer.invoke('customers:create', data),
    update: (id, data) => ipcRenderer.invoke('customers:update', id, data),
    delete: (id) => ipcRenderer.invoke('customers:delete', id)
  },
  employees: {
    list: () => ipcRenderer.invoke('employees:list'),
    create: (data) => ipcRenderer.invoke('employees:create', data),
    update: (id, data) => ipcRenderer.invoke('employees:update', id, data),
    delete: (id) => ipcRenderer.invoke('employees:delete', id)
  },
  categories: {
    list: () => ipcRenderer.invoke('categories:list')
  },
  items: {
    list: () => ipcRenderer.invoke('items:list'),
    create: (data) => ipcRenderer.invoke('items:create', data),
    update: (id, data) => ipcRenderer.invoke('items:update', id, data),
    delete: (id) => ipcRenderer.invoke('items:delete', id),
    byCategory: (categoryId) => ipcRenderer.invoke('items:byCategory', categoryId)
  },
  machines: {
    list: () => ipcRenderer.invoke('machines:list'),
    getSchema: (id) => ipcRenderer.invoke('machines:getSchema', id)
  },
  jobs: {
    list: (filters) => ipcRenderer.invoke('jobs:list', filters),
    create: (data) => ipcRenderer.invoke('jobs:create', data),
    update: (id, data) => ipcRenderer.invoke('jobs:update', id, data),
    delete: (id) => ipcRenderer.invoke('jobs:delete', id),
    getByCustomerItem: (customerId, itemId) =>
      ipcRenderer.invoke('jobs:getByCustomerItem', customerId, itemId),
    getByMachine: (machineTypeId, dateFrom, dateTo) =>
      ipcRenderer.invoke('jobs:getByMachine', machineTypeId, dateFrom, dateTo),
    getByEmployee: (employeeId, dateFrom, dateTo) =>
      ipcRenderer.invoke('jobs:getByEmployee', employeeId, dateFrom, dateTo),
    getForReport: (dateFrom, dateTo, customerId) =>
      ipcRenderer.invoke('jobs:getForReport', dateFrom, dateTo, customerId),
    getByCustomer: (customerId, dateFrom, dateTo) =>
      ipcRenderer.invoke('jobs:getByCustomer', customerId, dateFrom, dateTo)
  },
  dashboard: {
    getStats: (dateFrom?: string, dateTo?: string) =>
      ipcRenderer.invoke('dashboard:getStats', dateFrom, dateTo)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}

import { ipcMain } from 'electron'
import { customersHandler } from './customers'
import { categoriesHandler } from './categories'
import { itemsHandler } from './items'
import { machinesHandler } from './machines'
import { jobsHandler } from './jobs'
import { jobMachineEntriesHandler } from './job-machine-entries'
import { dashboardHandler } from './dashboard'
import { reportsHandler } from './reports'

export function registerHandlers(): void {
  // Customers
  ipcMain.handle('customers:list', async () => {
    try {
      return await customersHandler.list()
    } catch (err) {
      console.error('customers:list error:', err)
      throw err
    }
  })

  ipcMain.handle('customers:create', async (_event, data) => {
    try {
      return await customersHandler.create(data)
    } catch (err) {
      console.error('customers:create error:', err)
      throw err
    }
  })

  ipcMain.handle('customers:update', async (_event, id, data) => {
    try {
      return await customersHandler.update(id, data)
    } catch (err) {
      console.error('customers:update error:', err)
      throw err
    }
  })

  ipcMain.handle('customers:delete', async (_event, id) => {
    try {
      return await customersHandler.delete(id)
    } catch (err) {
      console.error('customers:delete error:', err)
      throw err
    }
  })

  // Categories
  ipcMain.handle('categories:list', async () => {
    try {
      return await categoriesHandler.list()
    } catch (err) {
      console.error('categories:list error:', err)
      throw err
    }
  })

  // Items
  ipcMain.handle('items:list', async () => {
    try {
      return await itemsHandler.list()
    } catch (err) {
      console.error('items:list error:', err)
      throw err
    }
  })

  ipcMain.handle('items:create', async (_event, data) => {
    try {
      return await itemsHandler.create(data)
    } catch (err) {
      console.error('items:create error:', err)
      throw err
    }
  })

  ipcMain.handle('items:update', async (_event, id, data) => {
    try {
      return await itemsHandler.update(id, data)
    } catch (err) {
      console.error('items:update error:', err)
      throw err
    }
  })

  ipcMain.handle('items:delete', async (_event, id) => {
    try {
      return await itemsHandler.delete(id)
    } catch (err) {
      console.error('items:delete error:', err)
      throw err
    }
  })

  ipcMain.handle('items:byCategory', async (_event, categoryId) => {
    try {
      return await itemsHandler.byCategory(categoryId)
    } catch (err) {
      console.error('items:byCategory error:', err)
      throw err
    }
  })

  // Machines
  ipcMain.handle('machines:list', async () => {
    try {
      return await machinesHandler.list()
    } catch (err) {
      console.error('machines:list error:', err)
      throw err
    }
  })

  ipcMain.handle('machines:getSchema', async (_event, id) => {
    try {
      return await machinesHandler.getSchema(id)
    } catch (err) {
      console.error('machines:getSchema error:', err)
      throw err
    }
  })

  // Jobs
  ipcMain.handle('jobs:list', async (_event, filters) => {
    try {
      return await jobsHandler.list(filters)
    } catch (err) {
      console.error('jobs:list error:', err)
      throw err
    }
  })

  ipcMain.handle('jobs:create', async (_event, data) => {
    try {
      return await jobsHandler.create(data)
    } catch (err) {
      console.error('jobs:create error:', err)
      throw err
    }
  })

  ipcMain.handle('jobs:update', async (_event, id, data) => {
    try {
      return await jobsHandler.update(id, data)
    } catch (err) {
      console.error('jobs:update error:', err)
      throw err
    }
  })

  ipcMain.handle('jobs:delete', async (_event, id) => {
    try {
      return await jobsHandler.delete(id)
    } catch (err) {
      console.error('jobs:delete error:', err)
      throw err
    }
  })

  ipcMain.handle('jobs:getByCustomerItem', async (_event, customerId, itemId) => {
    try {
      return await jobsHandler.getByCustomerItem(customerId, itemId)
    } catch (err) {
      console.error('jobs:getByCustomerItem error:', err)
      throw err
    }
  })

  ipcMain.handle('jobs:getForReport', async (_event, dateFrom, dateTo, customerId) => {
    try {
      return await jobsHandler.getForReport(dateFrom, dateTo, customerId)
    } catch (err) {
      console.error('jobs:getForReport error:', err)
      throw err
    }
  })

  ipcMain.handle('jobs:getByCustomer', async (_event, customerId, dateFrom, dateTo) => {
    try {
      return await jobsHandler.getByCustomer(customerId, dateFrom, dateTo)
    } catch (err) {
      console.error('jobs:getByCustomer error:', err)
      throw err
    }
  })

  // Job Machine Entries
  ipcMain.handle('jobMachineEntries:listByJob', async (_event, jobId) => {
    try {
      return await jobMachineEntriesHandler.listByJob(jobId)
    } catch (err) {
      console.error('jobMachineEntries:listByJob error:', err)
      throw err
    }
  })

  ipcMain.handle('jobMachineEntries:create', async (_event, data) => {
    try {
      return await jobMachineEntriesHandler.create(data)
    } catch (err) {
      console.error('jobMachineEntries:create error:', err)
      throw err
    }
  })

  ipcMain.handle('jobMachineEntries:delete', async (_event, id) => {
    try {
      return await jobMachineEntriesHandler.delete(id)
    } catch (err) {
      console.error('jobMachineEntries:delete error:', err)
      throw err
    }
  })

  // Reports
  ipcMain.handle('reports:generatePDF', async (_event, reportType, params) => {
    try {
      return await reportsHandler.generatePDF(reportType, params)
    } catch (err) {
      console.error('reports:generatePDF error:', err)
      throw err
    }
  })

  // Dashboard
  ipcMain.handle('dashboard:getStats', async () => {
    try {
      return await dashboardHandler.getStats()
    } catch (err) {
      console.error('dashboard:getStats error:', err)
      throw err
    }
  })
}

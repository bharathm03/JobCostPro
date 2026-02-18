import { ipcMain } from 'electron'
import { customersHandler } from './customers'
import { employeesHandler } from './employees'
import { categoriesHandler } from './categories'
import { itemsHandler } from './items'
import { machinesHandler } from './machines'
import { jobsHandler } from './jobs'
import { dashboardHandler } from './dashboard'

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

  // Employees
  ipcMain.handle('employees:list', async () => {
    try {
      return await employeesHandler.list()
    } catch (err) {
      console.error('employees:list error:', err)
      throw err
    }
  })

  ipcMain.handle('employees:create', async (_event, data) => {
    try {
      return await employeesHandler.create(data)
    } catch (err) {
      console.error('employees:create error:', err)
      throw err
    }
  })

  ipcMain.handle('employees:update', async (_event, id, data) => {
    try {
      return await employeesHandler.update(id, data)
    } catch (err) {
      console.error('employees:update error:', err)
      throw err
    }
  })

  ipcMain.handle('employees:delete', async (_event, id) => {
    try {
      return await employeesHandler.delete(id)
    } catch (err) {
      console.error('employees:delete error:', err)
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

  ipcMain.handle('categories:create', async (_event, data) => {
    try {
      return await categoriesHandler.create(data)
    } catch (err) {
      console.error('categories:create error:', err)
      throw err
    }
  })

  ipcMain.handle('categories:update', async (_event, id, data) => {
    try {
      return await categoriesHandler.update(id, data)
    } catch (err) {
      console.error('categories:update error:', err)
      throw err
    }
  })

  ipcMain.handle('categories:delete', async (_event, id) => {
    try {
      return await categoriesHandler.delete(id)
    } catch (err) {
      console.error('categories:delete error:', err)
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

  ipcMain.handle('jobs:getByMachine', async (_event, machineTypeId, dateFrom, dateTo) => {
    try {
      return await jobsHandler.getByMachine(machineTypeId, dateFrom, dateTo)
    } catch (err) {
      console.error('jobs:getByMachine error:', err)
      throw err
    }
  })

  ipcMain.handle('jobs:getByEmployee', async (_event, employeeId, dateFrom, dateTo) => {
    try {
      return await jobsHandler.getByEmployee(employeeId, dateFrom, dateTo)
    } catch (err) {
      console.error('jobs:getByEmployee error:', err)
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

  // Dashboard
  ipcMain.handle('dashboard:getStats', async (_e, dateFrom?: string, dateTo?: string) => {
    try {
      return await dashboardHandler.getStats(dateFrom, dateTo)
    } catch (err) {
      console.error('dashboard:getStats error:', err)
      throw err
    }
  })
}

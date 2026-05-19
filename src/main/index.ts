import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
  listAllTasks,
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  reorderTasks,
  listDependencies,
  createDependency,
  deleteDependency
} from './db'

function registerIpcHandlers(): void {
  ipcMain.handle('projects:list', () => listProjects())
  ipcMain.handle('projects:create', (_, name, description, color) =>
    createProject(name, description, color)
  )
  ipcMain.handle('projects:update', (_, id, fields) => updateProject(id, fields))
  ipcMain.handle('projects:delete', (_, id) => deleteProject(id))

  ipcMain.handle('tasks:listAll', () => listAllTasks())
  ipcMain.handle('tasks:list', (_, projectId) => listTasks(projectId))
  ipcMain.handle('tasks:create', (_, projectId, title, description, estimateDays) =>
    createTask(projectId, title, description, estimateDays)
  )
  ipcMain.handle('tasks:update', (_, id, fields) => updateTask(id, fields))
  ipcMain.handle('tasks:delete', (_, id) => deleteTask(id))
  ipcMain.handle('tasks:reorder', (_, projectId, orderedIds) => reorderTasks(projectId, orderedIds))

  ipcMain.handle('dependencies:list', (_, projectId) => listDependencies(projectId))
  ipcMain.handle('dependencies:create', (_, taskId, dependsOnId) =>
    createDependency(taskId, dependsOnId)
  )
  ipcMain.handle('dependencies:delete', (_, taskId, dependsOnId) =>
    deleteDependency(taskId, dependsOnId)
  )
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    show: false,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#0d0d0f',
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

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  app.setName('PlanWell')
  electronApp.setAppUserModelId('com.planwell')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerIpcHandlers()
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

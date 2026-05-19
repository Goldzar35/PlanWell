import { contextBridge, ipcRenderer } from 'electron'

const api = {
  projects: {
    list: () => ipcRenderer.invoke('projects:list'),
    create: (name: string, description?: string, color?: string) =>
      ipcRenderer.invoke('projects:create', name, description, color),
    update: (id: string, fields: Record<string, unknown>) =>
      ipcRenderer.invoke('projects:update', id, fields),
    delete: (id: string) => ipcRenderer.invoke('projects:delete', id)
  },
  tasks: {
    listAll: () => ipcRenderer.invoke('tasks:listAll'),
    list: (projectId: string) => ipcRenderer.invoke('tasks:list', projectId),
    create: (
      projectId: string,
      title: string,
      description?: string,
      estimateDays?: number
    ) => ipcRenderer.invoke('tasks:create', projectId, title, description, estimateDays),
    update: (id: string, fields: Record<string, unknown>) =>
      ipcRenderer.invoke('tasks:update', id, fields),
    delete: (id: string) => ipcRenderer.invoke('tasks:delete', id),
    reorder: (projectId: string, orderedIds: string[]) =>
      ipcRenderer.invoke('tasks:reorder', projectId, orderedIds)
  },
  dependencies: {
    list: (projectId: string) => ipcRenderer.invoke('dependencies:list', projectId),
    create: (taskId: string, dependsOnId: string) =>
      ipcRenderer.invoke('dependencies:create', taskId, dependsOnId),
    delete: (taskId: string, dependsOnId: string) =>
      ipcRenderer.invoke('dependencies:delete', taskId, dependsOnId)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.api = api
}

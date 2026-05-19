export {}

declare global {
  interface Window {
    api: {
      projects: {
        list: () => Promise<Project[]>
        create: (name: string, description?: string, color?: string) => Promise<Project>
        update: (id: string, fields: Partial<Project>) => Promise<Project>
        delete: (id: string) => Promise<void>
      }
      tasks: {
        listAll: () => Promise<Task[]>
        list: (projectId: string) => Promise<Task[]>
        create: (
          projectId: string,
          title: string,
          description?: string,
          estimateDays?: number
        ) => Promise<Task>
        update: (id: string, fields: Partial<Task>) => Promise<Task>
        delete: (id: string) => Promise<void>
        reorder: (projectId: string, orderedIds: string[]) => Promise<void>
      }
      dependencies: {
        list: (projectId: string) => Promise<Dependency[]>
        create: (taskId: string, dependsOnId: string) => Promise<void>
        delete: (taskId: string, dependsOnId: string) => Promise<void>
      }
    }
  }

  interface Project {
    id: string
    name: string
    description: string
    status: 'active' | 'completed' | 'archived'
    color: string
    target_date: number | null
    task_count?: number
    created_at: number
    updated_at: number
  }

  interface Task {
    id: string
    project_id: string
    title: string
    description: string
    status: 'todo' | 'in_progress' | 'done' | 'blocked'
    estimate_days: number | null
    start_date: number | null
    end_date: number | null
    position: number
    created_at: number
    updated_at: number
  }

  interface Dependency {
    id: string
    task_id: string
    depends_on_id: string
    created_at: number
  }
}

function fmt(d: Date): string {
  return d.toISOString().split('T')[0]
}

export interface ScheduledTask extends Task {
  computed_start: Date
  computed_end: Date
}

function topoSort(tasks: Task[], depMap: Map<string, string[]>): Task[] {
  const taskMap = new Map(tasks.map((t) => [t.id, t]))
  const visited = new Set<string>()
  const result: Task[] = []

  function visit(id: string) {
    if (visited.has(id)) return
    visited.add(id)
    for (const dep of depMap.get(id) ?? []) visit(dep)
    const task = taskMap.get(id)
    if (task) result.push(task)
  }

  for (const task of tasks) visit(task.id)
  return result
}

export function scheduleTasks(tasks: Task[], deps: Dependency[]): ScheduledTask[] {
  if (tasks.length === 0) return []

  const depMap = new Map<string, string[]>()
  for (const dep of deps) {
    if (!depMap.has(dep.task_id)) depMap.set(dep.task_id, [])
    depMap.get(dep.task_id)!.push(dep.depends_on_id)
  }

  const sorted = topoSort(tasks, depMap)
  const endDateMap = new Map<string, Date>()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return sorted.map((task) => {
    let start: Date

    if (task.start_date) {
      start = new Date(task.start_date)
    } else {
      const taskDeps = depMap.get(task.id) ?? []
      if (taskDeps.length > 0) {
        const latestDepEnd = taskDeps
          .map((id) => endDateMap.get(id) ?? today)
          .reduce((a, b) => (a > b ? a : b), today)
        start = new Date(latestDepEnd)
        start.setDate(start.getDate() + 1)
      } else {
        start = new Date(today)
      }
    }

    const duration = Math.max(1, task.estimate_days ?? 1)
    const end = task.end_date
      ? new Date(task.end_date)
      : (() => {
          const d = new Date(start)
          d.setDate(d.getDate() + duration - 1)
          return d
        })()

    // A task is overdue only after its end day is fully over
    end.setHours(23, 59, 59, 999)

    endDateMap.set(task.id, end)
    return { ...task, computed_start: start, computed_end: end }
  })
}

export function toGanttTasks(scheduled: ScheduledTask[], deps: Dependency[]) {
  const depMap = new Map<string, string[]>()
  for (const dep of deps) {
    if (!depMap.has(dep.task_id)) depMap.set(dep.task_id, [])
    depMap.get(dep.task_id)!.push(dep.depends_on_id)
  }

  return scheduled.map((task) => ({
    id: task.id,
    name: task.title,
    start: fmt(task.computed_start),
    end: fmt(task.computed_end),
    progress: task.status === 'done' ? 100 : task.status === 'in_progress' ? 50 : 0,
    dependencies: (depMap.get(task.id) ?? []).join(', '),
    custom_class: `bar-status-${task.status}`,
  }))
}

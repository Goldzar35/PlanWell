import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  Circle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Link2,
  Trash2,
  RotateCcw,
  Pencil,
  GripVertical,
  CalendarClock
} from 'lucide-react'
import GanttChart from '../components/GanttChart'
import AddTaskModal from '../components/AddTaskModal'
import EditTaskModal from '../components/EditTaskModal'
import EditProjectModal from '../components/EditProjectModal'
import { scheduleTasks, toGanttTasks } from '../utils/schedule'
import { useShortcut } from '../hooks/useShortcut'
import type { GanttTask } from 'frappe-gantt'

const STATUS_ICONS: Record<Task['status'], React.ReactNode> = {
  todo: <Circle size={14} className="text-ink-tertiary" />,
  in_progress: <Loader2 size={14} className="text-status-info animate-spin" />,
  done: <CheckCircle2 size={14} className="text-status-success" />,
  blocked: <AlertCircle size={14} className="text-status-danger" />,
}

const STATUS_CYCLE: Task['status'][] = ['todo', 'in_progress', 'done']

function nextStatus(current: Task['status']): Task['status'] {
  const idx = STATUS_CYCLE.indexOf(current)
  return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [deps, setDeps] = useState<Dependency[]>([])
  const [ganttTasks, setGanttTasks] = useState<GanttTask[]>([])
  const [showAddTask, setShowAddTask] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showEditProject, setShowEditProject] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [loading, setLoading] = useState(true)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  useShortcut(
    { key: 'n', meta: true },
    () => { if (project?.status !== 'completed') setShowAddTask(true) },
    [project]
  )

  const load = useCallback(async () => {
    if (!id) return
    const [projects, taskList, depList] = await Promise.all([
      window.api.projects.list(),
      window.api.tasks.list(id),
      window.api.dependencies.list(id),
    ])
    const found = projects.find((p) => p.id === id) ?? null
    setProject(found)
    setTasks(taskList)
    setDeps(depList)
    setLoading(false)
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const scheduled = scheduleTasks(tasks, deps)
    setGanttTasks(toGanttTasks(scheduled, deps))
  }, [tasks, deps])

  async function handleTaskAdded(task: Task) {
    setShowAddTask(false)
    await load()
  }

  async function handleStatusClick(task: Task) {
    const updated = await window.api.tasks.update(task.id, {
      status: nextStatus(task.status),
    })
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
  }

  async function handleDeleteTask(taskId: string) {
    await window.api.tasks.delete(taskId)
    await load()
  }

  async function handleDrop(targetId: string) {
    if (!draggedId || draggedId === targetId || !id) return
    const from = tasks.findIndex((t) => t.id === draggedId)
    const to = tasks.findIndex((t) => t.id === targetId)
    if (from === -1 || to === -1) return
    const reordered = [...tasks]
    const [moved] = reordered.splice(from, 1)
    reordered.splice(to, 0, moved)
    setTasks(reordered)
    setDraggedId(null)
    setDragOverId(null)
    await window.api.tasks.reorder(id, reordered.map((t) => t.id))
  }

  async function handleDeleteProject() {
    if (!project) return
    await window.api.projects.delete(project.id)
    navigate('/projects')
  }

  async function handleToggleComplete() {
    if (!project) return
    const newStatus = project.status === 'completed' ? 'active' : 'completed'
    const updated = await window.api.projects.update(project.id, { status: newStatus })
    setProject(updated)
  }

  async function handleArchive() {
    if (!project) return
    const newStatus = project.status === 'archived' ? 'active' : 'archived'
    const updated = await window.api.projects.update(project.id, { status: newStatus })
    setProject(updated)
  }

  async function handleGanttDateChange(ganttTask: GanttTask, start: Date, end: Date) {
    await window.api.tasks.update(ganttTask.id, {
      start_date: start.getTime(),
      end_date: end.getTime(),
    })
    await load()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={20} className="text-ink-tertiary animate-spin" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className="text-sm text-ink-tertiary">Project not found.</p>
        <button onClick={() => navigate('/projects')} className="text-xs text-accent hover:underline">
          Back to Projects
        </button>
      </div>
    )
  }

  const depSet = new Set(deps.map((d) => d.task_id))

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Project header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-app-border flex-shrink-0">
        <button
          onClick={() => navigate('/projects')}
          className="text-ink-tertiary hover:text-ink-primary transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ background: project.color }}
        />
        <h2 className="text-sm font-semibold text-ink-primary flex-1 truncate">{project.name}</h2>
        <button
          onClick={() => setShowEditProject(true)}
          title="Edit project"
          className="text-ink-tertiary hover:text-ink-primary transition-colors p-1 rounded-md hover:bg-app-elevated"
        >
          <Pencil size={14} />
        </button>
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-tertiary">Delete project?</span>
            <button
              onClick={handleDeleteProject}
              className="px-2 py-1 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-2 py-1 text-xs text-ink-secondary hover:text-ink-primary bg-app-elevated border border-app-border rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            title="Delete project"
            className="text-ink-tertiary hover:text-status-danger transition-colors p-1 rounded-md hover:bg-app-elevated"
          >
            <Trash2 size={14} />
          </button>
        )}
        {project.target_date && (() => {
          const daysLeft = Math.ceil((project.target_date - Date.now()) / 86400000)
          const overdue = daysLeft < 0
          return (
            <span className={`flex items-center gap-1 text-xs ${overdue ? 'text-status-danger' : 'text-ink-tertiary'}`}>
              <CalendarClock size={12} />
              {overdue ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Due today' : `${daysLeft}d left`}
            </span>
          )
        })()}
        <span className="text-xs text-ink-tertiary">{tasks.length} tasks</span>
        {(project.status === 'completed' || project.status === 'archived') && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium bg-app-elevated text-ink-tertiary`}>
            {project.status === 'completed' ? 'Completed' : 'Archived'}
          </span>
        )}
        {project.status !== 'archived' && (
          <button
            onClick={handleToggleComplete}
            title={project.status === 'completed' ? 'Reopen project' : 'Mark project complete'}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors bg-app-elevated border border-app-border ${
              project.status === 'completed'
                ? 'text-ink-tertiary hover:text-ink-primary'
                : 'text-ink-tertiary hover:text-status-success hover:border-green-500/30'
            }`}
          >
            {project.status === 'completed'
              ? <><RotateCcw size={13} /> Reopen</>
              : <><CheckCircle2 size={13} /> Mark Complete</>
            }
          </button>
        )}
        <button
          onClick={handleArchive}
          title={project.status === 'archived' ? 'Unarchive project' : 'Archive project'}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors bg-app-elevated border border-app-border text-ink-tertiary hover:text-ink-primary"
        >
          {project.status === 'archived' ? <><RotateCcw size={13} /> Unarchive</> : 'Archive'}
        </button>
        {project.status === 'active' && (
          <button
            onClick={() => setShowAddTask(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-lg transition-colors"
          >
            <Plus size={13} strokeWidth={2.5} />
            Add Task
          </button>
        )}
      </div>

      {/* Split view */}
      <div className="flex flex-1 min-h-0">
        {/* Task list */}
        <div className="w-72 flex-shrink-0 border-r border-app-border flex flex-col">
          <div className="px-4 py-2.5 border-b border-app-border-subtle">
            <span className="text-xs font-medium text-ink-tertiary uppercase tracking-wider">
              Tasks
            </span>
          </div>

          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-center px-4">
              <p className="text-xs text-ink-tertiary mb-3">No tasks yet</p>
              <button
                onClick={() => setShowAddTask(true)}
                className="text-xs text-accent hover:text-accent-hover transition-colors flex items-center gap-1"
              >
                <Plus size={12} /> Add first task
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto py-1">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => setDraggedId(task.id)}
                  onDragOver={(e) => { e.preventDefault(); setDragOverId(task.id) }}
                  onDragLeave={() => setDragOverId(null)}
                  onDrop={() => handleDrop(task.id)}
                  onDragEnd={() => { setDraggedId(null); setDragOverId(null) }}
                  className={`group flex items-center gap-2.5 px-4 py-2.5 transition-colors cursor-default ${
                    draggedId === task.id
                      ? 'opacity-40'
                      : dragOverId === task.id
                      ? 'bg-accent-subtle border-l-2 border-accent'
                      : 'hover:bg-app-elevated'
                  }`}
                >
                  <GripVertical
                    size={12}
                    className="flex-shrink-0 text-ink-tertiary opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity"
                  />
                  <button
                    onClick={() => handleStatusClick(task)}
                    className="flex-shrink-0 hover:scale-110 transition-transform"
                    title={`Status: ${task.status} — click to advance`}
                  >
                    {STATUS_ICONS[task.status]}
                  </button>

                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => setEditingTask(task)}
                    title="Click to edit"
                  >
                    <p
                      className={`text-xs truncate ${
                        task.status === 'done'
                          ? 'line-through text-ink-tertiary'
                          : 'text-ink-primary'
                      }`}
                    >
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs text-ink-tertiary truncate mt-0.5">{task.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-0.5">
                      {task.estimate_days && (
                        <span className="text-xs text-ink-tertiary">{task.estimate_days}d</span>
                      )}
                      {depSet.has(task.id) && (
                        <Link2 size={10} className="text-ink-tertiary" />
                      )}
                    </div>
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all flex-shrink-0">
                    <button
                      onClick={() => setEditingTask(task)}
                      className="text-ink-tertiary hover:text-ink-primary transition-colors"
                      title="Edit task"
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-ink-tertiary hover:text-status-danger transition-colors"
                      title="Delete task"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gantt chart */}
        <div className="flex-1 min-w-0 overflow-y-auto bg-app-bg relative">
          {/* Background watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
            <svg viewBox="0 0 24 24" className="w-64 h-64 opacity-[0.04]" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="3" width="12" height="4.5" rx="2.25" fill="#f0a500" />
              <rect x="6" y="9.75" width="16" height="4.5" rx="2.25" fill="#f0a500" />
              <rect x="10" y="16.5" width="12" height="4.5" rx="2.25" fill="#f0a500" opacity="0.6" />
            </svg>
          </div>
          <GanttChart tasks={ganttTasks} onDateChange={handleGanttDateChange} />
        </div>
      </div>

      {showAddTask && (
        <AddTaskModal
          projectId={project.id}
          existingTasks={tasks}
          onClose={() => setShowAddTask(false)}
          onCreate={handleTaskAdded}
        />
      )}

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={(updated) => {
            setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
            setEditingTask(null)
          }}
        />
      )}

      {showEditProject && (
        <EditProjectModal
          project={project}
          onClose={() => setShowEditProject(false)}
          onSave={(updated) => {
            setProject(updated)
            setShowEditProject(false)
          }}
        />
      )}
    </div>
  )
}

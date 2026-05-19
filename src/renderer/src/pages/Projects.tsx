import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FolderKanban, Sparkles, CheckCircle2, Clock, RotateCcw, Trash2 } from 'lucide-react'
import NewProjectModal from '../components/NewProjectModal'
import { useShortcut } from '../hooks/useShortcut'

const STATUS_FILTERS = ['All', 'Active', 'Completed', 'Archived'] as const
type Filter = (typeof STATUS_FILTERS)[number]

function statusBadge(status: Project['status']) {
  const map = {
    active: { label: 'Active', classes: 'bg-green-500/10 text-status-success' },
    completed: { label: 'Completed', classes: 'bg-app-elevated text-ink-tertiary' },
    archived: { label: 'Archived', classes: 'bg-app-elevated text-ink-tertiary' },
  }
  const { label, classes } = map[status] ?? map.active
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${classes}`}>{label}</span>
  )
}

function formatDate(ts: number) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(ts))
}

export default function Projects() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [filter, setFilter] = useState<Filter>('All')
  const [showModal, setShowModal] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  useEffect(() => {
    window.api.projects.list().then(setProjects)
  }, [])

  useShortcut({ key: 'n', meta: true }, () => setShowModal(true))

  function handleCreated(project: Project) {
    setProjects((prev) => [project, ...prev])
    setShowModal(false)
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    await window.api.projects.delete(id)
    setProjects((prev) => prev.filter((p) => p.id !== id))
    setConfirmDeleteId(null)
  }

  async function handleToggleComplete(e: React.MouseEvent, project: Project) {
    e.stopPropagation()
    const newStatus = project.status === 'completed' ? 'active' : 'completed'
    const updated = await window.api.projects.update(project.id, { status: newStatus })
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
  }

  const filtered = projects.filter((p) => {
    if (filter === 'Active') return p.status === 'active'
    if (filter === 'Completed') return p.status === 'completed'
    if (filter === 'Archived') return p.status === 'archived'
    return true
  })

  return (
    <div className="p-6 animate-slide-in">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filter === f
                  ? 'bg-app-elevated border border-app-border text-ink-primary'
                  : 'text-ink-tertiary hover:text-ink-secondary'
              }`}
            >
              {f}
              {f === 'All' && projects.length > 0 && (
                <span className="ml-1.5 text-ink-tertiary">{projects.length}</span>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={15} strokeWidth={2.5} />
          New Project
        </button>
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="bg-app-surface border border-app-border rounded-xl">
          <div className="flex flex-col items-center justify-center py-20 text-center px-8">
            <div className="relative mb-5">
              <div className="w-14 h-14 rounded-2xl bg-app-elevated border border-app-border flex items-center justify-center">
                <FolderKanban size={26} className="text-ink-tertiary" strokeWidth={1.5} />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                <Sparkles size={10} className="text-white" strokeWidth={2.5} />
              </div>
            </div>
            <p className="text-sm font-medium text-ink-primary mb-2">
              {filter === 'All' ? 'Create your first roadmap' : `No ${filter.toLowerCase()} projects`}
            </p>
            {filter === 'All' && (
              <p className="text-xs text-ink-tertiary mb-6 max-w-sm leading-relaxed">
                Tell PlanWell your goal and it will help you break it into tasks, figure out the
                order, and build a plan that actually works.
              </p>
            )}
            {filter === 'All' && (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus size={15} strokeWidth={2.5} />
                New Project
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((project) => (
            <div
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}`)}
            className="group bg-app-surface border border-app-border hover:border-accent/30 rounded-xl px-5 py-4 cursor-pointer transition-colors flex items-center gap-4"
            >
              {/* Color dot */}
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ background: project.color }}
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-ink-primary truncate">
                    {project.name}
                  </span>
                  {statusBadge(project.status)}
                </div>
                {project.description ? (
                  <p className="text-xs text-ink-tertiary truncate">{project.description}</p>
                ) : null}
              </div>

              {/* Meta */}
              <div className="flex items-center gap-4 text-xs text-ink-tertiary flex-shrink-0">
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  {project.task_count ?? 0} tasks
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {formatDate(project.created_at)}
                </span>
                {confirmDeleteId === project.id ? (
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <span className="text-xs text-ink-tertiary">Delete?</span>
                    <button
                      onClick={(e) => handleDelete(e, project.id)}
                      className="px-2 py-0.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors"
                    >
                      Yes
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null) }}
                      className="px-2 py-0.5 text-xs text-ink-secondary bg-app-elevated border border-app-border rounded-md transition-colors hover:text-ink-primary"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={(e) => handleToggleComplete(e, project)}
                      title={project.status === 'completed' ? 'Reopen project' : 'Mark complete'}
                      className={`opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 rounded-md border transition-all ${
                        project.status === 'completed'
                          ? 'border-app-border text-ink-tertiary hover:text-ink-primary hover:border-app-border'
                          : 'border-transparent hover:border-green-500/30 hover:text-status-success'
                      }`}
                    >
                      {project.status === 'completed'
                        ? <><RotateCcw size={11} /> Reopen</>
                        : <><CheckCircle2 size={11} /> Complete</>
                      }
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(project.id) }}
                      title="Delete project"
                      className="opacity-0 group-hover:opacity-100 p-1 text-ink-tertiary hover:text-status-danger transition-all rounded-md"
                    >
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <NewProjectModal onClose={() => setShowModal(false)} onCreate={handleCreated} />
      )}
    </div>
  )
}

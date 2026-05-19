import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Zap,
  Flame,
  Minus,
  Clock,
  ChevronRight,
  Plus,
  TrendingUp,
  CalendarClock
} from 'lucide-react'
import Logo from '../components/Logo'
import NewProjectModal from '../components/NewProjectModal'
import { scheduleTasks } from '../utils/schedule'

// ── Types ─────────────────────────────────────────────────

interface ProjectHealth {
  project: Project
  tasks: Task[]
  done: number
  total: number
  progress: number
  overdue: number
  nextTask: Task | null
  isOnTrack: boolean
}

// ── Helpers ───────────────────────────────────────────────

function computeHealth(projects: Project[], allTasks: Task[], deps: Dependency[]): ProjectHealth[] {
  return projects
    .filter((p) => p.status === 'active')
    .map((project) => {
      const tasks = allTasks.filter((t) => t.project_id === project.id)
      const projectDeps = deps.filter((d) =>
        tasks.some((t) => t.id === d.task_id)
      )
      const done = tasks.filter((t) => t.status === 'done').length
      const total = tasks.length
      const progress = total === 0 ? 0 : Math.round((done / total) * 100)

      const scheduled = scheduleTasks(tasks, projectDeps)
      const now = Date.now()

      const overdue = scheduled.filter(
        (t) => t.status !== 'done' && t.computed_end.getTime() < now
      ).length

      // Next task: first todo/in_progress that has all deps satisfied
      const doneIds = new Set(tasks.filter((t) => t.status === 'done').map((t) => t.id))
      const blockedIds = new Set(
        projectDeps
          .filter((d) => !doneIds.has(d.depends_on_id))
          .map((d) => d.task_id)
      )
      const nextTask =
        tasks.find(
          (t) =>
            (t.status === 'todo' || t.status === 'in_progress') &&
            !blockedIds.has(t.id)
        ) ?? null

      return { project, tasks, done, total, progress, overdue, nextTask, isOnTrack: overdue === 0 }
    })
}

function getMomentum(allTasks: Task[]): { level: 'hot' | 'warm' | 'cold'; label: string; recentCount: number } {
  const now = Date.now()
  const day = 86400000
  const recentlyDone = allTasks.filter(
    (t) => t.status === 'done' && t.updated_at > now - 3 * day
  ).length

  if (recentlyDone >= 3) return { level: 'hot', label: `${recentlyDone} tasks done in 3 days`, recentCount: recentlyDone }
  if (recentlyDone >= 1) return { level: 'warm', label: `${recentlyDone} task${recentlyDone > 1 ? 's' : ''} done recently`, recentCount: recentlyDone }
  return { level: 'cold', label: 'No tasks completed in 3 days', recentCount: 0 }
}

function getBestNextTask(health: ProjectHealth[]): { task: Task; project: Project } | null {
  // Prefer in_progress first, then todo, prefer projects with overdue tasks
  const candidates = health
    .flatMap((h) => (h.nextTask ? [{ task: h.nextTask, project: h.project, overdue: h.overdue }] : []))
    .sort((a, b) => {
      if (a.task.status === 'in_progress' && b.task.status !== 'in_progress') return -1
      if (b.task.status === 'in_progress' && a.task.status !== 'in_progress') return 1
      return b.overdue - a.overdue
    })
  return candidates[0] ?? null
}

// ── Sub-components ─────────────────────────────────────────

function DoThisNow({ item }: { item: { task: Task; project: Project } | null }) {
  const navigate = useNavigate()
  if (!item) return null

  return (
    <div
      onClick={() => navigate(`/projects/${item.project.id}`)}
      className="bg-app-surface border border-accent/30 rounded-xl px-5 py-4 cursor-pointer hover:border-accent/60 transition-colors group"
    >
      <div className="flex items-center gap-2 mb-2">
        <Logo size={16} />
        <span className="text-xs font-semibold text-accent uppercase tracking-wider">Do This Now</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink-primary truncate">{item.task.title}</p>
          <p className="text-xs text-ink-tertiary mt-0.5 flex items-center gap-1.5">
            <span
              className="inline-block w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: item.project.color }}
            />
            {item.project.name}
            {item.task.estimate_days && (
              <span className="text-ink-tertiary">· {item.task.estimate_days}d</span>
            )}
          </p>
        </div>
        <ChevronRight size={16} className="text-ink-tertiary group-hover:text-accent transition-colors flex-shrink-0" />
      </div>
    </div>
  )
}

function MomentumBadge({ allTasks }: { allTasks: Task[] }) {
  const { level, label } = getMomentum(allTasks)
  const config = {
    hot:  { icon: Flame,  color: 'text-status-danger',   bg: 'bg-red-500/10',    border: 'border-red-500/20' },
    warm: { icon: TrendingUp, color: 'text-accent',      bg: 'bg-accent-subtle', border: 'border-accent/20' },
    cold: { icon: Minus,  color: 'text-ink-tertiary',    bg: 'bg-app-elevated',  border: 'border-app-border' },
  }[level]
  const Icon = config.icon

  return (
    <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border ${config.bg} ${config.border}`}>
      <Icon size={15} className={config.color} strokeWidth={2} />
      <div>
        <p className="text-xs font-medium text-ink-primary">Momentum</p>
        <p className="text-xs text-ink-tertiary">{label}</p>
      </div>
    </div>
  )
}

function ProjectCard({ h, onClick }: { h: ProjectHealth; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-app-surface border border-app-border hover:border-accent/30 rounded-xl px-5 py-4 cursor-pointer transition-colors"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: h.project.color }} />
        <span className="text-sm font-medium text-ink-primary flex-1 truncate">{h.project.name}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          h.isOnTrack ? 'bg-green-500/10 text-status-success' : 'bg-red-500/10 text-status-danger'
        }`}>
          {h.isOnTrack ? 'On track' : `${h.overdue} overdue`}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-ink-tertiary mb-1.5">
          <span>{h.done} of {h.total} tasks done</span>
          <span className="font-medium text-ink-secondary">{h.progress}%</span>
        </div>
        <div className="h-1.5 bg-app-elevated rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${h.progress}%`, background: h.project.color }}
          />
        </div>
      </div>

      {/* Target date */}
      {h.project.target_date && (() => {
        const daysLeft = Math.ceil((h.project.target_date - Date.now()) / 86400000)
        const overdue = daysLeft < 0
        return (
          <div className={`flex items-center gap-1.5 text-xs mb-2 ${overdue ? 'text-status-danger' : 'text-ink-tertiary'}`}>
            <CalendarClock size={11} />
            <span>{overdue ? `Target ${Math.abs(daysLeft)}d ago` : daysLeft === 0 ? 'Target: today' : `Target in ${daysLeft}d`}</span>
          </div>
        )
      })()}

      {/* Next task */}
      {h.nextTask ? (
        <div className="flex items-center gap-2 text-xs text-ink-tertiary">
          <ChevronRight size={11} className="text-ink-tertiary flex-shrink-0" />
          <span className="truncate">Next: <span className="text-ink-secondary">{h.nextTask.title}</span></span>
        </div>
      ) : h.total > 0 ? (
        <div className="flex items-center gap-2 text-xs text-status-success">
          <CheckCircle2 size={11} />
          <span>All tasks complete</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-ink-tertiary">
          <AlertCircle size={11} />
          <span>No tasks yet</span>
        </div>
      )}
    </div>
  )
}

// ── Main dashboard ─────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [deps, setDeps] = useState<Dependency[]>([])
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    Promise.all([
      window.api.projects.list(),
      window.api.tasks.listAll(),
    ]).then(([p, t]) => {
      setProjects(p)
      setAllTasks(t)
      // Load deps for all active projects
      const activeIds = p.filter(pr => pr.status === 'active').map(pr => pr.id)
      Promise.all(activeIds.map(id => window.api.dependencies.list(id)))
        .then(results => setDeps(results.flat()))
    })
  }, [])

  function handleCreated(project: Project) {
    setProjects((prev) => [project, ...prev])
    setShowModal(false)
  }

  const health = computeHealth(projects, allTasks, deps)
  const bestNext = getBestNextTask(health)
  const activeCount = projects.filter(p => p.status === 'active').length
  const doneCount = projects.filter(p => p.status === 'completed').length
  const totalTasks = allTasks.length
  const overdueCount = health.reduce((n, h) => n + h.overdue, 0)

  const statCards = [
    { label: 'Active Projects', value: String(activeCount), icon: TrendingUp, color: 'text-accent', bg: 'bg-accent-subtle' },
    { label: 'Total Tasks',     value: String(totalTasks),  icon: Clock,       color: 'text-status-warning', bg: 'bg-amber-500/10' },
    { label: 'Completed',       value: String(doneCount),   icon: CheckCircle2,color: 'text-status-success', bg: 'bg-green-500/10' },
    { label: 'Overdue',         value: String(overdueCount),icon: AlertCircle, color: overdueCount > 0 ? 'text-status-danger' : 'text-ink-tertiary', bg: overdueCount > 0 ? 'bg-red-500/10' : 'bg-app-elevated' },
  ]

  const isEmpty = projects.length === 0

  return (
    <div className="p-6 space-y-6 animate-slide-in">
      {/* Stat strip */}
      <div className="grid grid-cols-4 gap-3">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-app-surface border border-app-border rounded-xl p-4 flex items-start gap-3 animate-scale-in">
            <div className={`${bg} rounded-lg p-2 mt-0.5`}>
              <Icon size={15} className={color} strokeWidth={2} />
            </div>
            <div>
              <div className="text-2xl font-semibold text-ink-primary">{value}</div>
              <div className="text-xs text-ink-tertiary mt-0.5">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {isEmpty ? (
        /* Empty state */
        <div className="bg-app-surface border border-app-border rounded-xl">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-accent-subtle flex items-center justify-center mb-4">
              <TrendingUp size={22} className="text-accent" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-ink-primary mb-1">No projects yet</p>
            <p className="text-xs text-ink-tertiary mb-5 max-w-xs">
              Create your first roadmap and PlanWell will help you break it down and keep you on track.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus size={15} strokeWidth={2.5} />
              New Project
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Do This Now + Momentum */}
          {(bestNext || allTasks.length > 0) && (
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                {bestNext
                  ? <DoThisNow item={bestNext} />
                  : (
                    <div className="bg-app-surface border border-app-border rounded-xl px-5 py-4 flex items-center gap-3">
                      <CheckCircle2 size={16} className="text-status-success" />
                      <p className="text-sm text-ink-secondary">All tasks complete — add more to keep going.</p>
                    </div>
                  )
                }
              </div>
              <MomentumBadge allTasks={allTasks} />
            </div>
          )}

          {/* Per-project health cards */}
          {health.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-ink-primary">Projects</h2>
                <button
                  onClick={() => navigate('/projects')}
                  className="text-xs text-ink-tertiary hover:text-ink-secondary transition-colors flex items-center gap-1"
                >
                  Manage <ArrowRight size={11} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {health.map((h) => (
                  <ProjectCard
                    key={h.project.id}
                    h={h}
                    onClick={() => navigate(`/projects/${h.project.id}`)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {showModal && (
        <NewProjectModal onClose={() => setShowModal(false)} onCreate={handleCreated} />
      )}
    </div>
  )
}

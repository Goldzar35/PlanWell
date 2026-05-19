import { useState, useEffect, useRef } from 'react'
import { X, Link2 } from 'lucide-react'
import { useShortcut } from '../hooks/useShortcut'

interface Props {
  projectId: string
  existingTasks: Task[]
  onClose: () => void
  onCreate: (task: Task) => void
}

export default function AddTaskModal({ projectId, existingTasks, onClose, onCreate }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [estimateDays, setEstimateDays] = useState<string>('1')
  const [dependsOn, setDependsOn] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  useShortcut({ key: 'Escape', allowInInputs: true }, onClose)
  useShortcut({ key: 'Enter', meta: true, allowInInputs: true }, () => {
    if (title.trim() && !loading) handleSubmit({ preventDefault: () => {} } as React.FormEvent)
  }, [title, loading])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    try {
      const estimate = parseFloat(estimateDays)
      const task = await window.api.tasks.create(
        projectId,
        title,
        description,
        isNaN(estimate) ? undefined : estimate
      )
      for (const depId of dependsOn) {
        await window.api.dependencies.create(task.id, depId)
      }
      onCreate(task)
    } finally {
      setLoading(false)
    }
  }

  function toggleDep(id: string) {
    setDependsOn((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    )
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-app-surface border border-app-border rounded-2xl w-full max-w-md shadow-2xl animate-modal-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-app-border-subtle">
          <h2 className="text-sm font-semibold text-ink-primary">Add Task</h2>
          <button
            onClick={onClose}
            className="text-ink-tertiary hover:text-ink-secondary transition-colors rounded-md p-1 hover:bg-app-elevated"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-medium text-ink-secondary block mb-1.5">
              Task name <span className="text-status-danger">*</span>
            </label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Design homepage mockup"
              className="w-full bg-app-elevated border border-app-border rounded-lg px-3 py-2 text-sm text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-colors"
              style={{ userSelect: 'text' }}
            />
          </div>

          {/* Estimate */}
          <div>
            <label className="text-xs font-medium text-ink-secondary block mb-1.5">
              Estimate{' '}
              <span className="text-ink-tertiary font-normal">(days)</span>
            </label>
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={estimateDays}
              onChange={(e) => setEstimateDays(e.target.value)}
              className="w-28 bg-app-elevated border border-app-border rounded-lg px-3 py-2 text-sm text-ink-primary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-colors"
              style={{ userSelect: 'text' }}
            />
          </div>

          {/* Dependencies */}
          {existingTasks.length > 0 && (
            <div>
              <label className="text-xs font-medium text-ink-secondary flex items-center gap-1.5 mb-2">
                <Link2 size={11} />
                Depends on{' '}
                <span className="text-ink-tertiary font-normal">(can't start until these finish)</span>
              </label>
              <div className="space-y-1 max-h-36 overflow-y-auto">
                {existingTasks.map((task) => (
                  <label
                    key={task.id}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-app-elevated cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={dependsOn.includes(task.id)}
                      onChange={() => toggleDep(task.id)}
                      className="accent-accent w-3.5 h-3.5 rounded"
                    />
                    <span className="text-sm text-ink-secondary">{task.title}</span>
                    {task.estimate_days && (
                      <span className="text-xs text-ink-tertiary ml-auto">
                        {task.estimate_days}d
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-ink-secondary block mb-1.5">
              Notes <span className="text-ink-tertiary font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any extra context…"
              rows={2}
              className="w-full bg-app-elevated border border-app-border rounded-lg px-3 py-2 text-sm text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-colors resize-none"
              style={{ userSelect: 'text' }}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-ink-secondary hover:text-ink-primary bg-app-elevated border border-app-border rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || loading}
              className="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {loading ? 'Adding…' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

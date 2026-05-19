import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { useShortcut } from '../hooks/useShortcut'

interface Props {
  task: Task
  onClose: () => void
  onSave: (task: Task) => void
}

export default function EditTaskModal({ task, onClose, onSave }: Props) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [estimateDays, setEstimateDays] = useState<string>(
    task.estimate_days != null ? String(task.estimate_days) : ''
  )
  const [status, setStatus] = useState<Task['status']>(task.status)
  const [loading, setLoading] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
    titleRef.current?.select()
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
      const updated = await window.api.tasks.update(task.id, {
        title: title.trim(),
        description,
        estimate_days: isNaN(estimate) ? null : estimate,
        status,
      })
      onSave(updated)
    } finally {
      setLoading(false)
    }
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
        <div className="flex items-center justify-between px-5 py-4 border-b border-app-border-subtle">
          <h2 className="text-sm font-semibold text-ink-primary">Edit Task</h2>
          <button
            onClick={onClose}
            className="text-ink-tertiary hover:text-ink-secondary transition-colors rounded-md p-1 hover:bg-app-elevated"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-ink-secondary block mb-1.5">
              Task name <span className="text-status-danger">*</span>
            </label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-app-elevated border border-app-border rounded-lg px-3 py-2 text-sm text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-colors"
              style={{ userSelect: 'text' }}
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs font-medium text-ink-secondary block mb-1.5">
                Estimate <span className="text-ink-tertiary font-normal">(days)</span>
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={estimateDays}
                onChange={(e) => setEstimateDays(e.target.value)}
                className="w-full bg-app-elevated border border-app-border rounded-lg px-3 py-2 text-sm text-ink-primary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-colors"
                style={{ userSelect: 'text' }}
              />
            </div>

            <div className="flex-1">
              <label className="text-xs font-medium text-ink-secondary block mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Task['status'])}
                className="w-full bg-app-elevated border border-app-border rounded-lg px-3 py-2 text-sm text-ink-primary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-colors"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-ink-secondary block mb-1.5">
              Notes <span className="text-ink-tertiary font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any extra context…"
              rows={3}
              className="w-full bg-app-elevated border border-app-border rounded-lg px-3 py-2 text-sm text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-colors resize-none"
              style={{ userSelect: 'text' }}
            />
          </div>

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
              {loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

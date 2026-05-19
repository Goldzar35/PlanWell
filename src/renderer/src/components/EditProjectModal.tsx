import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { useShortcut } from '../hooks/useShortcut'

interface Props {
  project: Project
  onClose: () => void
  onSave: (project: Project) => void
}

const COLOR_OPTIONS = [
  '#f0a500',
  '#ef4444',
  '#22c55e',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
]

export default function EditProjectModal({ project, onClose, onSave }: Props) {
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description ?? '')
  const [color, setColor] = useState(project.color)
  const [targetDate, setTargetDate] = useState<string>(
    project.target_date ? new Date(project.target_date).toISOString().split('T')[0] : ''
  )
  const [loading, setLoading] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nameRef.current?.focus()
    nameRef.current?.select()
  }, [])

  useShortcut({ key: 'Escape', allowInInputs: true }, onClose)
  useShortcut({ key: 'Enter', meta: true, allowInInputs: true }, () => {
    if (name.trim() && !loading) handleSubmit({ preventDefault: () => {} } as React.FormEvent)
  }, [name, loading])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      const updated = await window.api.projects.update(project.id, {
        name: name.trim(),
        description,
        color,
        target_date: targetDate ? new Date(targetDate).getTime() : null,
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
          <h2 className="text-sm font-semibold text-ink-primary">Edit Project</h2>
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
              Project name <span className="text-status-danger">*</span>
            </label>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-app-elevated border border-app-border rounded-lg px-3 py-2 text-sm text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-colors"
              style={{ userSelect: 'text' }}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-ink-secondary block mb-1.5">
              Description <span className="text-ink-tertiary font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's the goal of this project?"
              rows={3}
              className="w-full bg-app-elevated border border-app-border rounded-lg px-3 py-2 text-sm text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-colors resize-none"
              style={{ userSelect: 'text' }}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-ink-secondary block mb-1.5">
              Target date <span className="text-ink-tertiary font-normal">(optional)</span>
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="bg-app-elevated border border-app-border rounded-lg px-3 py-2 text-sm text-ink-primary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-colors [color-scheme:dark]"
              style={{ userSelect: 'text' }}
            />
            {targetDate && (
              <button
                type="button"
                onClick={() => setTargetDate('')}
                className="ml-2 text-xs text-ink-tertiary hover:text-ink-secondary transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-ink-secondary block mb-1.5">Color</label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-6 h-6 rounded-full transition-transform hover:scale-110 focus:outline-none"
                  style={{
                    background: c,
                    boxShadow: color === c ? `0 0 0 2px #0d0d0f, 0 0 0 4px ${c}` : undefined,
                  }}
                />
              ))}
            </div>
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
              disabled={!name.trim() || loading}
              className="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

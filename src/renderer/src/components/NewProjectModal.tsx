import { useState, useEffect, useRef } from 'react'
import { X, Sparkles } from 'lucide-react'
import { useShortcut } from '../hooks/useShortcut'

interface Props {
  onClose: () => void
  onCreate: (project: Project) => void
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

export default function NewProjectModal({ onClose, onCreate }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#f0a500')
  const [loading, setLoading] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nameRef.current?.focus()
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
      const project = await window.api.projects.create(name, description, color)
      onCreate(project)
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
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-app-border-subtle">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-accent" />
            <h2 className="text-sm font-semibold text-ink-primary">New Project</h2>
          </div>
          <button
            onClick={onClose}
            className="text-ink-tertiary hover:text-ink-secondary transition-colors rounded-md p-1 hover:bg-app-elevated"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* Name */}
          <div>
            <label className="text-xs font-medium text-ink-secondary block mb-1.5">
              Project name <span className="text-status-danger">*</span>
            </label>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Launch portfolio site"
              className="w-full bg-app-elevated border border-app-border rounded-lg px-3 py-2 text-sm text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-colors"
              style={{ userSelect: 'text' }}
            />
          </div>

          {/* Description */}
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

          {/* Color */}
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
                    boxShadow: color === c ? `0 0 0 2px #0d0d0f, 0 0 0 4px ${c}` : undefined
                  }}
                />
              ))}
            </div>
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
              disabled={!name.trim() || loading}
              className="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {loading ? 'Creating…' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

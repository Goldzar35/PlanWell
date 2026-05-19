import { useEffect, useRef, useState } from 'react'
import Gantt from 'frappe-gantt'
import type { GanttTask } from 'frappe-gantt'
import 'frappe-gantt/dist/frappe-gantt.css'
import '../gantt-dark.css'

type ViewMode = 'Day' | 'Week' | 'Month'

interface Props {
  tasks: GanttTask[]
  onDateChange?: (task: GanttTask, start: Date, end: Date) => void
}

function trimSvgToContent(container: HTMLElement) {
  const svg = container.querySelector('svg')
  if (!svg) return

  // Find the lowest edge of any bar element so we can set the SVG
  // height to exactly that + a small buffer, removing frappe-gantt's
  // built-in bottom padding that creates a gap above the scrollbar.
  const bars = svg.querySelectorAll('.bar')
  if (bars.length === 0) return

  let maxBottom = 0
  bars.forEach((bar) => {
    const y = parseFloat(bar.getAttribute('y') || '0')
    const h = parseFloat(bar.getAttribute('height') || '0')
    maxBottom = Math.max(maxBottom, y + h)
  })

  if (maxBottom > 0) {
    const newHeight = maxBottom + 10
    svg.setAttribute('height', String(newHeight))
    svg.style.height = `${newHeight}px`
  }
}

export default function GanttChart({ tasks, onDateChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const ganttRef = useRef<Gantt | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('Day')

  useEffect(() => {
    if (!containerRef.current || tasks.length === 0) return

    containerRef.current.innerHTML = ''

    ganttRef.current = new Gantt(containerRef.current, tasks, {
      view_mode: viewMode,
      padding: 8,
      on_date_change: onDateChange,
      custom_popup_html: (task) => `
        <div>
          <div class="title">${task.name}</div>
          <div class="subtitle">${task.start} → ${task.end}</div>
        </div>
      `,
    })

    // Trim the SVG height to the actual bar content so the scrollbar sits flush
    requestAnimationFrame(() => trimSvgToContent(containerRef.current!))
  }, [tasks, viewMode])

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <p className="text-sm text-ink-tertiary">Add tasks to see the timeline</p>
        <p className="text-xs text-ink-tertiary mt-1 opacity-60">
          Tasks will be auto-scheduled based on estimates and dependencies
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* View mode switcher */}
      <div className="flex items-center gap-1 px-4 py-2.5 border-b border-app-border flex-shrink-0">
        {(['Day', 'Week', 'Month'] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
              viewMode === mode
                ? 'bg-accent-subtle text-accent'
                : 'text-ink-tertiary hover:text-ink-secondary'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Gantt chart */}
      <div className="gantt-wrapper">
        <div ref={containerRef} />
      </div>
    </div>
  )
}

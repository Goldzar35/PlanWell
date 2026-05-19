import { useEffect } from 'react'

interface ShortcutOptions {
  key: string
  meta?: boolean
  shift?: boolean
  /** Allow the shortcut to fire even when focus is inside an input/textarea */
  allowInInputs?: boolean
}

export function useShortcut(
  options: ShortcutOptions,
  callback: () => void,
  deps: unknown[] = []
) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (!options.allowInInputs) {
        const t = e.target as HTMLElement
        if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return
      }

      if (e.key.toLowerCase() !== options.key.toLowerCase()) return
      if (options.meta && !(e.metaKey || e.ctrlKey)) return
      if (!options.meta && (e.metaKey || e.ctrlKey)) return
      if (options.shift && !e.shiftKey) return

      e.preventDefault()
      callback()
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

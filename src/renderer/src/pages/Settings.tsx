import { useState } from 'react'
import { Key, Eye, EyeOff, ExternalLink, CheckCircle2 } from 'lucide-react'

export default function Settings() {
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)

  function handleSave() {
    // Persistence will be wired in Phase 5
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-6 max-w-2xl animate-slide-in space-y-6">
      {/* AI / API Key */}
      <section className="bg-app-surface border border-app-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-app-border-subtle">
          <h2 className="text-sm font-semibold text-ink-primary">AI Assistant</h2>
          <p className="text-xs text-ink-tertiary mt-0.5">
            PlanWell uses Claude to help you break down goals and suggest task order.
          </p>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-ink-secondary block mb-2">
              Anthropic API Key
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary pointer-events-none">
                  <Key size={14} />
                </div>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="w-full bg-app-elevated border border-app-border rounded-lg pl-8 pr-10 py-2 text-sm text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-colors"
                  style={{ userSelect: 'text' }}
                />
                <button
                  onClick={() => setShowKey((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-tertiary hover:text-ink-secondary transition-colors"
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <button
                onClick={handleSave}
                disabled={!apiKey.trim()}
                className="px-4 py-2 bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                {saved ? (
                  <>
                    <CheckCircle2 size={14} />
                    Saved
                  </>
                ) : (
                  'Save'
                )}
              </button>
            </div>
            <p className="text-xs text-ink-tertiary mt-2">
              Your key is stored locally on this machine and never sent anywhere except Anthropic.{' '}
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noreferrer"
                className="text-accent hover:text-accent-hover inline-flex items-center gap-0.5 transition-colors"
              >
                Get a key <ExternalLink size={10} />
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="bg-app-surface border border-app-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-app-border-subtle">
          <h2 className="text-sm font-semibold text-ink-primary">About</h2>
        </div>
        <div className="px-5 py-4 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-ink-tertiary">Version</span>
            <span className="text-ink-secondary">0.1.0</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-ink-tertiary">Source</span>
            <a
              href="https://github.com/Goldzar35/PlanWell"
              target="_blank"
              rel="noreferrer"
              className="text-accent hover:text-accent-hover inline-flex items-center gap-1 transition-colors"
            >
              GitHub <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

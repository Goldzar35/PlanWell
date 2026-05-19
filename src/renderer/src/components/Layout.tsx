import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderKanban,
  Settings,
  ChevronRight
} from 'lucide-react'
import { useShortcut } from '../hooks/useShortcut'
import Logo from './Logo'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', hint: '⌘1' },
  { to: '/projects', icon: FolderKanban, label: 'Projects', hint: '⌘2' },
]

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Overview of all your projects' },
  '/projects': { title: 'Projects', subtitle: 'Manage your roadmaps' },
  '/settings': { title: 'Settings', subtitle: 'Configure PlanWell' },
}

function usePageMeta(pathname: string) {
  if (pathname.startsWith('/projects/')) return null // ProjectDetail has its own header
  return pageTitles[pathname] ?? { title: 'PlanWell', subtitle: '' }
}

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const page = usePageMeta(location.pathname)
  const isProjectDetail = location.pathname.startsWith('/projects/')

  useShortcut({ key: '1', meta: true }, () => navigate('/dashboard'))
  useShortcut({ key: '2', meta: true }, () => navigate('/projects'))
  useShortcut({ key: ',', meta: true }, () => navigate('/settings'))

  return (
    <div className="flex h-full bg-app-bg">
      {/* Sidebar */}
      <aside className="flex flex-col w-[220px] flex-shrink-0 bg-app-surface border-r border-app-border">
        {/* Traffic light spacer + logo */}
        <div className="drag-region h-12 flex items-center px-4 border-b border-app-border-subtle">
          <div className="no-drag flex items-center gap-2 ml-16">
            <div className="w-6 h-6 rounded-md bg-accent/10 flex items-center justify-center">
              <Logo size={16} />
            </div>
            <span className="text-sm font-semibold text-ink-primary tracking-tight">PlanWell</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label, hint }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `no-drag flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-accent-subtle text-accent font-medium'
                    : 'text-ink-secondary hover:text-ink-primary hover:bg-app-elevated'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={15} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{label}</span>
                  <span className="ml-auto text-[10px] text-ink-tertiary opacity-60">{hint}</span>
                  {isActive && (
                    <ChevronRight size={12} className="opacity-50" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: Settings */}
        <div className="px-2 pb-3 border-t border-app-border-subtle pt-3">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `no-drag flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-accent-subtle text-accent font-medium'
                  : 'text-ink-tertiary hover:text-ink-primary hover:bg-app-elevated'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Settings size={15} strokeWidth={isActive ? 2.5 : 2} />
                <span>Settings</span>
              </>
            )}
          </NavLink>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header — hidden for project detail (it has its own) */}
        {!isProjectDetail && page && (
          <header className="drag-region flex items-center h-12 px-6 border-b border-app-border flex-shrink-0">
            <div className="no-drag">
              <h1 className="text-sm font-semibold text-ink-primary leading-none">{page.title}</h1>
              {page.subtitle && (
                <p className="text-xs text-ink-tertiary mt-0.5">{page.subtitle}</p>
              )}
            </div>
          </header>
        )}

        {/* Page content */}
        <main className={`flex-1 min-h-0 animate-fade-in ${isProjectDetail ? 'flex flex-col overflow-hidden' : 'overflow-auto'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

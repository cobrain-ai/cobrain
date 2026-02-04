'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLayout } from '@/contexts/layout-context'

interface NavItem {
  href: string
  label: string
  icon: string
  shortcut?: string
}

const navItems: NavItem[] = [
  { href: '/capture', label: 'Capture', icon: '📝', shortcut: 'C' },
  { href: '/chat', label: 'Chat', icon: '💬', shortcut: 'H' },
  { href: '/notes', label: 'Notes', icon: '📋', shortcut: 'N' },
  { href: '/views', label: 'Views', icon: '📊', shortcut: 'V' },
  { href: '/graph', label: 'Graph', icon: '🕸️', shortcut: 'G' },
  { href: '/import', label: 'Import', icon: '📥', shortcut: 'I' },
  { href: '/settings', label: 'Settings', icon: '⚙️', shortcut: ',' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, sidebarCollapsed, closeSidebar } = useLayout()

  if (!sidebarOpen) return null

  return (
    <>
      {/* Mobile overlay */}
      <div
        className="fixed inset-0 z-20 bg-black/50 lg:hidden"
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-30
          flex flex-col
          bg-white dark:bg-gray-900
          border-r border-gray-200 dark:border-gray-800
          transition-all duration-200
          ${sidebarCollapsed ? 'w-16' : 'w-64'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-800">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🧠</span>
            {!sidebarCollapsed && (
              <span className="font-bold text-xl">CoBrain</span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (window.innerWidth < 1024) closeSidebar()
                }}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg
                  transition-colors
                  ${
                    isActive
                      ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
                title={sidebarCollapsed ? item.label : undefined}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="text-xl">{item.icon}</span>
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.shortcut && (
                      <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs font-mono bg-gray-200 dark:bg-gray-700 rounded">
                        {item.shortcut}
                      </kbd>
                    )}
                  </>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Quick Capture Button */}
        <div className="p-2 border-t border-gray-200 dark:border-gray-800">
          <Link
            href="/capture"
            className={`
              flex items-center justify-center gap-2
              w-full px-4 py-3 rounded-lg
              bg-blue-600 hover:bg-blue-700
              text-white font-medium
              transition-colors
            `}
          >
            <span>✨</span>
            {!sidebarCollapsed && <span>Quick Capture</span>}
          </Link>
        </div>
      </aside>
    </>
  )
}

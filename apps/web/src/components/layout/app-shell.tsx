'use client'

import { type ReactNode } from 'react'
import { LayoutProvider } from '@/contexts/layout-context'
import { ThemeProvider } from '@/contexts/theme-context'
import { Sidebar } from './sidebar'
import { Header } from './header'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <ThemeProvider>
      <LayoutProvider>
        <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
          <Sidebar />
          <div className="flex flex-col flex-1 min-w-0">
            <Header />
            <main className="flex-1 overflow-y-auto p-4 lg:p-6">
              {children}
            </main>
          </div>
        </div>
      </LayoutProvider>
    </ThemeProvider>
  )
}

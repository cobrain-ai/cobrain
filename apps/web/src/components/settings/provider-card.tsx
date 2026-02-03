'use client'

import { getStatusStyle } from '@/lib/providers'
import type { ProviderStatus } from '@/lib/providers'

export interface ProviderCardProps {
  provider: ProviderStatus
  isActive: boolean
  onSelect: () => void
  onTest: () => void
}

export function ProviderCard({
  provider,
  isActive,
  onSelect,
  onTest,
}: ProviderCardProps): React.ReactElement {
  const statusStyle = getStatusStyle(provider.status)
  const isTesting = provider.status === 'testing'
  const shouldPulse = provider.status === 'testing' || provider.status === 'connected'

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl border-2
        bg-white dark:bg-gray-900 transition-all duration-300
        ${isActive
          ? 'border-blue-500 shadow-lg shadow-blue-500/20'
          : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
        }
      `}
    >
      {isActive && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
      )}

      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">{provider.name}</h3>
            <div className="flex items-center gap-2">
              <span
                className={`
                  inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-mono
                  ${statusStyle.bgColor}
                `}
              >
                <span
                  className={`
                    w-1.5 h-1.5 rounded-full
                    ${statusStyle.textColor}
                    ${shouldPulse ? 'animate-pulse' : ''}
                  `}
                />
                {statusStyle.label}
              </span>
              {provider.latency !== undefined && (
                <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                  {provider.latency}ms
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onSelect}
            role="radio"
            aria-checked={isActive}
            className={`
              w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${isActive
                ? 'border-blue-500 bg-blue-500'
                : 'border-gray-300 dark:border-gray-700'
              }
            `}
            aria-label={`Select ${provider.name} as active provider`}
          >
            {isActive && <div className="w-2 h-2 rounded-full bg-white" />}
          </button>
        </div>

        {provider.model && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Model</p>
            <p className="text-sm font-mono">{provider.model}</p>
          </div>
        )}

        <button
          onClick={onTest}
          disabled={isTesting}
          className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isTesting ? 'Testing...' : 'Test Connection'}
        </button>
      </div>
    </div>
  )
}

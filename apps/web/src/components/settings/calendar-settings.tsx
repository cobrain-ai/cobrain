'use client'

import { useState, useEffect, useCallback } from 'react'

type CalendarProvider = 'google' | 'outlook'
type ConnectionStatus = {
  connected: boolean
  email?: string
  loading: boolean
}

export function CalendarSettings() {
  const [googleStatus, setGoogleStatus] = useState<ConnectionStatus>({
    connected: false,
    loading: true,
  })
  const [outlookStatus, setOutlookStatus] = useState<ConnectionStatus>({
    connected: false,
    loading: true,
  })
  const [headsUpEnabled, setHeadsUpEnabled] = useState(true)
  const [leadTime, setLeadTime] = useState(10)

  // Check connection status on mount
  useEffect(() => {
    checkConnectionStatus()
  }, [])

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/calendar/status')
      if (response.ok) {
        const data = await response.json()
        setGoogleStatus({
          connected: data.google?.connected ?? false,
          email: data.google?.email,
          loading: false,
        })
        setOutlookStatus({
          connected: data.outlook?.connected ?? false,
          email: data.outlook?.email,
          loading: false,
        })
        setHeadsUpEnabled(data.headsUpEnabled ?? true)
        setLeadTime(data.leadTimeMinutes ?? 10)
      }
    } catch (error) {
      console.error('Failed to check calendar status:', error)
      setGoogleStatus((prev) => ({ ...prev, loading: false }))
      setOutlookStatus((prev) => ({ ...prev, loading: false }))
    }
  }

  const handleConnect = useCallback(async (provider: CalendarProvider) => {
    try {
      const response = await fetch(`/api/calendar/auth/${provider}`)
      if (response.ok) {
        const { authUrl } = await response.json()
        // Open OAuth flow in popup or redirect
        window.location.href = authUrl
      }
    } catch (error) {
      console.error(`Failed to connect ${provider}:`, error)
    }
  }, [])

  const handleDisconnect = useCallback(async (provider: CalendarProvider) => {
    const setter = provider === 'google' ? setGoogleStatus : setOutlookStatus
    setter((prev) => ({ ...prev, loading: true }))

    try {
      const response = await fetch(`/api/calendar/disconnect/${provider}`, {
        method: 'POST',
      })
      if (response.ok) {
        setter({ connected: false, loading: false })
      }
    } catch (error) {
      console.error(`Failed to disconnect ${provider}:`, error)
      setter((prev) => ({ ...prev, loading: false }))
    }
  }, [])

  const handleHeadsUpToggle = useCallback(async (enabled: boolean) => {
    setHeadsUpEnabled(enabled)
    try {
      await fetch('/api/calendar/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headsUpEnabled: enabled }),
      })
    } catch (error) {
      console.error('Failed to update settings:', error)
    }
  }, [])

  const handleLeadTimeChange = useCallback(async (minutes: number) => {
    setLeadTime(minutes)
    try {
      await fetch('/api/calendar/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadTimeMinutes: minutes }),
      })
    } catch (error) {
      console.error('Failed to update settings:', error)
    }
  }, [])

  return (
    <section className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <CalendarIcon className="w-5 h-5" />
        Calendar Integration
      </h2>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Connect your calendar to get &quot;Heads Up&quot; notifications with relevant notes before
        meetings.
      </p>

      {/* Google Calendar */}
      <CalendarProviderCard
        provider="google"
        name="Google Calendar"
        icon={<GoogleIcon className="w-6 h-6" />}
        status={googleStatus}
        onConnect={() => handleConnect('google')}
        onDisconnect={() => handleDisconnect('google')}
      />

      {/* Outlook Calendar */}
      <CalendarProviderCard
        provider="outlook"
        name="Microsoft Outlook"
        icon={<OutlookIcon className="w-6 h-6" />}
        status={outlookStatus}
        onConnect={() => handleConnect('outlook')}
        onDisconnect={() => handleDisconnect('outlook')}
      />

      {/* Heads Up Settings */}
      {(googleStatus.connected || outlookStatus.connected) && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
          <h3 className="font-medium mb-4">Heads Up Settings</h3>

          <div className="space-y-4">
            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Pre-meeting notifications</p>
                <p className="text-sm text-gray-500">
                  Get relevant notes surfaced before meetings
                </p>
              </div>
              <button
                onClick={() => handleHeadsUpToggle(!headsUpEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  headsUpEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
                }`}
                role="switch"
                aria-checked={headsUpEnabled}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    headsUpEnabled ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Lead Time */}
            {headsUpEnabled && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Notification timing
                </label>
                <div className="flex gap-2">
                  {[5, 10, 15, 30].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => handleLeadTimeChange(mins)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        leadTime === mins
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {mins} min
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Before meeting starts
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

interface CalendarProviderCardProps {
  provider: CalendarProvider
  name: string
  icon: React.ReactNode
  status: ConnectionStatus
  onConnect: () => void
  onDisconnect: () => void
}

function CalendarProviderCard({
  name,
  icon,
  status,
  onConnect,
  onDisconnect,
}: CalendarProviderCardProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">{icon}</div>
        <div>
          <p className="font-medium">{name}</p>
          {status.connected && status.email && (
            <p className="text-sm text-gray-500">{status.email}</p>
          )}
        </div>
      </div>

      {status.loading ? (
        <div className="w-8 h-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
      ) : status.connected ? (
        <button
          onClick={onDisconnect}
          className="px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200 dark:hover:bg-red-900/50 transition-all font-medium text-sm"
        >
          Disconnect
        </button>
      ) : (
        <button
          onClick={onConnect}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all font-medium text-sm"
        >
          Connect
        </button>
      )}
    </div>
  )
}

// Icons
function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  )
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

function OutlookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#0078D4" d="M24 7.387v10.478c0 .23-.08.424-.238.576-.158.152-.362.233-.598.233h-8.16v-6.09l1.496 1.122a.385.385 0 00.466 0l6.796-5.09a.67.67 0 00.238.523v-1.752z" />
      <path fill="#0078D4" d="M24 5.5a.664.664 0 00-.26-.524.726.726 0 00-.578-.226H15.01l7.39 5.534L24 9.306V5.5z" />
      <path fill="#0078D4" d="M0 7.5v9.75c0 .414.336.75.75.75h12.5c.414 0 .75-.336.75-.75V7.5c0-.414-.336-.75-.75-.75H.75c-.414 0-.75.336-.75.75z" />
      <path fill="#fff" d="M7 15.5c-2.206 0-4-1.794-4-4s1.794-4 4-4 4 1.794 4 4-1.794 4-4 4zm0-6.5c-1.378 0-2.5 1.122-2.5 2.5S5.622 14 7 14s2.5-1.122 2.5-2.5S8.378 9 7 9z" />
    </svg>
  )
}

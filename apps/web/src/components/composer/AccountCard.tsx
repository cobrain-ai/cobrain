'use client'

interface Account {
  id: string
  platform: string
  accountId: string
  accountName: string | null
  isActive: boolean
  connectedAt: string
  hasToken: boolean
}

interface AccountCardProps {
  account: Account
  onDisconnect: (id: string) => void
  isDisconnecting: boolean
}

export function AccountCard({ account, onDisconnect, isDisconnecting }: AccountCardProps) {
  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600">
          ✓
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {account.accountName || account.accountId}
          </p>
          <p className="text-xs text-gray-500">
            Connected {new Date(account.connectedAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      <button
        onClick={() => onDisconnect(account.id)}
        disabled={isDisconnecting}
        className="text-xs text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
      >
        {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
      </button>
    </div>
  )
}

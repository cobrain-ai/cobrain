'use client'

import { useTheme } from '@/contexts/theme-context'
import { useProviderSettings } from '@/hooks/use-provider-settings'
import {
  ProviderCard,
  ProviderConfigForm,
  AppearanceSection,
  DataPrivacySection,
  QuickStatsSection,
  SetupGuidesSection,
  AboutSection,
} from '@/components/settings'

export default function SettingsPage(): React.ReactElement {
  const { theme, setTheme } = useTheme()
  const {
    providers,
    activeProvider,
    configs,
    setActiveProvider,
    updateConfig,
    testProvider,
    checkAllProviders,
    saveConfig,
    saveStatus,
  } = useProviderSettings()

  const activeProviderInfo = providers.find((p) => p.id === activeProvider)
  const activeConfig = configs[activeProvider]

  return (
    <div className="max-w-6xl mx-auto">
      <SettingsHeader />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <AIProvidersSection
            providers={providers}
            activeProvider={activeProvider}
            onSelectProvider={setActiveProvider}
            onTestProvider={testProvider}
            onRefreshAll={checkAllProviders}
          />

          {activeProviderInfo && activeConfig && (
            <ProviderConfigForm
              providerId={activeProvider}
              providerName={activeProviderInfo.name}
              config={activeConfig}
              onConfigChange={(updates) => updateConfig(activeProvider, updates)}
              onSave={saveConfig}
              saveStatus={saveStatus}
            />
          )}

          <AppearanceSection theme={theme} onThemeChange={setTheme} />
          <DataPrivacySection />
        </div>

        <Sidebar providers={providers} />
      </div>
    </div>
  )
}

function SettingsHeader(): React.ReactElement {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Settings
      </h1>
      <p className="text-gray-600 dark:text-gray-400">
        Configure your AI providers and customize CoBrain
      </p>
    </div>
  )
}

interface AIProvidersSectionProps {
  providers: ReturnType<typeof useProviderSettings>['providers']
  activeProvider: string
  onSelectProvider: (id: string) => void
  onTestProvider: (id: string) => void
  onRefreshAll: () => void
}

function AIProvidersSection({
  providers,
  activeProvider,
  onSelectProvider,
  onTestProvider,
  onRefreshAll,
}: AIProvidersSectionProps): React.ReactElement {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <span className="text-2xl">&#129302;</span>
          AI Providers
        </h2>
        <button
          onClick={onRefreshAll}
          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
        >
          Refresh All
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {providers.map((provider) => (
          <ProviderCard
            key={provider.id}
            provider={provider}
            isActive={activeProvider === provider.id}
            onSelect={() => onSelectProvider(provider.id)}
            onTest={() => onTestProvider(provider.id)}
          />
        ))}
      </div>
    </section>
  )
}

interface SidebarProps {
  providers: ReturnType<typeof useProviderSettings>['providers']
}

function Sidebar({ providers }: SidebarProps): React.ReactElement {
  return (
    <div className="space-y-6">
      <QuickStatsSection providers={providers} />
      <SetupGuidesSection />
      <AboutSection />
    </div>
  )
}

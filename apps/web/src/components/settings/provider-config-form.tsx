'use client'

import { TextField, SelectField, InfoBox } from './form-field'
import { MODEL_OPTIONS } from '@/lib/providers'
import type { ProviderConfig } from '@/lib/providers'
import type { SaveStatus } from '@/hooks/use-provider-settings'

export interface ProviderConfigFormProps {
  providerId: string
  providerName: string
  config: ProviderConfig
  onConfigChange: (updates: Partial<ProviderConfig>) => void
  onSave: () => void
  saveStatus?: SaveStatus
}

export function ProviderConfigForm({
  providerId,
  providerName,
  config,
  onConfigChange,
  onSave,
  saveStatus,
}: ProviderConfigFormProps): React.ReactElement {
  const isSaving = saveStatus?.type === 'saving'

  return (
    <section className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span className="text-xl">&#9881;&#65039;</span>
        {providerName} Configuration
      </h2>

      <div className="space-y-4">
        <ConfigFields
          providerId={providerId}
          config={config}
          onConfigChange={onConfigChange}
        />

        {saveStatus && saveStatus.type !== 'idle' && (
          <div
            className={`p-3 rounded-lg text-sm font-medium ${
              saveStatus.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-100 border border-emerald-200 dark:border-emerald-800'
                : saveStatus.type === 'error'
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100 border border-red-200 dark:border-red-800'
                  : 'bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100 border border-blue-200 dark:border-blue-800'
            }`}
          >
            {saveStatus.type === 'saving' ? 'Saving...' : saveStatus.message}
          </div>
        )}

        <button
          onClick={onSave}
          disabled={isSaving}
          className="w-full px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium transition-all"
        >
          {isSaving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </section>
  )
}

interface ConfigFieldsProps {
  providerId: string
  config: ProviderConfig
  onConfigChange: (updates: Partial<ProviderConfig>) => void
}

function ConfigFields({ providerId, config, onConfigChange }: ConfigFieldsProps): React.ReactElement {
  switch (providerId) {
    case 'ollama':
      return <OllamaConfigFields config={config} onConfigChange={onConfigChange} />
    case 'claude-cli':
      return <ClaudeCliConfigFields config={config} onConfigChange={onConfigChange} />
    case 'openai':
      return <OpenAIConfigFields config={config} onConfigChange={onConfigChange} />
    case 'anthropic':
      return <AnthropicConfigFields config={config} onConfigChange={onConfigChange} />
    default:
      return <p className="text-gray-500">Unknown provider type</p>
  }
}

interface ProviderFieldsProps {
  config: ProviderConfig
  onConfigChange: (updates: Partial<ProviderConfig>) => void
}

function OllamaConfigFields({ config, onConfigChange }: ProviderFieldsProps): React.ReactElement {
  return (
    <>
      <TextField
        label="Base URL"
        value={config.baseUrl ?? ''}
        onChange={(value) => onConfigChange({ baseUrl: value })}
        monospace
      />
      <SelectField
        label="Model"
        value={config.model ?? ''}
        onChange={(value) => onConfigChange({ model: value })}
        options={MODEL_OPTIONS.ollama}
      />
    </>
  )
}

function ClaudeCliConfigFields({ config, onConfigChange }: ProviderFieldsProps): React.ReactElement {
  return (
    <>
      <TextField
        label="CLI Path"
        value={config.cliPath ?? ''}
        onChange={(value) => onConfigChange({ cliPath: value })}
        placeholder="claude"
        hint="Path to Claude CLI executable (defaults to 'claude' in PATH)"
        monospace
      />
      <InfoBox>
        <strong>Claude CLI detected!</strong> Using your existing Claude Code installation. No API keys needed.
      </InfoBox>
    </>
  )
}

function OpenAIConfigFields({ config, onConfigChange }: ProviderFieldsProps): React.ReactElement {
  return (
    <>
      <TextField
        label="API Key"
        type="password"
        value={config.apiKey ?? ''}
        onChange={(value) => onConfigChange({ apiKey: value })}
        placeholder="sk-..."
        monospace
      />
      <SelectField
        label="Model"
        value={config.model ?? ''}
        onChange={(value) => onConfigChange({ model: value })}
        options={MODEL_OPTIONS.openai}
      />
    </>
  )
}

function AnthropicConfigFields({ config, onConfigChange }: ProviderFieldsProps): React.ReactElement {
  return (
    <>
      <TextField
        label="API Key"
        type="password"
        value={config.apiKey ?? ''}
        onChange={(value) => onConfigChange({ apiKey: value })}
        placeholder="sk-ant-..."
        monospace
      />
      <SelectField
        label="Model"
        value={config.model ?? ''}
        onChange={(value) => onConfigChange({ model: value })}
        options={MODEL_OPTIONS.anthropic}
      />
    </>
  )
}

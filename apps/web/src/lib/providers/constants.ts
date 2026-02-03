/**
 * Provider-related constants and configuration defaults
 */

import type { ProviderInfo, ProviderConfig, ProviderConnectionStatus } from './types.js'

/**
 * Static provider metadata
 */
export const PROVIDERS: readonly ProviderInfo[] = [
  { id: 'ollama', name: 'Ollama', type: 'ollama' },
  { id: 'claude-cli', name: 'Claude CLI', type: 'claude-cli' },
  { id: 'openai', name: 'OpenAI', type: 'openai' },
  { id: 'anthropic', name: 'Anthropic', type: 'anthropic' },
] as const

/**
 * Default model configurations for each provider
 */
export const DEFAULT_MODELS = {
  ollama: 'llama3:8b',
  openai: 'gpt-4o',
  anthropic: 'claude-sonnet-4-20250514',
} as const

/**
 * Model options available for each provider
 */
export const MODEL_OPTIONS = {
  ollama: [
    { value: 'llama3:8b', label: 'Llama 3 8B' },
    { value: 'llama3:70b', label: 'Llama 3 70B' },
    { value: 'mistral', label: 'Mistral 7B' },
    { value: 'codellama', label: 'Code Llama' },
  ],
  openai: [
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  ],
  anthropic: [
    { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
    { value: 'claude-opus-4-20250514', label: 'Claude Opus 4' },
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
  ],
} as const

/**
 * Default Ollama base URL
 */
export const DEFAULT_OLLAMA_URL = 'http://localhost:11434'

/**
 * Default Claude CLI path
 */
export const DEFAULT_CLI_PATH = 'claude'

/**
 * Default provider configurations
 */
export function getDefaultProviderConfigs(): Record<string, ProviderConfig> {
  return {
    ollama: {
      type: 'ollama',
      enabled: true,
      model: DEFAULT_MODELS.ollama,
      baseUrl: DEFAULT_OLLAMA_URL,
    },
    'claude-cli': {
      type: 'claude-cli',
      enabled: false,
      cliPath: DEFAULT_CLI_PATH,
    },
    openai: {
      type: 'openai',
      enabled: false,
      model: DEFAULT_MODELS.openai,
      apiKey: '',
    },
    anthropic: {
      type: 'anthropic',
      enabled: false,
      model: DEFAULT_MODELS.anthropic,
      apiKey: '',
    },
  }
}

/**
 * Status styling configuration
 */
interface StatusStyle {
  textColor: string
  bgColor: string
  label: string
}

const STATUS_STYLES: Record<ProviderConnectionStatus, StatusStyle> = {
  connected: {
    textColor: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10 border-emerald-500/20',
    label: 'Connected',
  },
  disconnected: {
    textColor: 'text-gray-400',
    bgColor: 'bg-gray-500/10 border-gray-500/20',
    label: 'Disconnected',
  },
  testing: {
    textColor: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10 border-yellow-500/20',
    label: 'Testing...',
  },
  error: {
    textColor: 'text-red-500',
    bgColor: 'bg-red-500/10 border-red-500/20',
    label: 'Error',
  },
}

/**
 * Get styling for a provider connection status
 */
export function getStatusStyle(status: ProviderConnectionStatus): StatusStyle {
  return STATUS_STYLES[status]
}

/**
 * External links for provider setup guides
 */
export const SETUP_GUIDES = [
  {
    href: 'https://ollama.com',
    title: 'Install Ollama',
    description: 'Local AI models',
  },
  {
    href: 'https://claude.ai/code',
    title: 'Get Claude CLI',
    description: "Anthropic's developer tool",
  },
  {
    href: 'https://platform.openai.com/api-keys',
    title: 'OpenAI API Keys',
    description: 'Get your API key',
  },
] as const

// Reminders Plugin Exports

export { RemindersPlugin, createRemindersPlugin } from './plugin.js'
export { extractReminders, extractBasicReminders, extractRemindersWithLLM } from './extractor.js'
export type { ExtractedReminder } from './extractor.js'

// Plugin manifest for auto-discovery
export const manifest = {
  meta: {
    id: 'reminders',
    name: 'Reminders',
    description: 'Extract and schedule reminders from notes',
    version: '1.0.0',
    icon: '⏰',
  },
  entry: './plugin.js',
  defaultEnabled: true,
}

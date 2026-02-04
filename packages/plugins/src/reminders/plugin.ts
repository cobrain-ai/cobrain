// Reminders Plugin
// Extracts and manages time-based reminders, commitments, and follow-ups

import {
  BasePlugin,
  type PluginMeta,
  type PluginConfigSchema,
  type PluginContext,
  type NoteProcessingHook,
  type ExtractionResult,
  type PluginUIExtension,
  type Note,
} from '@cobrain/core'
import { extractReminders, type ExtractedReminder } from './extractor.js'

/**
 * Reminders Plugin
 * Automatically extracts reminders from notes and schedules notifications
 */
export class RemindersPlugin extends BasePlugin {
  readonly meta: PluginMeta = {
    id: 'reminders',
    name: 'Reminders',
    description: 'Extract and schedule reminders from notes',
    version: '1.0.0',
    icon: '⏰',
  }

  readonly configSchema: PluginConfigSchema[] = [
    {
      key: 'enabled',
      label: 'Enable Reminders',
      type: 'boolean',
      default: true,
      description: 'Automatically extract reminders from notes',
    },
    {
      key: 'useLLM',
      label: 'Use AI for extraction',
      type: 'boolean',
      default: true,
      description: 'Use AI for more accurate reminder extraction (requires LLM provider)',
    },
    {
      key: 'defaultReminderTime',
      label: 'Default reminder time',
      type: 'select',
      default: '09:00',
      description: 'Default time for reminders without specific time',
      options: [
        { label: '8:00 AM', value: '08:00' },
        { label: '9:00 AM', value: '09:00' },
        { label: '10:00 AM', value: '10:00' },
        { label: '12:00 PM', value: '12:00' },
        { label: '6:00 PM', value: '18:00' },
      ],
    },
    {
      key: 'extractCommitments',
      label: 'Extract commitments',
      type: 'boolean',
      default: true,
      description: 'Detect promises like "I\'ll send the document by Friday"',
    },
  ]

  readonly uiExtensions: PluginUIExtension[] = [
    {
      location: 'sidebar',
      component: 'RemindersSidebarItem',
      order: 10,
    },
    {
      location: 'dashboard-widget',
      component: 'UpcomingRemindersWidget',
      order: 20,
    },
    {
      location: 'settings',
      component: 'RemindersSettings',
      order: 10,
    },
  ]

  readonly hooks: NoteProcessingHook = {
    onNoteCreated: async (note: Note, context: PluginContext): Promise<ExtractionResult<ExtractedReminder>> => {
      return this.processNote(note, context)
    },

    onNoteUpdated: async (note: Note, _previousNote: Note, context: PluginContext): Promise<ExtractionResult<ExtractedReminder>> => {
      // Re-extract reminders on update
      return this.processNote(note, context)
    },

    onNoteDeleted: async (noteId: string, context: PluginContext): Promise<void> => {
      // Clean up reminders associated with deleted note
      context.log('info', `Cleaning up reminders for note ${noteId}`)
      // Actual cleanup will be handled by the API/database layer
    },
  }

  private saveReminder?: (reminder: ExtractedReminder, noteId: string, userId: string) => Promise<void>

  async initialize(context: PluginContext): Promise<void> {
    await super.initialize(context)
    this.log('info', 'Reminders plugin initialized')
  }

  /**
   * Set the reminder save function (injected by the app)
   */
  setSaveReminder(fn: (reminder: ExtractedReminder, noteId: string, userId: string) => Promise<void>): void {
    this.saveReminder = fn
  }

  private async processNote(note: Note, context: PluginContext): Promise<ExtractionResult<ExtractedReminder>> {
    const startTime = Date.now()

    const enabled = this.getConfigValue('enabled', true)
    if (!enabled) {
      return { items: [], metadata: { processingTimeMs: 0 } }
    }

    const useLLM = this.getConfigValue('useLLM', true)
    const extractCommitments = this.getConfigValue('extractCommitments', true)

    // Extract reminders
    const provider = useLLM ? context.provider : undefined
    let reminders = await extractReminders(note.content, provider)

    // Filter out commitments if disabled
    if (!extractCommitments) {
      reminders = reminders.filter((r) => r.type !== 'commitment')
    }

    // Apply default time to reminders without specific time
    const defaultTime = this.getConfigValue<string>('defaultReminderTime', '09:00')
    const [defaultHour, defaultMinute] = defaultTime.split(':').map(Number)

    for (const reminder of reminders) {
      if (reminder.triggerAt) {
        const hours = reminder.triggerAt.getHours()
        // If time is midnight (default), apply default time
        if (hours === 0 && reminder.triggerAt.getMinutes() === 0) {
          reminder.triggerAt.setHours(defaultHour, defaultMinute, 0, 0)
        }
      }
    }

    // Save reminders if save function is available
    if (this.saveReminder && reminders.length > 0) {
      for (const reminder of reminders) {
        try {
          await this.saveReminder(reminder, note.id, context.userId)
        } catch (error) {
          context.log('error', `Failed to save reminder: ${error}`)
        }
      }
    }

    const processingTimeMs = Date.now() - startTime

    context.log('info', `Extracted ${reminders.length} reminders from note ${note.id}`, {
      processingTimeMs,
      usedLLM: !!provider,
    })

    return {
      items: reminders,
      metadata: {
        processingTimeMs,
        source: provider ? 'hybrid' : 'rule',
      },
    }
  }
}

/**
 * Factory function for creating the Reminders plugin
 */
export function createRemindersPlugin(): RemindersPlugin {
  return new RemindersPlugin()
}

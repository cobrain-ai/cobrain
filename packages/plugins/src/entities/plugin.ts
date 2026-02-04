// Entities Plugin
// Extracts and manages named entities for the knowledge graph

import {
  BasePlugin,
  type PluginMeta,
  type PluginConfigSchema,
  type PluginContext,
  type NoteProcessingHook,
  type ExtractionResult,
  type PluginUIExtension,
  type PluginEntityType,
  type Note,
} from '@cobrain/core'
import { extractEntities, type ExtractedEntity } from './extractor.js'

/**
 * Entities Plugin
 * Automatically extracts named entities and builds the knowledge graph
 */
export class EntitiesPlugin extends BasePlugin {
  readonly meta: PluginMeta = {
    id: 'entities',
    name: 'Knowledge Graph',
    description: 'Extract entities and build a knowledge graph from your notes',
    version: '1.0.0',
    icon: '🕸️',
  }

  readonly configSchema: PluginConfigSchema[] = [
    {
      key: 'enabled',
      label: 'Enable Entity Extraction',
      type: 'boolean',
      default: true,
      description: 'Automatically extract entities from notes',
    },
    {
      key: 'useLLM',
      label: 'Use AI for extraction',
      type: 'boolean',
      default: true,
      description: 'Use AI for more accurate entity extraction (requires LLM provider)',
    },
    {
      key: 'extractPeople',
      label: 'Extract people',
      type: 'boolean',
      default: true,
      description: 'Detect names of people mentioned in notes',
    },
    {
      key: 'extractPlaces',
      label: 'Extract places',
      type: 'boolean',
      default: true,
      description: 'Detect locations and places',
    },
    {
      key: 'extractDates',
      label: 'Extract dates',
      type: 'boolean',
      default: true,
      description: 'Detect dates and times',
    },
    {
      key: 'extractUrls',
      label: 'Extract URLs',
      type: 'boolean',
      default: true,
      description: 'Detect web links',
    },
    {
      key: 'extractProjects',
      label: 'Extract projects',
      type: 'boolean',
      default: true,
      description: 'Detect project names',
    },
    {
      key: 'autoRelate',
      label: 'Auto-create relations',
      type: 'boolean',
      default: true,
      description: 'Automatically create relations between entities in the same note',
    },
  ]

  readonly entityTypes: PluginEntityType[] = [
    { type: 'person', name: 'Person', icon: '👤', color: '#3b82f6' },
    { type: 'place', name: 'Place', icon: '📍', color: '#10b981' },
    { type: 'organization', name: 'Organization', icon: '🏢', color: '#8b5cf6' },
    { type: 'project', name: 'Project', icon: '📁', color: '#f59e0b' },
    { type: 'task', name: 'Task', icon: '✅', color: '#ef4444' },
    { type: 'topic', name: 'Topic', icon: '🏷️', color: '#06b6d4' },
    { type: 'date', name: 'Date', icon: '📅', color: '#ec4899' },
    { type: 'time', name: 'Time', icon: '🕐', color: '#84cc16' },
    { type: 'concept', name: 'Concept', icon: '💡', color: '#6366f1' },
    { type: 'custom', name: 'Other', icon: '📌', color: '#64748b' },
  ]

  readonly uiExtensions: PluginUIExtension[] = [
    {
      location: 'sidebar',
      component: 'GraphSidebarItem',
      order: 20,
    },
    {
      location: 'dashboard-widget',
      component: 'GraphStatsWidget',
      order: 30,
    },
    {
      location: 'settings',
      component: 'EntitiesSettings',
      order: 20,
    },
    {
      location: 'note-actions',
      component: 'EntityTagsAction',
      order: 10,
    },
  ]

  readonly hooks: NoteProcessingHook = {
    onNoteCreated: async (
      note: Note,
      context: PluginContext
    ): Promise<ExtractionResult<ExtractedEntity>> => {
      return this.processNote(note, context)
    },

    onNoteUpdated: async (
      note: Note,
      _previousNote: Note,
      context: PluginContext
    ): Promise<ExtractionResult<ExtractedEntity>> => {
      // Re-extract entities on update
      return this.processNote(note, context)
    },

    onNoteDeleted: async (noteId: string, context: PluginContext): Promise<void> => {
      // Clean up entity links for deleted note
      context.log('info', `Cleaning up entity links for note ${noteId}`)
      // Actual cleanup will be handled by the API/database layer
    },
  }

  private saveEntity?: (entity: ExtractedEntity, noteId: string) => Promise<string>
  private createRelation?: (fromId: string, toId: string, type: string) => Promise<void>

  async initialize(context: PluginContext): Promise<void> {
    await super.initialize(context)
    this.log('info', 'Entities plugin initialized')
  }

  /**
   * Set the entity save function (injected by the app)
   */
  setSaveEntity(fn: (entity: ExtractedEntity, noteId: string) => Promise<string>): void {
    this.saveEntity = fn
  }

  /**
   * Set the relation creation function (injected by the app)
   */
  setCreateRelation(fn: (fromId: string, toId: string, type: string) => Promise<void>): void {
    this.createRelation = fn
  }

  private async processNote(
    note: Note,
    context: PluginContext
  ): Promise<ExtractionResult<ExtractedEntity>> {
    const startTime = Date.now()

    const enabled = this.getConfigValue('enabled', true)
    if (!enabled) {
      return { items: [], metadata: { processingTimeMs: 0 } }
    }

    const useLLM = this.getConfigValue('useLLM', true)
    const autoRelate = this.getConfigValue('autoRelate', true)

    // Build extraction options from config
    const options = {
      extractPeople: this.getConfigValue('extractPeople', true),
      extractPlaces: this.getConfigValue('extractPlaces', true),
      extractDates: this.getConfigValue('extractDates', true),
      extractUrls: this.getConfigValue('extractUrls', true),
      extractProjects: this.getConfigValue('extractProjects', true),
      extractTopics: true, // Always extract topics
    }

    // Extract entities
    const provider = useLLM ? context.provider : undefined
    const entities = await extractEntities(note.content, provider, options)

    // Save entities and create relations
    const savedIds: string[] = []

    if (this.saveEntity && entities.length > 0) {
      for (const entity of entities) {
        try {
          const savedId = await this.saveEntity(entity, note.id)
          savedIds.push(savedId)
        } catch (error) {
          context.log('error', `Failed to save entity: ${error}`)
        }
      }

      // Create co-occurrence relations
      if (autoRelate && this.createRelation && savedIds.length > 1) {
        for (let i = 0; i < savedIds.length; i++) {
          for (let j = i + 1; j < savedIds.length; j++) {
            try {
              await this.createRelation(savedIds[i], savedIds[j], 'related_to')
            } catch (error) {
              context.log('error', `Failed to create relation: ${error}`)
            }
          }
        }
      }
    }

    const processingTimeMs = Date.now() - startTime

    context.log('info', `Extracted ${entities.length} entities from note ${note.id}`, {
      processingTimeMs,
      usedLLM: !!provider,
      relationsCreated: autoRelate ? (savedIds.length * (savedIds.length - 1)) / 2 : 0,
    })

    return {
      items: entities,
      metadata: {
        processingTimeMs,
        source: provider ? 'hybrid' : 'rule',
      },
    }
  }

  /**
   * Get entity type configuration by type
   */
  getEntityTypeConfig(type: string): PluginEntityType | undefined {
    return this.entityTypes.find((et) => et.type === type)
  }
}

/**
 * Factory function for creating the Entities plugin
 */
export function createEntitiesPlugin(): EntitiesPlugin {
  return new EntitiesPlugin()
}

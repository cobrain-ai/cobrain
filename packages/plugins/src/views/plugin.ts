// Views Plugin
// Provides dynamic views, templates, and snapshots for organizing notes

import {
  BasePlugin,
  type PluginMeta,
  type PluginConfigSchema,
  type PluginContext,
  type PluginUIExtension,
  type PluginViewTemplate,
} from '@cobrain/core'

/**
 * View definition interface
 */
export interface ViewDefinition {
  id: string
  name: string
  description?: string
  query: ViewQuery
  layout: ViewLayout
  isShared?: boolean
  shareToken?: string
  createdAt: Date
  updatedAt: Date
}

/**
 * View query for filtering notes
 */
export interface ViewQuery {
  entityTypes?: string[]
  entityNames?: string[]
  tags?: string[]
  dateRange?: {
    start?: string
    end?: string
  }
  searchText?: string
  sort?: {
    field: 'createdAt' | 'updatedAt' | 'title'
    direction: 'asc' | 'desc'
  }
  limit?: number
}

/**
 * View layout options
 */
export type ViewLayout = 'list' | 'grid' | 'kanban' | 'timeline' | 'table'

/**
 * View snapshot for preserving point-in-time state
 */
export interface ViewSnapshot {
  id: string
  viewId: string
  name: string
  data: unknown // Frozen view data
  createdAt: Date
}

/**
 * Views Plugin
 * Creates and manages dynamic views of your notes
 */
export class ViewsPlugin extends BasePlugin {
  readonly meta: PluginMeta = {
    id: 'views',
    name: 'Views',
    description: 'Create dynamic views and snapshots of your notes',
    version: '1.0.0',
    icon: '📊',
  }

  readonly configSchema: PluginConfigSchema[] = [
    {
      key: 'enabled',
      label: 'Enable Views',
      type: 'boolean',
      default: true,
      description: 'Enable dynamic views feature',
    },
    {
      key: 'defaultLayout',
      label: 'Default layout',
      type: 'select',
      default: 'list',
      description: 'Default layout for new views',
      options: [
        { label: 'List', value: 'list' },
        { label: 'Grid', value: 'grid' },
        { label: 'Kanban', value: 'kanban' },
        { label: 'Timeline', value: 'timeline' },
        { label: 'Table', value: 'table' },
      ],
    },
    {
      key: 'enableSharing',
      label: 'Enable view sharing',
      type: 'boolean',
      default: true,
      description: 'Allow sharing views with others',
    },
    {
      key: 'maxSnapshots',
      label: 'Max snapshots per view',
      type: 'number',
      default: 10,
      description: 'Maximum number of snapshots to keep per view',
    },
  ]

  readonly viewTemplates: PluginViewTemplate[] = [
    {
      id: 'projects',
      name: 'Projects',
      description: 'All your projects in one place',
      icon: '📁',
      defaultQuery: { entityTypes: ['project'] },
      defaultLayout: 'kanban',
    },
    {
      id: 'tasks',
      name: 'Tasks',
      description: 'Track your tasks and todos',
      icon: '✅',
      defaultQuery: { entityTypes: ['task'] },
      defaultLayout: 'list',
    },
    {
      id: 'people',
      name: 'People',
      description: 'Notes about people you know',
      icon: '👥',
      defaultQuery: { entityTypes: ['person'] },
      defaultLayout: 'grid',
    },
    {
      id: 'timeline',
      name: 'Timeline',
      description: 'Your notes over time',
      icon: '📅',
      defaultQuery: { sort: { field: 'createdAt', direction: 'desc' } },
      defaultLayout: 'timeline',
    },
    {
      id: 'recent',
      name: 'Recent',
      description: 'Recently updated notes',
      icon: '🕐',
      defaultQuery: { sort: { field: 'updatedAt', direction: 'desc' }, limit: 20 },
      defaultLayout: 'list',
    },
    {
      id: 'pinned',
      name: 'Pinned',
      description: 'Your pinned notes',
      icon: '📌',
      defaultQuery: { tags: ['pinned'] },
      defaultLayout: 'grid',
    },
  ]

  readonly uiExtensions: PluginUIExtension[] = [
    {
      location: 'sidebar',
      component: 'ViewsSidebarItem',
      order: 30,
    },
    {
      location: 'dashboard-widget',
      component: 'ViewsQuickAccess',
      order: 40,
    },
    {
      location: 'settings',
      component: 'ViewsSettings',
      order: 30,
    },
  ]

  async initialize(context: PluginContext): Promise<void> {
    await super.initialize(context)
    this.log('info', 'Views plugin initialized')
  }

  /**
   * Get all available templates
   */
  getTemplates(): PluginViewTemplate[] {
    return this.viewTemplates
  }

  /**
   * Get a template by ID
   */
  getTemplate(templateId: string): PluginViewTemplate | undefined {
    return this.viewTemplates.find((t) => t.id === templateId)
  }

  /**
   * Create a view from a template
   */
  createFromTemplate(templateId: string, name?: string): Partial<ViewDefinition> {
    const template = this.getTemplate(templateId)
    if (!template) {
      throw new Error(`Template "${templateId}" not found`)
    }

    return {
      name: name || template.name,
      description: template.description,
      query: template.defaultQuery as ViewQuery,
      layout: template.defaultLayout || 'list',
    }
  }

  /**
   * Get default layout from config
   */
  getDefaultLayout(): ViewLayout {
    return this.getConfigValue('defaultLayout', 'list')
  }

  /**
   * Check if sharing is enabled
   */
  isSharingEnabled(): boolean {
    return this.getConfigValue('enableSharing', true)
  }

  /**
   * Get max snapshots setting
   */
  getMaxSnapshots(): number {
    return this.getConfigValue('maxSnapshots', 10)
  }
}

/**
 * Factory function for creating the Views plugin
 */
export function createViewsPlugin(): ViewsPlugin {
  return new ViewsPlugin()
}

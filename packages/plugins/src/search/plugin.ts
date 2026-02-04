// Search Plugin
// Provides semantic, keyword, and hybrid search capabilities

import {
  BasePlugin,
  type PluginMeta,
  type PluginConfigSchema,
  type PluginContext,
  type PluginUIExtension,
  type Note,
} from '@cobrain/core'
import {
  search,
  keywordSearch,
  semanticSearch,
  hybridSearch,
  type SearchRequest,
  type SearchResult,
  type SearchOptions,
} from './search.js'

/**
 * Search Plugin
 * Provides powerful search across all notes using semantic and keyword matching
 */
export class SearchPlugin extends BasePlugin {
  readonly meta: PluginMeta = {
    id: 'search',
    name: 'Search',
    description: 'Semantic and keyword search for your notes',
    version: '1.0.0',
    icon: '🔍',
  }

  readonly configSchema: PluginConfigSchema[] = [
    {
      key: 'enabled',
      label: 'Enable Search',
      type: 'boolean',
      default: true,
      description: 'Enable search functionality',
    },
    {
      key: 'defaultMode',
      label: 'Default search mode',
      type: 'select',
      default: 'hybrid',
      description: 'Default search mode when searching',
      options: [
        { label: 'Hybrid (recommended)', value: 'hybrid' },
        { label: 'Semantic only', value: 'semantic' },
        { label: 'Keyword only', value: 'keyword' },
      ],
    },
    {
      key: 'semanticThreshold',
      label: 'Semantic match threshold',
      type: 'number',
      default: 0.5,
      description: 'Minimum similarity score for semantic matches (0.0-1.0)',
    },
    {
      key: 'keywordBoost',
      label: 'Keyword boost',
      type: 'number',
      default: 0.3,
      description: 'Boost applied when both semantic and keyword match',
    },
    {
      key: 'maxResults',
      label: 'Max search results',
      type: 'number',
      default: 20,
      description: 'Maximum number of search results to return',
    },
  ]

  readonly uiExtensions: PluginUIExtension[] = [
    {
      location: 'sidebar',
      component: 'SearchSidebarItem',
      order: 5, // First item
    },
    {
      location: 'settings',
      component: 'SearchSettings',
      order: 40,
    },
  ]

  private getEmbedding?: (text: string) => Promise<number[]>

  async initialize(context: PluginContext): Promise<void> {
    await super.initialize(context)
    this.log('info', 'Search plugin initialized')
  }

  /**
   * Set the embedding function (injected by the app)
   */
  setEmbeddingFunction(fn: (text: string) => Promise<number[]>): void {
    this.getEmbedding = fn
  }

  /**
   * Perform a search
   */
  async search(query: string, notes: Note[], options?: Partial<SearchRequest>): Promise<SearchResult[]> {
    const defaultMode = this.getConfigValue<'hybrid' | 'semantic' | 'keyword'>('defaultMode', 'hybrid')
    const maxResults = this.getConfigValue('maxResults', 20)

    const request: SearchRequest = {
      query,
      mode: options?.mode || defaultMode,
      limit: options?.limit || maxResults,
      filters: options?.filters,
    }

    return search(request, notes, this.getEmbedding)
  }

  /**
   * Perform keyword-only search
   */
  searchKeyword(query: string, notes: Note[]): SearchResult[] {
    const maxResults = this.getConfigValue('maxResults', 20)
    return keywordSearch(query, notes, { maxResults })
  }

  /**
   * Perform semantic-only search
   */
  async searchSemantic(query: string, notes: Note[]): Promise<SearchResult[]> {
    if (!this.getEmbedding) {
      throw new Error('Semantic search requires embedding function to be set')
    }

    const semanticThreshold = this.getConfigValue('semanticThreshold', 0.5)
    const maxResults = this.getConfigValue('maxResults', 20)

    return semanticSearch(query, notes, this.getEmbedding, {
      semanticThreshold,
      maxResults,
    })
  }

  /**
   * Perform hybrid search
   */
  async searchHybrid(query: string, notes: Note[]): Promise<SearchResult[]> {
    if (!this.getEmbedding) {
      // Fall back to keyword search
      return this.searchKeyword(query, notes)
    }

    const semanticThreshold = this.getConfigValue('semanticThreshold', 0.5)
    const keywordBoost = this.getConfigValue('keywordBoost', 0.3)
    const maxResults = this.getConfigValue('maxResults', 20)

    return hybridSearch(query, notes, this.getEmbedding, {
      semanticThreshold,
      keywordBoost,
      maxResults,
    })
  }

  /**
   * Get search options from config
   */
  getSearchOptions(): SearchOptions {
    return {
      semanticThreshold: this.getConfigValue('semanticThreshold', 0.5),
      keywordBoost: this.getConfigValue('keywordBoost', 0.3),
      maxResults: this.getConfigValue('maxResults', 20),
    }
  }
}

/**
 * Factory function for creating the Search plugin
 */
export function createSearchPlugin(): SearchPlugin {
  return new SearchPlugin()
}

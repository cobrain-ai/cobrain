// Search Plugin Exports

export { SearchPlugin, createSearchPlugin } from './plugin.js'
export {
  search,
  keywordSearch,
  semanticSearch,
  hybridSearch,
  toCoreSearchResults,
} from './search.js'
export type { SearchRequest, SearchResult, SearchOptions } from './search.js'

// Plugin manifest for auto-discovery
export const manifest = {
  meta: {
    id: 'search',
    name: 'Search',
    description: 'Semantic and keyword search for your notes',
    version: '1.0.0',
    icon: '🔍',
  },
  entry: './plugin.js',
  defaultEnabled: true,
}

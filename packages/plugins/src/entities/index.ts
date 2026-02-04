// Entities Plugin Exports

export { EntitiesPlugin, createEntitiesPlugin } from './plugin.js'
export {
  extractEntities,
  extractUrls,
  extractBasicDates,
  extractEntitiesWithLLM,
  toEntities,
} from './extractor.js'
export type { ExtractedEntity, ExtractionOptions } from './extractor.js'

// Plugin manifest for auto-discovery
export const manifest = {
  meta: {
    id: 'entities',
    name: 'Knowledge Graph',
    description: 'Extract entities and build a knowledge graph from your notes',
    version: '1.0.0',
    icon: '🕸️',
  },
  entry: './plugin.js',
  defaultEnabled: true,
}

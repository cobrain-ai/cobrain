// Views Plugin Exports

export { ViewsPlugin, createViewsPlugin } from './plugin.js'
export type { ViewDefinition, ViewQuery, ViewLayout, ViewSnapshot } from './plugin.js'

// Plugin manifest for auto-discovery
export const manifest = {
  meta: {
    id: 'views',
    name: 'Views',
    description: 'Create dynamic views and snapshots of your notes',
    version: '1.0.0',
    icon: '📊',
  },
  entry: './plugin.js',
  defaultEnabled: true,
}

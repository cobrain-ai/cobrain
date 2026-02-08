const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')
const path = require('path')

const projectRoot = __dirname
const monorepoRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// Watch all files within the monorepo
config.watchFolders = [monorepoRoot]

// Let Metro know where to resolve packages from
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
]

// Force Metro to resolve @cobrain packages from monorepo
config.resolver.disableHierarchicalLookup = true

// Mock Node.js built-in modules that @cobrain/core providers reference
// (e.g. ClaudeCliProvider uses child_process, which doesn't exist in React Native)
const nodeBuiltins = ['child_process', 'fs', 'os', 'path', 'net', 'tls', 'http', 'https', 'stream', 'crypto', 'zlib']
const originalResolveRequest = config.resolver.resolveRequest
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (nodeBuiltins.includes(moduleName)) {
    return { type: 'empty' }
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform)
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = withNativeWind(config, { input: './global.css' })

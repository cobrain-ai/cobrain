/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@cobrain/core', '@cobrain/ai', '@cobrain/database', '@cobrain/ui'],
  // Enable static export for desktop app (Tauri)
  output: process.env.STATIC_EXPORT === 'true' ? 'export' : undefined,
  // Required for static export
  images: {
    unoptimized: process.env.STATIC_EXPORT === 'true',
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // child_process is used by @cobrain/core's Claude CLI provider
      // which only runs server-side. Stub it out for client builds.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        child_process: false,
      }
    }
    return config
  },
}

module.exports = nextConfig

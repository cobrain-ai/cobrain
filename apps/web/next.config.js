/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@cobrain/core', '@cobrain/ui'],
  // Enable static export for desktop app (Tauri)
  output: process.env.STATIC_EXPORT === 'true' ? 'export' : undefined,
  // Required for static export
  images: {
    unoptimized: process.env.STATIC_EXPORT === 'true',
  },
}

module.exports = nextConfig

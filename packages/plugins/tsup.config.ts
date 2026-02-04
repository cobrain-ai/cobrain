import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/reminders/index.ts',
    'src/entities/index.ts',
    'src/views/index.ts',
    'src/search/index.ts',
  ],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  external: ['@cobrain/core', '@cobrain/database'],
})

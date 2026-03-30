import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/cli.tsx'],
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  clean: true,
  // Don't bundle node_modules - they'll be installed via npm install -g
  banner: {
    js: '#!/usr/bin/env node',
  },
  esbuildOptions(options) {
    options.jsx = 'automatic'
  },
})

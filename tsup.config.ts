import { defineConfig } from 'tsup'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

export default defineConfig({
  entry: ['src/cli.tsx'],
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  clean: true,
  // Don't bundle node_modules - they'll be installed via npm install -g
  external: [/node_modules/],
  banner: {
    js: '#!/usr/bin/env node',
  },
  define: {
    'process.env.APP_VERSION': JSON.stringify(pkg.version),
  },
  esbuildOptions(options) {
    options.jsx = 'automatic'
  },
})

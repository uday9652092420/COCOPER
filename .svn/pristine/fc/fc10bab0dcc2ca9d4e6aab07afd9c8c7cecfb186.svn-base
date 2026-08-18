import * as esbuild from 'esbuild'
import { rimraf } from 'rimraf'
import stylePlugin from 'esbuild-style-plugin'
import autoprefixer from 'autoprefixer'
import tailwindcss from 'tailwindcss'
import fs from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
const isProd = args[0] === '--production'

await rimraf('dist')

/**
 * Minimal .env parser (no extra dependency).
 * Reads the root .env file so VITE_* values are injected into the
 * bundle at build time. Comment/uncomment a block in .env to switch
 * between LOCAL / TESTING / LIVE, then rebuild.
 */
function loadEnvFile(filePath) {
  const env = {}
  if (!fs.existsSync(filePath)) return env

  const raw = fs.readFileSync(filePath, 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const eq = trimmed.indexOf('=')
    if (eq === -1) continue

    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()

    // Strip surrounding single/double quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    env[key] = value
  }
  return env
}

const env = loadEnvFile(path.resolve(process.cwd(), '.env'))

// Inject VITE_* vars + standard env flags as import.meta.env.*
const define = {
  'import.meta.env.PROD': isProd ? 'true' : 'false',
  'import.meta.env.DEV': isProd ? 'false' : 'true',
  'import.meta.env.MODE': JSON.stringify(isProd ? 'production' : 'development'),
}
for (const [key, value] of Object.entries(env)) {
  if (key.startsWith('VITE_')) {
    define[`import.meta.env.${key}`] = JSON.stringify(value)
  }
}

/**
 * @type {esbuild.BuildOptions}
 */
const esbuildOpts = {
  color: true,

  entryPoints: [
    'src/main.tsx',
    'index.html',
    'src/public/logo.jpg',
  ],

  outdir: 'dist',

  entryNames: '[name]',

  assetNames: '[name]',

  write: true,

  define,

  bundle: true,

  format: 'iife',

  sourcemap: isProd
    ? false
    : 'linked',

  minify: isProd,

  treeShaking: true,

  jsx: 'automatic',

  loader: {
    '.html': 'copy',
    '.png': 'file',
    '.jpg': 'file',
    '.jpeg': 'file',
  },

  plugins: [
    stylePlugin({
      postcss: {
        plugins: [
          tailwindcss,
          autoprefixer,
        ],
      },
    }),
  ],
}

if (isProd) {
  await esbuild.build(esbuildOpts)
} else {
  const ctx =
    await esbuild.context(esbuildOpts)

  await ctx.watch()

  const { hosts, port } =
    await ctx.serve()

  console.log(`Running on:`)

  hosts.forEach((host) => {
    console.log(
      `http://${host}:${port}`
    )
  })
}
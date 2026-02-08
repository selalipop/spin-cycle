#!/usr/bin/env npx tsx
import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'

const dir = path.dirname(new URL(import.meta.url).pathname)
const configDir = path.join(dir, 'config')

function loadDir(subdir: string) {
  const folder = path.join(configDir, subdir)
  return fs.readdirSync(folder)
    .filter(f => f.endsWith('.yaml'))
    .sort()
    .map(f => yaml.load(fs.readFileSync(path.join(folder, f), 'utf8')))
}

const sharedActions = loadDir('shared_actions')
const factions = loadDir('factions')
const scenarios = loadDir('scenarios')

const out = `// AUTO-GENERATED from YAML — do not edit by hand.
// Run: pnpm game-data

export const SHARED_ACTIONS = ${JSON.stringify(sharedActions, null, 2)}

export const FACTIONS = ${JSON.stringify(factions, null, 2)}

export const SCENARIOS = ${JSON.stringify(scenarios, null, 2)}
`

fs.writeFileSync(path.join(dir, 'index.ts'), out)
console.log('convex/game_data/index.ts generated')

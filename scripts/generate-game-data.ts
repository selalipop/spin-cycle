#!/usr/bin/env npx tsx
"use node";
import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'

const gameDataDir = path.join(process.cwd(), 'convex', 'game_data')
const configDir = path.join(gameDataDir, 'config')

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

const gameDataOut = `// AUTO-GENERATED from YAML — do not edit by hand.
// Run: pnpm game-data

export const SHARED_ACTIONS = ${JSON.stringify(sharedActions, null, 2)}

export const FACTIONS = ${JSON.stringify(factions, null, 2)}

export const SCENARIOS = ${JSON.stringify(scenarios, null, 2)}
`

fs.writeFileSync(path.join(gameDataDir, 'index.ts'), gameDataOut)
console.log('convex/game_data/index.ts generated')

// --- Prompt templates ---

const promptsDir = path.join(process.cwd(), 'convex', 'prompts')
const templatesDir = path.join(promptsDir, 'templates')

const templates = fs.readdirSync(templatesDir)
  .filter(f => f.endsWith('.liquid'))
  .sort()

const entries = templates.flatMap(f => {
  const name = f.replace('.liquid', '').toUpperCase()
  const content = fs.readFileSync(path.join(templatesDir, f), 'utf8')

  // Split on "System:" and "User:" prefixes
  const systemMatch = content.match(/^System:\s*(.*)/m)
  const userIdx = content.search(/^User:\s*/m)

  const systemContent = systemMatch ? systemMatch[1].trim() : ''
  const userContent = userIdx !== -1
    ? content.slice(userIdx).replace(/^User:\s*/, '').trimStart()
    : content

  return [
    `export const ${name}_SYSTEM = ${JSON.stringify(systemContent)}`,
    `export const ${name}_USER = ${JSON.stringify(userContent)}`,
  ]
})

const promptsOut = `// AUTO-GENERATED from .liquid templates — do not edit by hand.
// Run: pnpm game-data

${entries.join('\n\n')}
`

fs.writeFileSync(path.join(promptsDir, 'index.ts'), promptsOut)
console.log('convex/prompts/index.ts generated')

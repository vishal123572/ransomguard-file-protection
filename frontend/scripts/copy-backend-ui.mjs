import { cpSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const source = fileURLToPath(new URL('../dist/', import.meta.url))
const target = fileURLToPath(new URL('../../backend/src/main/resources/static/', import.meta.url))
mkdirSync(target, { recursive: true })
cpSync(source, target, { recursive: true })
// Remove only obsolete Vite bundles from this console's known assets folder.
for (const name of readdirSync(join(target, 'assets'))) {
  if (/^index-[\w-]+\.(js|css)$/.test(name) && !existsSync(join(source, 'assets', name))) {
    unlinkSync(join(target, 'assets', name))
  }
}
console.log('React database console copied into Spring Boot static resources.')

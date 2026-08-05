/**
 * Guard: every source file under registry/ must be listed in registry.json.
 *
 * A file that exists on disk but is not declared is invisible to consumers — the
 * components importing it install fine and then fail to compile. That is exactly
 * what happened to `dashboard-widget-bar.tsx`: the examples stayed green because
 * they are populated by copying the directory, so only a clean install from the
 * registry could reveal it. This runs as part of `npm run build`.
 */
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, posix } from "node:path"

const registry = JSON.parse(readFileSync("registry.json", "utf8"))

const declared = new Set(
  registry.items.flatMap((item) => (item.files ?? []).map((file) => file.path))
)

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    return statSync(full).isDirectory() ? walk(full) : [full.split(/[\\/]/).join(posix.sep)]
  })
}

const onDisk = walk("registry").filter((file) => /\.(tsx?|css)$/.test(file))
const missing = onDisk.filter((file) => !declared.has(file))
const phantom = [...declared].filter((file) => !onDisk.includes(file))

for (const file of missing) console.error(`not listed in registry.json: ${file}`)
for (const file of phantom) console.error(`listed but missing on disk:  ${file}`)

if (missing.length || phantom.length) process.exit(1)

console.log(`registry.json covers all ${onDisk.length} source files`)

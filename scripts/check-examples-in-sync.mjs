/**
 * Guard: each example's copy of a registry file must match the registry source.
 *
 * The examples are populated by copying `registry/rud/**`, and the UI tests run
 * against the react-vite copy. A copy that drifts makes those tests pass for
 * code nobody installs — so every file declared in registry.json is compared
 * byte for byte against where it lands in each example.
 */
import { existsSync, readFileSync } from "node:fs"

const EXAMPLES = ["examples/react-vite", "examples/preact-vite"]
const registry = JSON.parse(readFileSync("registry.json", "utf8"))
const files = registry.items.flatMap((item) => item.files ?? []).filter((file) => file.target)

let drift = 0
for (const example of EXAMPLES) {
  for (const { path, target } of files) {
    const copy = `${example}/src/${target.replace(/^@components\//, "components/")}`
    if (!existsSync(copy)) {
      console.error(`missing in ${example}: ${copy}`)
      drift++
    } else if (readFileSync(copy, "utf8") !== readFileSync(path, "utf8")) {
      console.error(`out of sync: ${copy} differs from ${path}`)
      drift++
    }
  }
}

if (drift) {
  console.error(`\n${drift} example file(s) differ from registry/. Copy the registry source over them.`)
  process.exit(1)
}
console.log(`examples match registry/ (${files.length} files x ${EXAMPLES.length} examples)`)

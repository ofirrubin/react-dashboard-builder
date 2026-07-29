// The CJS entry needs its own declaration file: `exports.require.types` points at
// index.d.cts, and TypeScript will not fall back to index.d.ts for it.
import { copyFileSync, readFileSync, writeFileSync } from "node:fs"

copyFileSync("dist/index.d.ts", "dist/index.d.cts")

// Keep the sourcemap comment pointing at a file that exists.
const cts = readFileSync("dist/index.d.cts", "utf8").replace(
  "//# sourceMappingURL=index.d.ts.map",
  "//# sourceMappingURL=index.d.cts.map"
)
writeFileSync("dist/index.d.cts", cts)
copyFileSync("dist/index.d.ts.map", "dist/index.d.cts.map")

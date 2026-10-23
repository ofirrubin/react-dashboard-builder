import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

import { installCanvasStubs, setCanvasWidth } from "./canvas"

installCanvasStubs()

afterEach(() => {
  cleanup()
  setCanvasWidth(1200)
})

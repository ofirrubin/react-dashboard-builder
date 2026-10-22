import { act } from "@testing-library/react"

/**
 * jsdom does no layout: every `clientWidth` is 0 and there is no
 * `ResizeObserver`. Left alone, the dashboard never measures, renders nothing,
 * and every assertion about it passes against an empty canvas. These stubs give
 * the canvas a width the tests control.
 */
let canvasWidth = 1200

type Observer = { callback: ResizeObserverCallback; self: ResizeObserver }
const observers = new Set<Observer>()

class ResizeObserverStub implements ResizeObserver {
  #entry: Observer
  constructor(callback: ResizeObserverCallback) {
    this.#entry = { callback, self: this }
  }
  observe() {
    observers.add(this.#entry)
  }
  unobserve() {}
  disconnect() {
    observers.delete(this.#entry)
  }
}

export function installCanvasStubs() {
  globalThis.ResizeObserver = ResizeObserverStub
  Object.defineProperty(HTMLElement.prototype, "clientWidth", {
    configurable: true,
    get(this: HTMLElement) {
      return this.dataset?.slot === "dashboard-canvas" ? canvasWidth : 0
    },
  })

  // jsdom has no PointerEvent, so `fireEvent.pointerDown` would build a plain
  // Event and `pointerType` — which decides touch vs. mouse — would be lost.
  if (typeof window.PointerEvent === "undefined") {
    class PointerEventStub extends MouseEvent {
      pointerType: string
      pointerId: number
      constructor(type: string, init: PointerEventInit = {}) {
        super(type, init)
        this.pointerType = init.pointerType ?? "mouse"
        this.pointerId = init.pointerId ?? 1
      }
    }
    window.PointerEvent = PointerEventStub as unknown as typeof PointerEvent
  }
}

/** Set the width the canvas reports. Call before rendering. */
export function setCanvasWidth(width: number) {
  canvasWidth = width
}

/** Change the width and fire the observers, as a real window resize would. */
export function resizeCanvas(width: number) {
  canvasWidth = width
  act(() => {
    for (const { callback, self } of observers) callback([], self)
  })
}

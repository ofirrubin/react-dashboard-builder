import { MoonIcon, SunIcon } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { DashboardDemo } from "@/components/dashboard-demo"

function ThemeToggle() {
  const [dark, setDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches
  )

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
  }, [dark])

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setDark((value) => !value)}
    >
      {dark ? <SunIcon /> : <MoonIcon />}
    </Button>
  )
}

export function App() {
  // `antialiased` on the root gives crisper text on macOS.
  return (
    <div className="bg-background text-foreground min-h-svh antialiased">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
              rud-dashboard
            </span>
            <span className="text-muted-foreground text-sm text-pretty">
              React 19 &middot; Vite &middot; installed from the shadcn registry
            </span>
          </div>
          {/* Proves the dashboard follows the host theme in both modes. */}
          <ThemeToggle />
        </div>

        <DashboardDemo />
      </div>
    </div>
  )
}

export default App

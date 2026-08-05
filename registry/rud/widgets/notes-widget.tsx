import { cn } from "@/lib/utils"

export interface NotesWidgetProps {
  /**
   * Rendered prose. Pass a markdown renderer's output, streamed assistant
   * output, or plain JSX — Typeset styles the resulting elements either way.
   */
  children: React.ReactNode
  className?: string
}

/**
 * A prose widget styled by Typeset.
 *
 * Text-heavy widgets are where a dashboard usually falls apart: headings and
 * lists arrive unstyled because the surrounding app resets them, so every
 * project re-styles the same elements by hand. Typeset handles all of it from
 * one CSS file, driven by three custom properties.
 *
 * `typeset-widget` tightens the rhythm for a small grid cell. It is defined in
 * the dashboard theme CSS; adjust it there, or override inline:
 *
 *     <NotesWidget className="[--typeset-flow:1.5em]">…</NotesWidget>
 */
export function NotesWidget({ children, className }: NotesWidgetProps) {
  return (
    <div className={cn("typeset typeset-widget h-full overflow-auto", className)}>
      {children}
    </div>
  )
}

const PREVIEW_LINES = ["w-full", "w-[85%]", "w-[92%]", "w-[60%]"]

/**
 * Miniature for the add-widget bar: a heading and a few lines of prose, fading
 * in line by line as the bar opens.
 */
export function NotesWidgetPreview() {
  return (
    <div className="flex h-full flex-col gap-1.5">
      <span className="bg-foreground/60 h-1.5 w-12 rounded-full motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300" />
      {PREVIEW_LINES.map((width, index) => (
        <span
          key={width}
          className={cn(
            "bg-muted-foreground/25 h-1 rounded-full",
            "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-1",
            "motion-safe:fill-mode-backwards motion-safe:duration-300",
            width
          )}
          style={{ animationDelay: `${60 + index * 55}ms` }}
        />
      ))}
    </div>
  )
}

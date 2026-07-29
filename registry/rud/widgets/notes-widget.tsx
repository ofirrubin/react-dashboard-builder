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

This document defines the visual language and user interface standards for all frontend development. Adherence to these guidelines ensures a modern, clean, and professional SaaS aesthetic.

1. Visual Philosophy
The design follows a Modern SaaS / Clean Admin aesthetic. It prioritizes high legibility, generous whitespace, and a friendly yet professional feel.

Clarity over Decoration: Every element must serve a functional purpose.

Depth & Elevation: Use soft shadows and layering rather than heavy borders to create hierarchy.

Approachability: Use rounded geometry to make the interface feel modern and less rigid.

2. Color Palette
Backgrounds:

Main App Background: Light Gray/Off-white (#F4F7FA).

Surface/Card Background: Pure White (#FFFFFF).

Accents:

Primary: Vibrant Electric Blue (#3B82F6) for active states, primary buttons, and key highlights.

Secondary/Status: Soft pastels (Mint Green for success, Coral for warnings/errors).

Text:

Headings: Deep Charcoal (#1F2937).

Body: Slate Gray (#4B5563).

Muted/Labels: Cool Gray (#9CA3AF).

3. Geometry & Spacing
Border Radius: Use a consistent large radius for cards and containers (e.g., 12px to 16px). Buttons should have a medium radius (8px).

Whitespace: Implement generous padding (min 24px) within cards and between major layout sections to prevent "visual crowding."

Shadows: Use low-opacity, large-blur drop shadows (e.g., rgba(0, 0, 0, 0.05)) to lift cards off the background.

4. Components & Layout
Sidebar:

Background: Slightly distinct from the main area (either pure white or very light gray).

Icons: Use "Thin-Line" or "Outline" style icons.

Active State: Use a subtle background pill-shape and primary blue color for the icon/text.

Widgets/Cards:

Every widget must be contained in a white card with rounded corners.

Headers inside cards should be bold and clearly separated from the content.

Data Visualization:

Charts: Use smooth interpolation (curved lines) for graphs.

Gradients: Apply subtle vertical gradients under line charts to add depth.

Maps: Use a simplified, minimalist map style with circular markers for data points.

5. Implementation Instructions for LLMs
When generating code or layouts based on this document:

Framework: Default to modern CSS frameworks (Tailwind CSS preferred).

Typography: Use geometric sans-serif fonts (e.g., Inter, Public Sans).

Hierarchy: Ensure a clear distinction between primary actions and secondary information.

Responsiveness: Maintain the grid-based logic while ensuring cards stack elegantly on smaller viewports.
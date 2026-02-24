import { useState } from 'preact/hooks'
import { Dashboard } from 'rud-dashboard/preact'
import 'rud-dashboard/styles.css'
import './app.css'
import { MoreHorizontal, Edit, Copy } from 'lucide-preact'

export function App() {
  const [showDropdown, setShowDropdown] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })

  const handleMenuClick = (e: any) => {
    e.stopPropagation()
    const buttonRect = (e.target as HTMLElement).getBoundingClientRect()
    setDropdownPosition({
      top: buttonRect.bottom + 5,
      left: buttonRect.left
    })
    setShowDropdown(true)
  }

  // Define available widget types with icons
  const availableWidgets: any[] = [
    {
      id: 'basic',
      type: 'basic',
      title: 'Basic Widget',
      icon: '📝',
      defaultSize: { w: 4, h: 4 },
      description: 'A simple widget for displaying content',
      component: null,
      preview: null
    },
    {
      id: 'custom-ui-widget',
      type: 'custom-ui-widget',
      title: 'Custom CSS Widget',
      icon: '🎨',
      defaultSize: { w: 4, h: 4 },
      description: 'A widget demonstrating custom Vanilla CSS styling',
      component: () => (
        <div className="custom-widget-card">
          <h3 className="widget-title">Interactive Widget</h3>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            This widget uses pure vanilla CSS classes mapped in app.css without Tailwind!
          </p>
          <button className="widget-button" onClick={() => alert('Clicked from custom widget!')}>
            Click Me
          </button>
        </div>
      ),
      preview: null
    }
  ]

  return (
    <div className="app-container">
      <div className="demo-header">
        <h1 className="demo-title">rud-dashboard Vanilla CSS & Widgets</h1>
        <p className="demo-subtitle">
          Example without Tailwind CSS logic showing how to inject custom React content and styled widgets.
        </p>
      </div>

      {showDropdown && (
        <>
          <div
            className="dropdown-overlay"
            onClick={() => setShowDropdown(false)}
          />
          <div
            className="dropdown-menu"
            style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
          >
            <div style={{ padding: '0.25rem 0' }}>
              <button className="dropdown-item" onClick={() => setShowDropdown(false)}>
                <Edit size={16} /> Edit Widget
              </button>
              <button className="dropdown-item" onClick={() => setShowDropdown(false)}>
                <Copy size={16} /> Duplicate
              </button>
            </div>
          </div>
        </>
      )}

      <Dashboard
        enableEditMode={true}
        defaultEditMode={false}
        gridMode="elegant"
        showDefaultToolbar={true}
        availableWidgetTypes={availableWidgets}
        initialItems={[
          {
            id: 'widget-1',
            type: 'custom-ui-widget',
            title: 'Designer Widget',
            x: 0,
            y: 0,
            w: 4,
            h: 4,
            onMenuClick: handleMenuClick,
            menuIcon: <MoreHorizontal size={14} />
          }
        ] as any}
      />

      <div className="success-message">
        <span style={{ fontSize: '1.5rem' }}>✅</span>
        <div>
          <h3>Vanilla CSS Setup Working!</h3>
          <p>
            The dashboard correctly loads `dist/styles.css` without requiring Tailwind to be installed
            in your framework. The custom widget renders custom HTML classes.
          </p>
        </div>
      </div>
    </div>
  )
}

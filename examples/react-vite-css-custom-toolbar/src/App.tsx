import { useState } from 'react'
import { Dashboard } from 'rud-dashboard'
import 'rud-dashboard/styles.css'
import './App.css'
import { MoreHorizontal, Edit, Copy, Save, Send } from 'lucide-react'

export default function App() {
  const [showDropdown, setShowDropdown] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })

  const handleMenuClick = (e: React.MouseEvent) => {
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
    }
  ]

  // The custom action buttons to inject into the toolbar
  const renderCustomActions = (isEditMode: boolean) => {
    return (
      <div className="toolbar-actions-group">
        <button
          onClick={() => alert("Dashboard Saved!")}
          className={`toolbar-btn toolbar-btn-primary ${isEditMode ? 'edit-mode' : ''}`}
        >
          <Save size={16} /> {isEditMode ? 'Save Layout' : 'Save State'}
        </button>
        <button
          onClick={() => alert("Report Sent!")}
          className="toolbar-btn toolbar-btn-secondary"
        >
          <Send size={16} /> Send Report
        </button>
      </div>
    )
  }

  return (
    <div className="app-container">
      <div className="demo-header">
        <h1 className="demo-title">rud-dashboard Custom Toolbar Actions</h1>
        <p className="demo-subtitle">
          Example showing how to inject dynamic action buttons into the right side of the main widget toolbar!
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
        customToolbarActions={renderCustomActions}
        initialItems={[
          {
            id: 'widget-1',
            type: 'basic',
            title: 'Primary Widget',
            x: 0,
            y: 0,
            w: 4,
            h: 4,
            onMenuClick: handleMenuClick,
            menuIcon: <MoreHorizontal size={14} />
          } as any
        ]}
      />

      <div className="success-message">
        <span style={{ fontSize: '1.5rem' }}>✅</span>
        <div>
          <h3>Toolbar Injection Working!</h3>
          <p>
            The dashboard correctly injects the custom actions returned by `customToolbarActions(isEditMode)`.
            Try toggling edit mode and watching the "Save State" button intuitively change to "Save Layout"!
          </p>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Dashboard } from 'rud-dashboard'
import 'rud-dashboard/styles.css'
import './App.css'
import { Info, Upload, Download, RefreshCw, MoreHorizontal, Edit, Copy, Trash2, Share2, Save, Send } from 'lucide-react'

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
  const availableWidgets = [
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
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          onClick={() => alert("Dashboard Saved!")}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', borderRadius: '8px',
            backgroundColor: isEditMode ? '#10b981' : '#3b82f6',
            color: 'white', border: 'none', cursor: 'pointer',
            fontWeight: '600', fontSize: '14px',
            transition: 'background-color 0.2s'
          }}
        >
          <Save size={16} /> {isEditMode ? 'Save Layout' : 'Save State'}
        </button>
        <button
          onClick={() => alert("Report Sent!")}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', borderRadius: '8px',
            backgroundColor: 'transparent',
            color: '#475569', border: '1px solid #cbd5e1', cursor: 'pointer',
            fontWeight: '600', fontSize: '14px'
          }}
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
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
            onClick={() => setShowDropdown(false)}
          />
          <div
            style={{
              position: 'fixed', zIndex: 50, width: '12rem', borderRadius: '0.375rem',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', background: 'white',
              border: '1px solid #e2e8f0', top: dropdownPosition.top, left: dropdownPosition.left
            }}
          >
            <div style={{ padding: '0.25rem 0' }}>
              <button style={{ width: '100%', textAlign: 'left', padding: '0.5rem 1rem', display: 'flex', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowDropdown(false)}>
                <Edit size={16} /> Edit Widget
              </button>
              <button style={{ width: '100%', textAlign: 'left', padding: '0.5rem 1rem', display: 'flex', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowDropdown(false)}>
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
          }
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

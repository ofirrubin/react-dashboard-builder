import { useState } from 'preact/hooks'
import { Dashboard } from 'rud-dashboard/preact'
import 'rud-dashboard/styles.css'
import { Settings, Upload, Download, RefreshCw, MoreHorizontal, Edit, Copy, Trash2, Share2 } from 'lucide-preact'

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
  },
  {
    id: 'progress',
    type: 'progress',
    title: 'Progress Bar',
    icon: '📊',
    defaultSize: { w: 4, h: 4 },
    description: 'Display progress with a bar',
    component: null,
    preview: null
  },
  {
    id: 'pie',
    type: 'pie',
    title: 'Pie Chart',
    icon: '🥧',
    defaultSize: { w: 4, h: 4 },
    description: 'Visualize data distribution',
    component: null,
    preview: null
  },
  {
    id: 'bar',
    type: 'bar',
    title: 'Bar Chart',
    icon: '📊',
    defaultSize: { w: 2, h: 2 },
    description: 'Compare data with bars',
    component: null,
    preview: null
  },
  {
    id: 'line',
    type: 'line',
    title: 'Line Chart',
    icon: '📈',
    defaultSize: { w: 2, h: 2 },
    description: 'Show trends over time',
    component: null,
    preview: null
  }
]

export function App() {
  const [showDialog, setShowDialog] = useState<string | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })

  const showNotification = (message: string) => {
    setShowDialog(message)
    setTimeout(() => setShowDialog(null), 2000)
  }

  const handleBasicWidgetMenu = (e: any) => {
    e.stopPropagation()
    const buttonRect = (e.target as HTMLElement).getBoundingClientRect()
    setDropdownPosition({
      top: buttonRect.bottom + 5,
      left: buttonRect.left
    })
    setShowDropdown(true)
  }

  const handleDropdownAction = (action: string) => {
    showNotification(`${action} clicked for Basic Widget`)
    setShowDropdown(false)
  }

  const handleSettingsClick = (widgetId: string) => (e: any) => {
    showNotification(`Settings for ${widgetId}`)
  }

  const handleUploadClick = (widgetId: string) => (e: any) => {
    showNotification(`Upload data for ${widgetId}`)
  }

  const handleRefreshClick = (widgetId: string) => (e: any) => {
    showNotification(`Refreshing ${widgetId}...`)
  }

  const handleDownloadClick = (widgetId: string) => (e: any) => {
    showNotification(`Downloading data from ${widgetId}...`)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            rud-dashboard Preact + Tailwind Theme
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Testing the package with Preact compat mode + Tailwind CSS!
          </p>
        </div>

        {/* Demo notification */}
        {showDialog && (
          <div className="fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-2">
            {showDialog}
          </div>
        )}

        {/* Dropdown Menu */}
        {showDropdown && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowDropdown(false)}
            />
            <div
              className="fixed z-50 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5"
              style={{ top: `${dropdownPosition.top}px`, left: `${dropdownPosition.left}px` }}
            >
              <div className="py-1">
                <button
                  className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleDropdownAction('Edit')}
                >
                  <Edit size={16} />
                  <span>Edit Widget</span>
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleDropdownAction('Duplicate')}
                >
                  <Copy size={16} />
                  <span>Duplicate</span>
                </button>
                <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
                <button
                  className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => handleDropdownAction('Delete')}
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
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
              type: 'basic',
              title: 'Basic Widget with Menu',
              x: 0,
              y: 0,
              w: 4,
              h: 4,
              onMenuClick: handleBasicWidgetMenu,
              menuIcon: <MoreHorizontal size={14} />
            },
            {
              id: 'widget-2',
              type: 'progress',
              title: 'Upload Widget',
              x: 4,
              y: 0,
              w: 4,
              h: 4,
              onMenuClick: handleUploadClick('widget-2'),
              menuIcon: <Upload size={14} />
            }
          ]}
        />

        {/* Success Message */}
        <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800">
          <div className="flex items-start gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <h3 className="font-semibold text-green-900 dark:text-green-300">Preact Build Running!</h3>
              <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                Both Preact and Tailwind components resolve flawlessly from rud-dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

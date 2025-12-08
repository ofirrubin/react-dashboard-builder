import React from 'react'
import { Dashboard } from '../src/index'

// Define available widget types with icons
const availableWidgets = [
  {
    id: 'basic',
    type: 'basic',
    title: 'Basic Widget',
    icon: '📝',
    defaultSize: { w: 2, h: 1 },
    description: 'A simple widget for displaying content',
    component: null,
    preview: null
  },
  {
    id: 'progress',
    type: 'progress',
    title: 'Progress Bar',
    icon: '📊',
    defaultSize: { w: 2, h: 1 },
    description: 'Display progress with a bar',
    component: null,
    preview: null
  },
  {
    id: 'pie',
    type: 'pie',
    title: 'Pie Chart',
    icon: '🥧',
    defaultSize: { w: 2, h: 2 },
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

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            rud-dashboard React Playground
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Testing the package with React + Vite
          </p>
        </div>

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
              title: 'Welcome Widget',
              x: 0,
              y: 0,
              w: 2,
              h: 1
            },
            {
              id: 'widget-2',
              type: 'basic',
              title: 'Stats Widget',
              x: 2,
              y: 0,
              w: 2,
              h: 1
            },
            {
              id: 'widget-3',
              type: 'pie',
              title: 'Distribution',
              x: 0,
              y: 1,
              w: 2,
              h: 2
            },
            {
              id: 'widget-4',
              type: 'line',
              title: 'Trends',
              x: 2,
              y: 1,
              w: 2,
              h: 2
            }
          ]}
        />

        {/* Success Message */}
        <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <h3 className="font-semibold text-green-900">Package Working!</h3>
              <p className="text-sm text-green-700 mt-1">
                The rud-dashboard package is working with React + Vite. 
                Try toggling edit mode to drag, resize, and add widgets!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


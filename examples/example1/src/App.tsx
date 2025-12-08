import { Dashboard, useDashboardController } from 'react-dashboard-builder';
import 'react-dashboard-builder/dist/index.css';

const widgetType = {
  id: 'basic',
  type: 'basic',
  title: 'Basic Widget',
  description: 'A minimal widget',
  icon: <span>📦</span>,
  defaultSize: { w: 4, h: 4 },
  component: ({ title }: any) => (
    <div className="w-full h-full p-4 bg-white dark:bg-gray-800 rounded shadow">
      <h3 className="font-bold">{title}</h3>
      <p>Simple content</p>
    </div>
  ),
  preview: () => <div>Preview</div>
};

function App() {
  const controller = useDashboardController({
    initialItems: [
      { id: '1', type: 'basic', title: 'First Widget', x: 0, y: 0, w: 4, h: 4 }
    ],
    initialEditMode: true
  });

  return (
    <div className="w-full h-screen bg-gray-50 dark:bg-gray-900">
      <Dashboard
        controller={controller}
        widgetRegistry={{ 'basic': widgetType.component }}
        availableWidgetTypes={[widgetType]}
        enableEditMode={true}
        toolbarClassName="p-4 mb-4"
      />
    </div>
  );
}

export default App;

import { Dashboard, useDashboardController } from 'react-dashboard-builder';
import 'react-dashboard-builder/dist/index.css';

// Simple widgets registry
const widgetRegistry = {
  'basic': ({ title }: { title: string }) => <div className="p-4">{title} Content</div>,
};

const availableWidgetTypes = [
  {
    id: 'basic',
    type: 'basic',
    title: 'Basic Widget',
    description: 'A basic widget',
    icon: <span>📦</span>,
    defaultSize: { w: 4, h: 4 },
    component: ({ title }: any) => <div>{title}</div>,
    preview: () => <div>Preview</div>
  }
];

function App() {
  const controller = useDashboardController({
    initialItems: [
      { id: '1', x: 0, y: 0, w: 4, h: 4, type: 'basic', title: 'Widget 1' },
      { id: '2', x: 4, y: 0, w: 4, h: 4, type: 'basic', title: 'Widget 2' },
    ],
    initialEditMode: true
  });

  return (
    <div className="w-full h-screen">
      <div className="p-4 border-b flex gap-4 items-center">
        <button onClick={controller.toggleEditMode} style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '4px' }}>
          {controller.isEditMode ? 'Exit Edit' : 'Edit Mode'}
        </button>
        <button onClick={() => controller.addItem({
          id: Date.now().toString(),
          x: 0, y: 0, w: 4, h: 4,
          type: 'basic',
          title: 'New Widget ' + controller.items.length,
          content: () => <div>New Widget Content</div>
        })} style={{ padding: '8px 16px', backgroundColor: '#22c55e', color: 'white', borderRadius: '4px' }}>
          Add Widget
        </button>
        <button onClick={() => {
          const saved = controller.save();
          console.log('Saved:', saved);
          alert('Saved to console: ' + JSON.stringify(saved, null, 2));
        }} style={{ padding: '8px 16px', backgroundColor: '#6b7280', color: 'white', borderRadius: '4px' }}>
          Save
        </button>
      </div>
      <div className="w-full h-full">
        <Dashboard
          controller={controller}
          widgetRegistry={widgetRegistry}
          availableWidgetTypes={availableWidgetTypes}
          enableEditMode={true}
        />
      </div>
    </div>
  );
}

export default App;

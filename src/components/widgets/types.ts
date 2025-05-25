// export interface WidgetType {
//     id: string;
//     type: string;
//     title: string;
//     icon: React.ReactNode;
//     defaultSize: { w: number; h: number };
//     description: string;
//   }

export interface WidgetType {
    id: string;
    type: string;
    title: string;
    icon: React.ReactNode;
    defaultSize: { w: number; h: number };
    description: string;
    component: React.ComponentType<any>;
    preview: React.ComponentType<any>;
}
  
  
export interface DashboardToolbarProps {
    isEditMode: boolean;
    onToggleMode: () => void;
    onAutoOrganize: () => void;
    onToggleFixedHeight: () => void;
    isFixedHeight: boolean;
    gridDimensions: { cols: number; rows: number };
    itemCount: number;
    isAddWidgetMode?: boolean;
    onToggleAddWidgetMode?: () => void;
    onAddWidget?: (widgetType: WidgetType) => void;
    onDebugPositions?: () => void;
    availableWidgetTypes?: WidgetType[];
}
  
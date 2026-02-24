import type { Meta, StoryObj } from '@storybook/react';
import { DashboardToolbar } from './DashboardToolbar';

const meta: Meta<typeof DashboardToolbar> = {
    title: 'Components/DashboardToolbar',
    component: DashboardToolbar,
    parameters: {
        layout: 'padded',
    },
};

export default meta;
type Story = StoryObj<typeof DashboardToolbar>;

export const Default: Story = {
    args: {
        isEditMode: true,
        gridDimensions: {
            width: 1200,
            height: 800,
            cols: 16,
            rows: 12,
        },
        itemCount: 3,
        onToggleMode: () => console.log('Toggle Mode'),
        onAutoOrganize: () => console.log('Auto Organize'),
        onToggleFixedHeight: () => console.log('Toggle Fixed Height'),
        isFixedHeight: false,
        onToggleAddWidgetMode: () => console.log('Toggle Add Widget'),
        isAddWidgetMode: false,
    },
};

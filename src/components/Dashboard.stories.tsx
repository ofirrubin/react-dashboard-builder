import type { Meta, StoryObj } from '@storybook/react';
import Dashboard from './Dashboard';
import { GridMode } from '../types';

const meta: Meta<typeof Dashboard> = {
    title: 'Components/Dashboard',
    component: Dashboard,
    parameters: {
        layout: 'fullscreen',
    },
    argTypes: {
        gridMode: {
            control: 'select',
            options: ['elegant', 'dots', 'harsh', 'blank'],
        },
    },
};

export default meta;
type Story = StoryObj<typeof Dashboard>;

const initialItems = [
    {
        id: '1',
        x: 0,
        y: 0,
        w: 4,
        h: 4,
        type: 'basic',
        title: 'Basic Widget 1',
    },
    {
        id: '2',
        x: 4,
        y: 0,
        w: 8,
        h: 4,
        type: 'basic',
        title: 'Wide Widget',
    },
    {
        id: '3',
        x: 0,
        y: 4,
        w: 6,
        h: 6,
        type: 'basic',
        title: 'Large Widget',
    },
];

export const Default: Story = {
    args: {
        initialItems,
        gridMode: 'elegant' as GridMode,
    },
};

export const EditMode: Story = {
    args: {
        initialItems,
        defaultEditMode: true,
        gridMode: 'elegant' as GridMode,
    },
};

export const DotsGrid: Story = {
    args: {
        initialItems,
        gridMode: 'dots' as GridMode,
    },
};

export const DarkMode: Story = {
    parameters: {
        backgrounds: { default: 'dark' },
    },
    decorators: [
        (Story) => (
            <div className="dark min-h-screen bg-gray-900 p-8">
                <Story />
            </div>
        ),
    ],
    args: {
        initialItems,
        gridMode: 'elegant' as GridMode,
    },
};

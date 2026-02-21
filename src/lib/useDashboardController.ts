"use client";
import { useState, useCallback } from 'react';
import {
    GridItem,
    DashboardController,
    UseDashboardControllerOptions,
    SerializedDashboard,
    SerializedDashboardItem
} from '../types/shared';

const CURRENT_SCHEMA_VERSION = 1;

export function useDashboardController<TNode>({
    initialItems = [],
    initialEditMode = false
}: UseDashboardControllerOptions<TNode> = {}): DashboardController<TNode> {
    const [items, setItems] = useState<GridItem<TNode>[]>(initialItems);
    const [isEditMode, setEditMode] = useState(initialEditMode);

    const addItem = useCallback((item: GridItem<TNode>) => {
        setItems(prev => [...prev, item]);
    }, []);

    const removeItem = useCallback((id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
    }, []);

    const updateItem = useCallback((id: string, updates: Partial<GridItem<TNode>>) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, ...updates } : item
        ));
    }, []);

    const toggleEditMode = useCallback(() => {
        setEditMode(prev => !prev);
    }, []);

    const save = useCallback((): SerializedDashboard => {
        const serializedItems: SerializedDashboardItem[] = items.map(item => ({
            id: item.id,
            x: item.x,
            y: item.y,
            w: item.w,
            h: item.h,
            type: item.type,
            title: item.title,
            originalX: item.originalX,
            originalY: item.originalY,
            originalW: item.originalW,
            originalH: item.originalH,
        }));

        return {
            version: CURRENT_SCHEMA_VERSION,
            items: serializedItems
        };
    }, [items]);

    const load = useCallback((state: SerializedDashboard) => {
        // Migration logic can be added here based on state.version
        if (state.version > CURRENT_SCHEMA_VERSION) {
            console.warn('Attempting to load a dashboard with a newer schema version.');
        }

        // We only load structural data; content renderers must be re-attached by the component
        const loadedItems: GridItem<TNode>[] = state.items.map(item => ({
            ...item,
            // content will be provided by the Dashboard component's registry
        } as GridItem<TNode>));

        setItems(loadedItems);
    }, []);

    const clear = useCallback(() => {
        setItems([]);
    }, []);

    return {
        items,
        addItem,
        removeItem,
        updateItem,
        setItems,
        save,
        load,
        clear,
        isEditMode,
        toggleEditMode,
        setEditMode,
    };
}

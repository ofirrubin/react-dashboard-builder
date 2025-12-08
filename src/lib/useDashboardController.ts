import { useState, useCallback } from 'react';
import { GridItem, SerializedDashboard, DashboardController, UseDashboardControllerOptions } from '../types/shared';

export function useDashboardController({
    initialItems = [],
    initialEditMode = false
}: UseDashboardControllerOptions = {}): DashboardController {
    const [items, setItems] = useState<GridItem[]>(initialItems);
    const [isEditMode, setIsEditMode] = useState(initialEditMode);

    const addItem = useCallback((item: GridItem) => {
        setItems((prev: GridItem[]) => [...prev, item]);
    }, []);

    const removeItem = useCallback((id: string) => {
        setItems((prev: GridItem[]) => prev.filter((item: GridItem) => item.id !== id));
    }, []);

    const updateItem = useCallback((id: string, updates: Partial<GridItem>) => {
        setItems((prev: GridItem[]) =>
            prev.map((item: GridItem) => (item.id === id ? { ...item, ...updates } : item))
        );
    }, []);

    const clear = useCallback(() => {
        setItems([]);
    }, []);

    const save = useCallback((): SerializedDashboard => {
        // Strip out non-serializable data (functions)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const serializedItems = items.map(({ content, ...rest }) => rest);
        return {
            items: serializedItems,
        };
    }, [items]);

    const load = useCallback((state: SerializedDashboard) => {
        if (state && Array.isArray(state.items)) {
            setItems(state.items as GridItem[]);
        }
    }, []);

    const toggleEditMode = useCallback(() => {
        setIsEditMode((prev: boolean) => !prev);
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
        setEditMode: setIsEditMode
    };
}

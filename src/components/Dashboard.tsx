"use client";
import * as React from 'react';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Plus, X, MoreHorizontal } from 'lucide-react';
import { DashboardToolbar } from './DashboardToolbar';
import { getWidgetComponent } from './widgets';
import { useDashboardController } from '../lib/useDashboardController';
import {
  GridItem,
  DragState,
  ResizeState,
  DashboardProps,
  WidgetType,
  DashboardActions,
  DashboardState,
  CustomToolbarProps,
  BaseWidgetProps,
  SerializedDashboardItem,
  GridMode
} from '../types/index';
import {
  GRID_SIZE,
  MARGIN,
  CELL_SIZE,
  ANIMATION_DURATION,
  MIN_SIZE,
  MAX_SIZE,
  CONTAINER_PADDING,
  MIN_CONTAINER_HEIGHT,
  DEBOUNCE_DELAY
} from '../constants';
import { cn } from '../lib/utils';

interface WidgetRendererProps {
  widgetRegistry?: Record<string, React.ComponentType<BaseWidgetProps>>;
}

const createWidgetRenderer = ({ widgetRegistry }: WidgetRendererProps) => (item: GridItem): React.ReactNode => {
  const WidgetComponent = (widgetRegistry && widgetRegistry[item.type]) || getWidgetComponent(item.type);

  return React.createElement(WidgetComponent as any, {
    id: item.id,
    title: item.title,
    type: item.type
  });
};

export default function Dashboard({
  availableWidgetTypes = [],
  initialItems = [],
  widgetRegistry,
  onItemsChange,
  className = "",
  enableEditMode = true,
  defaultEditMode = true,
  gridMode = 'elegant',
  showDefaultToolbar = true,
  customToolbar,
  toolbarClassName = "",
  onEditModeChange,
  onAddWidgetModeChange,
  onFixedHeightChange,
  controller: externalController,
}: DashboardProps) {
  const renderWidgetContent = useMemo(() => createWidgetRenderer({ widgetRegistry }), [widgetRegistry]);

  const transformInitialItems = useCallback((itemsList: SerializedDashboardItem[] = []): GridItem[] => {
    return itemsList.map((item: SerializedDashboardItem) => ({
      ...item,
      content: () => renderWidgetContent(item as GridItem)
    }));
  }, [renderWidgetContent]);

  const internalController = useDashboardController<React.ReactNode>({
    initialItems: transformInitialItems(initialItems),
    initialEditMode: enableEditMode ? defaultEditMode : false
  });

  const controller = externalController || internalController;

  const items = useMemo(() => {
    return (controller.items as GridItem[]).map((item: GridItem) => {
      if (!item.content) {
        return { ...item, content: () => renderWidgetContent(item) } as GridItem;
      }
      return item;
    });
  }, [controller.items, renderWidgetContent]);

  const setItems = controller.setItems;
  const isEditMode = controller.isEditMode;
  const setIsEditMode = controller.setEditMode;

  const [nextId, setNextId] = useState(() => {
    if (initialItems.length === 0) return 1;
    const maxId = Math.max(...initialItems.map(item => parseInt(item.id) || 0));
    return maxId + 1;
  });

  const [dragState, setDragState] = useState<DragState | null>(null);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const [preview, setPreview] = useState<GridItem | null>(null);
  const [gridDimensions, setGridDimensions] = useState({ width: 800, height: 600, cols: 16, rows: 12 });
  const [maxHeight, setMaxHeight] = useState<number | null>(null);
  const [isAddWidgetMode, setIsAddWidgetMode] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (onItemsChange && !isInitialLoad.current) {
      const itemsForCallback = items.map(({ content, ...item }: GridItem) => item);
      onItemsChange(itemsForCallback);
    }
    isInitialLoad.current = false;
  }, [items, onItemsChange]);

  const [internalGridMode, setInternalGridMode] = useState<GridMode>(gridMode);

  useEffect(() => {
    setInternalGridMode(gridMode);
  }, [gridMode]);

  useEffect(() => {
    if (externalController) return;
    const hasNewItems = initialItems.some(initItem => !items.find(item => item.id === initItem.id));
    const hasMissingItems = items.some(item => !initialItems.find(initItem => initItem.id === item.id) && initialItems.length > 0);

    if (hasNewItems || (hasMissingItems && items.length < initialItems.length)) {
      const transformedItems = transformInitialItems(initialItems);
      setItems(transformedItems as any);
      isInitialLoad.current = true;
    }
  }, [initialItems, transformInitialItems, externalController, items, setItems]);

  const itemsOverlap = (a: GridItem, b: GridItem) =>
    !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);

  const pixelToGrid = useCallback((px: number, py: number): { x: number; y: number } => {
    return {
      x: Math.round(px / CELL_SIZE),
      y: Math.round(py / CELL_SIZE)
    };
  }, []);

  const gridToPixel = (x: number, y: number) => ({
    x: x * CELL_SIZE,
    y: y * CELL_SIZE
  });

  const createCollisionMatrix = (itemsToMatrix: GridItem[], maxCols: number): boolean[][] => {
    const maxH = Math.max(...itemsToMatrix.map(it => it.y + it.h), 0) + 100;
    const matrix: boolean[][] = Array(maxH).fill(null).map(() => Array(maxCols).fill(false));

    itemsToMatrix.forEach(item => {
      const startX = Math.max(0, item.x);
      const startY = Math.max(0, item.y);
      const endX = Math.min(maxCols, startX + item.w);
      const endY = startY + item.h;

      while (matrix.length < endY) {
        matrix.push(Array(maxCols).fill(false));
      }

      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          if (matrix[y] && x < maxCols) {
            matrix[y][x] = true;
          }
        }
      }
    });
    return matrix;
  };

  const isPositionFree = (matrix: boolean[][], testX: number, testY: number, testW: number, testH: number, maxCols: number): boolean => {
    if (testX < 0 || testY < 0 || testX + testW > maxCols) return false;

    for (let y = testY; y < testY + testH; y++) {
      for (let x = testX; x < testX + testW; x++) {
        if (y < matrix.length && matrix[y][x]) {
          return false;
        }
      }
    }
    return true;
  };

  const findSafePosition = (item: GridItem, existingItems: GridItem[], preferCurrentOverStoredOriginal = false): { x: number; y: number; w: number; h: number; isAnimating: boolean } => {
    let currentW = Math.min(item.w, gridDimensions.cols);
    let currentH = item.h;

    let startX = item.x;
    let startY = item.y;

    if (!preferCurrentOverStoredOriginal && item.originalX !== undefined && item.originalY !== undefined) {
      startX = item.originalX;
      startY = item.originalY;
      if (item.originalW !== undefined) currentW = Math.min(item.originalW, gridDimensions.cols);
      if (item.originalH !== undefined) currentH = item.originalH;
    }

    startX = Math.max(0, Math.min(startX, gridDimensions.cols - currentW));
    startY = Math.max(0, startY);

    const matrix = createCollisionMatrix(existingItems, gridDimensions.cols);

    if (isPositionFree(matrix, startX, startY, currentW, currentH, gridDimensions.cols)) {
      return { x: startX, y: startY, w: currentW, h: currentH, isAnimating: true };
    }

    if (!preferCurrentOverStoredOriginal) {
      for (let y = startY + 1; y < startY + 50; y++) {
        if (isPositionFree(matrix, startX, y, currentW, currentH, gridDimensions.cols)) {
          return { x: startX, y, w: currentW, h: currentH, isAnimating: true };
        }
      }
    }

    for (let y = 0; y < matrix.length + currentH; y++) {
      for (let x = 0; x <= gridDimensions.cols - currentW; x++) {
        if (isPositionFree(matrix, x, y, currentW, currentH, gridDimensions.cols)) {
          return { x, y, w: currentW, h: currentH, isAnimating: true };
        }
      }
    }

    return { ...item, x: 0, y: matrix.length, w: currentW, h: currentH, isAnimating: true };
  };

  const detectAndFixOverlaps = useCallback((currentItems: GridItem[], tryReAnchorToOriginals = false): GridItem[] => {
    const sorted = [...currentItems].sort((a, b) => b.y === a.y ? a.x - b.x : a.y - b.y);
    const resolved: GridItem[] = [];
    let matrix: boolean[][] = [];

    const activeId = dragState?.id || resizeState?.id;
    const activeItem = sorted.find(i => i.id === activeId);

    if (activeItem) {
      resolved.push(activeItem);
      matrix = createCollisionMatrix(resolved, gridDimensions.cols);
    }

    for (const item of sorted) {
      if (item.id === activeId) continue;

      let currentW = Math.min(item.w, gridDimensions.cols);
      let currentH = Math.max(MIN_SIZE, item.h);
      let targetX = Math.max(0, Math.min(item.x, gridDimensions.cols - currentW));
      let targetY = Math.max(0, item.y);

      if (tryReAnchorToOriginals && item.originalX !== undefined && item.originalY !== undefined) {
        targetX = Math.max(0, Math.min(item.originalX, gridDimensions.cols - currentW));
        targetY = Math.max(0, item.originalY);
      }

      if (!isPositionFree(matrix, targetX, targetY, currentW, currentH, gridDimensions.cols)) {
        let newY = targetY;
        while (!isPositionFree(matrix, targetX, newY, currentW, currentH, gridDimensions.cols)) {
          newY++;
        }
        targetY = newY;
      }

      const positionedItem: GridItem = {
        ...item,
        x: targetX,
        y: targetY,
        w: currentW,
        h: currentH,
        isAnimating: true
      };

      resolved.push(positionedItem);
      matrix = createCollisionMatrix(resolved, gridDimensions.cols);
    }

    return resolved;
  }, [dragState, resizeState, gridDimensions.cols]);

  const findSafePositionForNewGrid = (item: GridItem, existingItems: GridItem[], preferCurrentOverStoredOriginal = false, cols: number, rows: number): { x: number; y: number; w: number; h: number; isAnimating: boolean } => {
    let currentW = Math.min(item.w, cols);
    let currentH = item.h;

    let startX = item.x;
    let startY = item.y;

    if (item.originalX !== undefined && item.originalY !== undefined && !preferCurrentOverStoredOriginal) {
      startX = item.originalX;
      startY = item.originalY;
      if (item.originalW !== undefined) currentW = Math.min(item.originalW, cols);
      if (item.originalH !== undefined) currentH = item.originalH;
    }

    startX = Math.min(startX, cols - currentW);

    const testItemInitial = { ...item, x: startX, y: startY, w: currentW, h: currentH };

    const isValidForNewGrid = (testItem: GridItem) => {
      if (testItem.w < MIN_SIZE || testItem.h < MIN_SIZE) return false;
      if (testItem.x < 0 || testItem.y < 0 ||
        testItem.x + testItem.w > cols ||
        testItem.y + testItem.h > rows) {
        return false;
      }
      return !existingItems.some(other => {
        if (other.id === testItem.id) return false;
        return itemsOverlap(testItem, other);
      });
    };

    if (isValidForNewGrid(testItemInitial as GridItem)) {
      return { ...testItemInitial, isAnimating: true };
    }

    const matrix = createCollisionMatrix(existingItems, cols);
    for (let y = startY; y < matrix.length + currentH; y++) {
      for (let x = 0; x <= cols - currentW; x++) {
        const candidateItem = { ...item, x, y, w: currentW, h: currentH };
        if (isPositionFree(matrix, x, y, currentW, currentH, cols)) {
          return { ...candidateItem, isAnimating: true };
        }
      }
    }

    return { ...item, x: 0, y: 0, w: Math.min(currentW, cols), h: Math.min(currentH, rows), isAnimating: true };
  };

  const reflowItems = useCallback((newCols: number, newRows: number) => {
    const processedItems: GridItem[] = [];

    const isValidPositionForNewGrid = (item: GridItem, allItems: GridItem[]) => {
      if (item.w < MIN_SIZE || item.h < MIN_SIZE) return false;
      if (item.x < 0 || item.y < 0 ||
        item.x + item.w > newCols ||
        item.y + item.h > newRows) {
        return false;
      }
      return !allItems.some(other => {
        if (other.id === item.id) return false;
        return itemsOverlap(item, other);
      });
    };

    const sortedItems = [...items].sort((a, b) => {
      const aHasOriginal = a.originalX !== undefined && a.originalY !== undefined;
      const bHasOriginal = b.originalX !== undefined && b.originalY !== undefined;
      if (aHasOriginal && !bHasOriginal) return -1;
      if (!aHasOriginal && bHasOriginal) return 1;
      if (aHasOriginal && bHasOriginal) {
        if (a.originalY! !== b.originalY!) return a.originalY! - b.originalY!;
        return a.originalX! - b.originalX!;
      }
      return parseInt(a.id) - parseInt(b.id);
    });

    const itemsToProcess = sortedItems.map((item: GridItem) => {
      const targetW = item.originalW !== undefined ? Math.min(item.originalW, newCols) : Math.min(item.w, newCols);
      const targetH = item.originalH !== undefined ? item.originalH : item.h;
      return {
        ...item,
        w: Math.max(MIN_SIZE, targetW),
        h: Math.max(MIN_SIZE, targetH),
        isAnimating: true,
      } as GridItem;
    });

    if (newCols > gridDimensions.cols) {
      const restored: GridItem[] = [];
      const needsRepositioning: GridItem[] = [];

      for (const item of itemsToProcess) {
        if (item.originalX !== undefined && item.originalY !== undefined) {
          const restoredItem = {
            ...item,
            x: item.originalX,
            y: item.originalY,
          };
          if (restoredItem.x + restoredItem.w <= newCols &&
            restoredItem.y + restoredItem.h <= newRows &&
            isValidPositionForNewGrid(restoredItem as GridItem, restored)) {
            restored.push(restoredItem as GridItem);
          } else {
            needsRepositioning.push(item as GridItem);
          }
        } else {
          needsRepositioning.push(item as GridItem);
        }
      }

      for (const item of needsRepositioning) {
        const safePosData = findSafePositionForNewGrid(item, restored, false, newCols, newRows);
        restored.push({
          ...item,
          x: safePosData.x,
          y: safePosData.y,
          w: safePosData.w,
          h: safePosData.h,
        });
      }
      setItems(detectAndFixOverlaps(restored, true) as any);
    } else {
      for (const item of itemsToProcess) {
        let targetX = item.x;
        if (newCols < gridDimensions.cols) {
          targetX = Math.min(item.x, Math.max(0, newCols - item.w));
        }
        const itemForSafePos = { ...item, x: targetX };
        const safePosData = findSafePositionForNewGrid(itemForSafePos as GridItem, processedItems, true, newCols, newRows);
        processedItems.push({
          ...item,
          x: safePosData.x,
          y: safePosData.y,
          w: safePosData.w,
          h: safePosData.h,
        });
      }
      setItems(() => detectAndFixOverlaps(processedItems, true) as any);
    }
    setTimeout(() => setItems((prev: GridItem[]) => prev.map((it: GridItem) => ({ ...it, isAnimating: false })) as any), ANIMATION_DURATION);
  }, [items, gridDimensions.cols, detectAndFixOverlaps, setItems]);

  const calculateDimensions = useCallback(() => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const availableWidth = rect.width - CONTAINER_PADDING * 2;
    const newCols = Math.max(MIN_SIZE, Math.floor((availableWidth + MARGIN) / CELL_SIZE));

    const tempClampedItems = items.map((it: GridItem) => ({
      ...it,
      w: Math.min(it.originalW !== undefined ? it.originalW : it.w, newCols)
    }));
    const maxY = tempClampedItems.length > 0 ? Math.max(...tempClampedItems.map(item => item.y + item.h), 0) : MIN_SIZE;

    const minRowsForMinHeight = Math.ceil((MIN_CONTAINER_HEIGHT - (CONTAINER_PADDING * 2) + MARGIN) / CELL_SIZE);
    const requiredRows = Math.max(minRowsForMinHeight, maxY + 4);

    const newHeight = maxHeight || Math.max(MIN_CONTAINER_HEIGHT,
      requiredRows * CELL_SIZE - MARGIN + CONTAINER_PADDING * 2);

    const oldCols = gridDimensions.cols;

    setGridDimensions({
      width: rect.width,
      height: newHeight,
      cols: newCols,
      rows: requiredRows
    });

    if ((newCols !== oldCols || requiredRows > gridDimensions.rows + 2) && newCols > 0 && items.length > 0) {
      reflowItems(newCols, requiredRows);
    }
  }, [items, maxHeight, gridDimensions.cols, gridDimensions.rows, reflowItems]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const gridContentRect = containerRef.current?.getBoundingClientRect();
    if (!gridContentRect) return;

    const mouseXInGridContent = e.clientX - gridContentRect.left - CONTAINER_PADDING;
    const mouseYInGridContent = e.clientY - gridContentRect.top - CONTAINER_PADDING;

    if (dragState && preview) {
      const itemX = mouseXInGridContent - dragState.startX;
      const itemY = mouseYInGridContent - dragState.startY;

      const gridPos = pixelToGrid(itemX, itemY);

      let newX = Math.max(0, Math.min(gridDimensions.cols - preview.w, gridPos.x));
      let newY = Math.max(0, Math.min(gridDimensions.rows - preview.h, gridPos.y));

      setPreview({ ...preview, x: newX, y: newY });
    }

    if (resizeState && preview) {
      let { x, y, w, h } = resizeState.originalItem;
      const handle = resizeState.handle;

      const gridPos = pixelToGrid(mouseXInGridContent, mouseYInGridContent);
      const startGridPos = pixelToGrid(resizeState.startX, resizeState.startY);

      const dxInGridUnits = gridPos.x - startGridPos.x;
      const dyInGridUnits = gridPos.y - startGridPos.y;

      if (handle.includes('e')) w = Math.max(MIN_SIZE, Math.min(MAX_SIZE, resizeState.originalItem.w + dxInGridUnits));
      if (handle.includes('w')) {
        const newW = Math.max(MIN_SIZE, Math.min(MAX_SIZE, resizeState.originalItem.w - dxInGridUnits));
        x = resizeState.originalItem.x + (resizeState.originalItem.w - newW);
        w = newW;
      }
      if (handle.includes('s')) h = Math.max(MIN_SIZE, Math.min(MAX_SIZE, resizeState.originalItem.h + dyInGridUnits));
      if (handle.includes('n')) {
        const newH = Math.max(MIN_SIZE, Math.min(MAX_SIZE, resizeState.originalItem.h - dyInGridUnits));
        y = resizeState.originalItem.y + (resizeState.originalItem.h - newH);
        h = newH;
      }

      x = Math.max(0, x);
      y = Math.max(0, y);
      w = Math.min(w, gridDimensions.cols - x);
      h = Math.min(h, gridDimensions.rows - y);

      setPreview({ ...preview, x, y, w, h });
    }
  }, [dragState, preview, gridDimensions.cols, gridDimensions.rows, pixelToGrid, resizeState]);

  const handleMouseUp = useCallback(() => {
    if ((dragState || resizeState) && preview) {
      const finalX = Math.max(0, Math.min(preview.x, gridDimensions.cols - MIN_SIZE));
      const finalY = Math.max(0, Math.min(preview.y, gridDimensions.rows - MIN_SIZE));
      const finalW = Math.max(MIN_SIZE, Math.min(preview.w, gridDimensions.cols - finalX));
      const finalH = Math.max(MIN_SIZE, Math.min(preview.h, gridDimensions.rows - finalY));

      const finalPreview = {
        ...preview,
        x: finalX, y: finalY, w: finalW, h: finalH,
      };

      const updatedItems = items.map((item: GridItem) => {
        if (item.id === (dragState?.id || resizeState?.id)) {
          return {
            ...item,
            ...finalPreview,
            originalX: finalPreview.x,
            originalY: finalPreview.y,
            originalW: finalPreview.w,
            originalH: finalPreview.h,
            isAnimating: true,
          } as GridItem;
        }
        return item;
      });

      setItems(detectAndFixOverlaps(updatedItems as GridItem[], true) as any);
    }

    setDragState(null);
    setResizeState(null);
    setPreview(null);
  }, [dragState, resizeState, preview, items, gridDimensions.cols, gridDimensions.rows, detectAndFixOverlaps, setItems]);

  useEffect(() => {
    if (dragState || resizeState) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState, resizeState, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(calculateDimensions, DEBOUNCE_DELAY);
    });
    if (containerRef.current) {
      observer.observe(containerRef.current);
      calculateDimensions();
    }
    return () => {
      observer.disconnect();
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [calculateDimensions]);

  const toggleEditMode = () => {
    if (!enableEditMode) return;
    const newEditMode = !isEditMode;
    setIsEditMode(newEditMode);
    setIsAddWidgetMode(false);
    setDragState(null); setResizeState(null); setPreview(null);
    onEditModeChange?.(newEditMode);
  };

  const toggleAddWidgetMode = () => {
    if (!isEditMode) return;
    const newAddWidgetMode = !isAddWidgetMode;
    setIsAddWidgetMode(newAddWidgetMode);
    onAddWidgetModeChange?.(newAddWidgetMode);
  };

  const toggleFixedHeight = () => {
    const newMaxHeight = maxHeight === null ? MIN_CONTAINER_HEIGHT * 1.5 : null;
    setMaxHeight(newMaxHeight);
    onFixedHeightChange?.(newMaxHeight !== null);
  };

  const addWidgetAtPosition = (widgetConfig: WidgetType) => {
    if (!isEditMode) return;

    const tempItemForPositioning: GridItem = {
      id: 'temp',
      x: 0, y: 0,
      w: widgetConfig.defaultSize.w, h: widgetConfig.defaultSize.h,
      type: widgetConfig.type, title: widgetConfig.title,
    };

    const safePosData = findSafePosition(tempItemForPositioning, items, true);

    const newItem: GridItem = {
      id: nextId.toString(),
      x: safePosData.x, y: safePosData.y,
      w: safePosData.w, h: safePosData.h,
      type: widgetConfig.type, title: widgetConfig.title,
      content: () => renderWidgetContent({ id: nextId.toString(), type: widgetConfig.type, title: widgetConfig.title } as GridItem),
      originalX: safePosData.x, originalY: safePosData.y,
      originalW: safePosData.w, originalH: safePosData.h,
      onMenuClick: widgetConfig.onMenuClick,
      menuIcon: widgetConfig.menuIcon,
      isAnimating: true,
    };

    const newItems = [...items, newItem];
    setItems(detectAndFixOverlaps(newItems, true) as any);
    setNextId(prevId => prevId + 1);

    setTimeout(() => {
      setItems((prev: GridItem[]) => prev.map((it: GridItem) => ({ ...it, isAnimating: false })) as any);
    }, ANIMATION_DURATION);
  };

  const removeItem = (id: string) => {
    if (!isEditMode) return;
    setItems(items.filter(item => item.id !== id) as any);
  };

  const autoOrganize = () => {
    if (!isEditMode) return;

    const sorted = [...items].sort((a, b) => {
      const aArea = (a.originalW ?? a.w) * (a.originalH ?? a.h);
      const bArea = (b.originalW ?? b.w) * (b.originalH ?? b.h);

      // Secondary sort: top-to-bottom, left-to-right (visual order)
      const aY = a.originalY ?? a.y;
      const bY = b.originalY ?? b.y;
      const aX = a.originalX ?? a.x;
      const bX = b.originalX ?? b.x;

      return bArea - aArea || aY - bY || aX - bX || parseInt(a.id) - parseInt(b.id);
    });

    const organized: GridItem[] = [];

    for (const item of sorted) {
      const targetW = Math.min(item.originalW ?? item.w, gridDimensions.cols);
      const targetH = item.originalH ?? item.h;

      const itemToPlace: GridItem = {
        ...item,
        x: 0,
        y: 0,
        originalX: undefined,
        originalY: undefined,
        w: Math.max(MIN_SIZE, targetW),
        h: Math.max(MIN_SIZE, targetH),
        isAnimating: true,
      };

      const safePositionData = findSafePosition(itemToPlace, organized, true);
      const organizedItem: GridItem = {
        ...item,
        x: safePositionData.x,
        y: safePositionData.y,
        w: safePositionData.w,
        h: safePositionData.h,
        originalX: safePositionData.x,
        originalY: safePositionData.y,
        originalW: safePositionData.w,
        originalH: safePositionData.h,
        isAnimating: true,
      } as GridItem;
      organized.push(organizedItem);
    }

    setItems(organized as any);
    setTimeout(() => {
      setItems((prev: GridItem[]) => prev.map((item: GridItem) => ({ ...item, isAnimating: false })) as any);
    }, ANIMATION_DURATION);
  };

  const renderItem = (item: GridItem, isPreview = false) => {
    const pos = gridToPixel(item.x, item.y);
    const itemWidth = Math.max(0, item.w);
    const itemHeight = Math.max(0, item.h);

    const size = {
      width: itemWidth * GRID_SIZE + (itemWidth > 0 ? (itemWidth - 1) * MARGIN : 0),
      height: itemHeight * GRID_SIZE + (itemHeight > 0 ? (itemHeight - 1) * MARGIN : 0)
    };
    const isActive = dragState?.id === item.id || resizeState?.id === item.id;

    const handleMouseDownOnWidget = (e: any) => {
      if (!isEditMode || isPreview) return;

      const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = clientX - rect.left;
      const mouseY = clientY - rect.top;

      const cornerSize = 20;
      const isInTopLeft = mouseX <= cornerSize && mouseY <= cornerSize;
      const isInTopRight = mouseX >= rect.width - cornerSize && mouseY <= cornerSize;
      const isInBottomLeft = mouseX <= cornerSize && mouseY >= rect.height - cornerSize;
      const isInBottomRight = mouseX >= rect.width - cornerSize && mouseY >= rect.height - cornerSize;

      if (isInTopLeft || isInTopRight || isInBottomLeft || isInBottomRight) {
        let handle = '';
        if (isInTopLeft) handle = 'nw';
        else if (isInTopRight) handle = 'ne';
        else if (isInBottomLeft) handle = 'sw';
        else if (isInBottomRight) handle = 'se';

        const gridContentRect = containerRef.current?.getBoundingClientRect();
        if (!gridContentRect) return;

        setResizeState({
          id: item.id,
          startX: clientX - gridContentRect.left - CONTAINER_PADDING,
          startY: clientY - gridContentRect.top - CONTAINER_PADDING,
          originalItem: { ...item },
          handle
        });
        setPreview({ ...item });
      } else {
        const gridContentRect = containerRef.current?.getBoundingClientRect();
        if (!gridContentRect) return;

        const mouseXInGridContent = clientX - gridContentRect.left - CONTAINER_PADDING;
        const mouseYInGridContent = clientY - gridContentRect.top - CONTAINER_PADDING;
        const itemPixelPos = gridToPixel(item.x, item.y);

        setDragState({
          id: item.id,
          startX: mouseXInGridContent - itemPixelPos.x,
          startY: mouseYInGridContent - itemPixelPos.y,
          originalItem: { ...item }
        });
        setPreview({ ...item });
      }
    };

    return (
      <div
        key={`${isPreview ? 'preview-' : ''}${item.id}`}
        className={cn(
          "group absolute rounded-2xl border transition-all duration-300",
          isPreview
            ? "bg-blue-100/50 border-blue-400 border-2 opacity-80 z-50 shadow-blue-500/20 shadow-xl"
            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-md hover:shadow-xl z-10",
          isActive && !isPreview && "opacity-40 scale-[0.98] select-none",
          isEditMode && !isPreview ? "cursor-grab active:cursor-grabbing" : "cursor-default",
          item.isAnimating && "transition-all"
        )}
        style={{ left: pos.x, top: pos.y, width: size.width, height: size.height }}
        onMouseDown={handleMouseDownOnWidget}
        onTouchStart={handleMouseDownOnWidget}
      >
        {!isPreview && isEditMode && (
          <>
            <div className="absolute top-0 left-0 w-6 h-6 cursor-nw-resize z-20" />
            <div className="absolute top-0 right-0 w-6 h-6 cursor-ne-resize z-20" />
            <div className="absolute bottom-0 left-0 w-6 h-6 cursor-sw-resize z-20" />
            <div className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize z-20" />
          </>
        )}

        <div
          className={cn(
            "flex items-center justify-between px-4 py-3 text-sm font-semibold select-none border-b",
            isPreview ? "border-blue-200" : "border-gray-100 dark:border-gray-700"
          )}
        >
          <span className={cn(
            "truncate",
            isPreview ? "text-blue-700" : "text-gray-800 dark:text-gray-100"
          )}>
            {item.title}
          </span>
          {!isPreview && isEditMode && (
            <div className="flex items-center gap-1">
              {item.onMenuClick && (
                <button
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    item.onMenuClick?.(e as any);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {item.menuIcon || <MoreHorizontal size={16} />}
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                onMouseDown={(e) => e.stopPropagation()}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
        <div className="p-4 h-[calc(100%-52px)] overflow-auto">
          {item.content ? item.content() : null}
        </div>
      </div>
    );
  };

  const dashboardActions: DashboardActions = {
    toggleEditMode,
    toggleAddWidgetMode,
    autoOrganize,
    toggleFixedHeight,
    addWidget: addWidgetAtPosition,
    removeItem,
  };

  const dashboardState: DashboardState = {
    isEditMode,
    isAddWidgetMode,
    isFixedHeight: maxHeight !== null,
    gridDimensions,
    itemCount: items.length,
    items,
  };

  const customToolbarProps: CustomToolbarProps = {
    state: dashboardState,
    actions: dashboardActions,
    availableWidgetTypes,
  };

  const renderGrid = () => {
    if (internalGridMode === 'blank') return null;

    const baseStyle: React.CSSProperties = {
      top: CONTAINER_PADDING, left: CONTAINER_PADDING,
      right: CONTAINER_PADDING, bottom: CONTAINER_PADDING,
      backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
    };

    if (internalGridMode === 'dots') {
      return (
        <div
          className="absolute pointer-events-none opacity-20 dark:opacity-20"
          style={{
            ...baseStyle,
            backgroundImage: `radial-gradient(circle at center, #94A3B8 1.5px, transparent 1.5px)`,
            backgroundPosition: `${CELL_SIZE / 2}px ${CELL_SIZE / 2}px`,
          }}
        />
      );
    }

    return (
      <div
        className={cn(
          "absolute pointer-events-none opacity-[0.03] dark:opacity-[0.05]",
          internalGridMode === 'harsh' ? "opacity-[0.08]" : ""
        )}
        style={{
          ...baseStyle,
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
        }}
      />
    );
  };

  return (
    <div className={cn("flex flex-col gap-6 p-6 bg-[#F4F7FA] dark:bg-[#0F172A] min-h-screen", className)}>
      {showDefaultToolbar && !customToolbar && (
        <DashboardToolbar
          isEditMode={isEditMode}
          onToggleMode={toggleEditMode}
          onAutoOrganize={autoOrganize}
          onToggleFixedHeight={toggleFixedHeight}
          isFixedHeight={maxHeight !== null}
          gridDimensions={gridDimensions}
          itemCount={items.length}
          isAddWidgetMode={isAddWidgetMode}
          onToggleAddWidgetMode={toggleAddWidgetMode}
          onAddWidget={addWidgetAtPosition}
          availableWidgetTypes={availableWidgetTypes}
          gridMode={internalGridMode}
          onGridModeChange={setInternalGridMode}
        />
      )}

      {customToolbar && (
        <div className={toolbarClassName}>
          {customToolbar(customToolbarProps)}
        </div>
      )}

      <div className="w-full flex-1">
        <div
          ref={containerRef}
          className={cn(
            "relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-[32px] w-full transition-all duration-500",
            maxHeight ? "overflow-auto" : "overflow-hidden",
            isEditMode && "ring-4 ring-blue-500/5 border-blue-200 dark:border-blue-900",
            (dragState || resizeState) && "select-none"
          )}
          style={{ height: gridDimensions.height, minHeight: MIN_CONTAINER_HEIGHT, padding: CONTAINER_PADDING }}
        >
          {renderGrid()}
          <div
            className="relative w-full"
            style={{ height: Math.max(0, gridDimensions.rows * CELL_SIZE - MARGIN), minHeight: `calc(100% - ${CONTAINER_PADDING * 2}px)` }}
          >
            {items.map(item => renderItem(item))}
            {preview && renderItem(preview, true)}

            {items.length === 0 && !isAddWidgetMode && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-50 dark:bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-gray-700">
                    <Plus size={32} className="text-blue-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Empty Dashboard</h3>
                  <p className="text-sm">{isEditMode ? 'Click "Add Widget" to get started' : 'No widgets to display'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

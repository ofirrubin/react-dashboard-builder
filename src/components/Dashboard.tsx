"use client";
import * as React from 'react';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Plus, X, MoreHorizontal } from 'lucide-react';
import { DashboardToolbar } from './DashboardToolbar';
import { getWidgetComponent } from './widgets';
import { useDashboardController } from '../lib/useDashboardController';
import { GridItem, DragState, ResizeState, DashboardProps, WidgetType, DashboardActions, DashboardState, CustomToolbarProps } from '../types/index';
import { GRID_SIZE, MARGIN, CELL_SIZE, ANIMATION_DURATION, MIN_SIZE, MAX_SIZE, CONTAINER_PADDING, MIN_CONTAINER_HEIGHT, DEBOUNCE_DELAY } from '../constants';


const createWidgetRenderer = (widgetRegistry?: Record<string, any>) => (item: GridItem) => {
  let WidgetComponent: any;

  if (widgetRegistry && widgetRegistry[item.type]) {
    WidgetComponent = widgetRegistry[item.type];
  } else {
    WidgetComponent = getWidgetComponent(item.type);
  }

  // Pass all necessary props for rendering, matching GridItem structure if needed by actual widget
  return <WidgetComponent id={item.id} title={item.title} type={item.type} />;
};

export default function Dashboard({
  availableWidgetTypes = [],
  initialItems = [],
  widgetRegistry,
  onItemsChange,
  className = "",
  enableEditMode = true,
  defaultEditMode = true,

  // Grid appearance
  gridMode = 'elegant',

  // Toolbar customization options
  showDefaultToolbar = true,
  customToolbar,
  toolbarClassName = "",

  // Exposed action callbacks
  onEditModeChange,
  onAddWidgetModeChange,
  onFixedHeightChange,
  controller: externalController,
}: DashboardProps) {
  const renderWidgetContent = useMemo(() => createWidgetRenderer(widgetRegistry), [widgetRegistry]);

  // Transform initial items to include the content function
  const transformInitialItems = useCallback((items: Omit<GridItem, 'content'>[]): GridItem[] => {
    return items.map(item => ({
      ...item,
      content: () => renderWidgetContent(item as GridItem)
    }));
  }, [renderWidgetContent]);

  // Initialize controller
  const internalController = useDashboardController({
    initialItems: transformInitialItems(initialItems),
    initialEditMode: enableEditMode ? defaultEditMode : false
  });

  const controller = externalController || internalController;

  // Ensure items have content renderers (in case they came from external controller without them)
  const items = useMemo(() => {
    return controller.items.map(item => {
      // If content is missing or if we want to ensure we use the latest registry
      if (!item.content) {
        return { ...item, content: () => renderWidgetContent(item) };
      }
      return item;
    });
  }, [controller.items, renderWidgetContent]);

  const setItems = controller.setItems;
  const isEditMode = controller.isEditMode;
  const setIsEditMode = controller.setEditMode;


  // Calculate nextId based on existing items
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
  // isEditMode managed by controller
  const [isAddWidgetMode, setIsAddWidgetMode] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<number | null>(null);
  const isInitialLoad = useRef(true);

  // Trigger callback when items change (but not on initial load)
  useEffect(() => {
    if (onItemsChange && !isInitialLoad.current) {
      // Convert items to the format expected by the callback (without content function)
      const itemsForCallback = items.map(({ content, ...item }) => item);
      onItemsChange(itemsForCallback);
    }
    isInitialLoad.current = false;
  }, [items, onItemsChange]);

  // Update items when initialItems prop changes
  useEffect(() => {
    // If external controller is provided, we should NOT sync with initialItems prop
    // as the controller is the source of truth.
    if (externalController) return;

    // Only update if the initialItems prop actually changed (not when internal items change)
    // We check if there are items in initialItems that aren't in current items
    const hasNewItems = initialItems.some(initItem => !items.find(item => item.id === initItem.id));
    const hasMissingItems = items.some(item => !initialItems.find(initItem => initItem.id === item.id) && initialItems.length > 0);

    if (hasNewItems || (hasMissingItems && items.length < initialItems.length)) {
      const transformedItems = transformInitialItems(initialItems);
      setItems(transformedItems);
      isInitialLoad.current = true; // Prevent triggering onItemsChange for this update
    }
  }, [initialItems, transformInitialItems, externalController]);

  const itemsOverlap = (a: GridItem, b: GridItem) =>
    !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);

  const isValidPosition = (item: GridItem, allItems: GridItem[], excludeId?: string) => {
    if (item.w < MIN_SIZE || item.h < MIN_SIZE) return false; // Check min size
    if (item.x < 0 || item.y < 0 ||
      item.x + item.w > gridDimensions.cols ||
      item.y + item.h > gridDimensions.rows) {
      return false;
    }
    return !allItems.some(other => {
      if (other.id === item.id || other.id === excludeId) return false;
      return itemsOverlap(item, other);
    });
  };

  // Function overloads for pixelToGrid to ensure proper typing
  function pixelToGrid(px: number, py: number, forCoord: 'x'): number;
  function pixelToGrid(px: number, py: number, forCoord: 'y'): number;
  function pixelToGrid(px: number, py: number, forCoord?: 'generic'): { x: number; y: number };
  function pixelToGrid(px: number, py: number, forCoord: 'x' | 'y' | 'generic' = 'generic'): number | { x: number; y: number } {
    // This simplified pixelToGrid assumes coords are relative to the grid content area already
    if (forCoord === 'x') return Math.round(px / CELL_SIZE);
    if (forCoord === 'y') return Math.round(py / CELL_SIZE);
    return { // Fallback to old logic if used generically, but prefer specific coord.
      x: Math.round((px - CONTAINER_PADDING) / CELL_SIZE),
      y: Math.round((py - CONTAINER_PADDING) / CELL_SIZE)
    }
  }

  const gridToPixel = (x: number, y: number) => ({
    x: x * CELL_SIZE,
    y: y * CELL_SIZE
  });

  const findSafePosition = (item: GridItem, existingItems: GridItem[], preferCurrentOverStoredOriginal = false): { x: number; y: number; w: number; h: number; isAnimating: boolean } => {
    let currentW = Math.min(item.w, gridDimensions.cols);
    let currentH = item.h;

    let startX = item.x;
    let startY = item.y;

    if (item.originalX !== undefined && item.originalY !== undefined && !preferCurrentOverStoredOriginal) {
      startX = item.originalX;
      startY = item.originalY;
      if (item.originalW !== undefined) currentW = Math.min(item.originalW, gridDimensions.cols);
      if (item.originalH !== undefined) currentH = item.originalH;
    }

    startX = Math.min(startX, gridDimensions.cols - currentW);

    const testItemInitial = { ...item, x: startX, y: startY, w: currentW, h: currentH };
    if (isValidPosition(testItemInitial, existingItems)) {
      return { ...testItemInitial, isAnimating: true };
    }

    // For new widgets (starting at 0,0), use left-to-right, top-to-bottom scan first
    if (startX === 0 && startY === 0 && existingItems.length > 0) {
      // Find the maximum Y position to start searching from
      const maxY = Math.max(...existingItems.map(it => it.y + it.h), 0);

      // Search row by row, left to right
      for (let y = 0; y <= Math.max(maxY, gridDimensions.rows - currentH); y++) {
        for (let x = 0; x <= gridDimensions.cols - currentW; x++) {
          const candidateItem = { ...item, x, y, w: currentW, h: currentH };
          if (isValidPosition(candidateItem, existingItems)) {
            return { ...candidateItem, isAnimating: true };
          }
        }
      }
    }

    // Spiral search from the starting position (for repositioning existing items)
    const maxSearchDistance = Math.max(gridDimensions.cols, gridDimensions.rows);
    for (let distance = 1; distance <= maxSearchDistance; distance++) {
      for (let dy = -distance; dy <= distance; dy++) {
        for (let dx = -distance; dx <= distance; dx++) {
          if (Math.abs(dx) !== distance && Math.abs(dy) !== distance) continue;

          const testX = startX + dx;
          const testY = startY + dy;

          if (testX < 0 || testX + currentW > gridDimensions.cols ||
            testY < 0 || testY + currentH > gridDimensions.rows) continue;

          const candidateItem = { ...item, x: testX, y: testY, w: currentW, h: currentH };
          if (isValidPosition(candidateItem, existingItems)) {
            return { ...candidateItem, isAnimating: true };
          }
        }
      }
    }

    // Final fallback: scan entire grid
    for (let y = 0; y <= gridDimensions.rows - currentH; y++) {
      for (let x = 0; x <= gridDimensions.cols - currentW; x++) {
        const candidateItem = { ...item, x, y, w: currentW, h: currentH };
        if (isValidPosition(candidateItem, existingItems)) {
          return { ...candidateItem, isAnimating: true };
        }
      }
    }

    const finalW = Math.min(currentW, gridDimensions.cols);
    const finalH = Math.min(currentH, gridDimensions.rows);
    return { ...item, x: 0, y: 0, w: finalW, h: finalH, isAnimating: true };
  };

  const detectAndFixOverlaps = (currentItems: GridItem[], tryReAnchorToOriginals = false): GridItem[] => {
    const result = currentItems.map(i => ({ ...i }));
    let hasOverlaps = true;
    let attempts = 0;
    const maxAttempts = Math.max(20, result.length * 2);

    while (hasOverlaps && attempts < maxAttempts) {
      hasOverlaps = false;
      attempts++;

      result.sort((a, b) => (a.y - b.y) || (a.x - b.x));

      for (let i = 0; i < result.length; i++) {
        for (let j = i + 1; j < result.length; j++) {
          if (itemsOverlap(result[i], result[j])) {
            hasOverlaps = true;

            const itemToMoveIndex = (result[j].y > result[i].y || (result[j].y === result[i].y && result[j].x > result[i].x)) ? j : i;

            const itemToMove = result[itemToMoveIndex];
            const fixedItems = result.filter((_, idx) => idx !== itemToMoveIndex);

            const newPositionData = findSafePosition(itemToMove, fixedItems, !tryReAnchorToOriginals);

            result[itemToMoveIndex] = {
              ...itemToMove,
              x: newPositionData.x,
              y: newPositionData.y,
              w: newPositionData.w,
              h: newPositionData.h,
              isAnimating: newPositionData.isAnimating,
            };
          }
        }
      }
    }
    return result;
  };

  const calculateDimensions = useCallback(() => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const availableWidth = rect.width - CONTAINER_PADDING * 2;
    const newCols = Math.max(MIN_SIZE, Math.floor((availableWidth + MARGIN) / CELL_SIZE)); // Ensure at least MIN_SIZE cols

    // Calculate maxY based on current items, ensuring items are within newCols
    const tempClampedItems = items.map(it => ({
      ...it,
      w: Math.min(it.originalW !== undefined ? it.originalW : it.w, newCols) // Use originalW if available
    }));
    const maxY = tempClampedItems.length > 0 ? Math.max(...tempClampedItems.map(item => item.y + item.h), 0) : MIN_SIZE; // Min rows if empty

    const minRowsForMinHeight = Math.ceil((MIN_CONTAINER_HEIGHT - (CONTAINER_PADDING * 2) + MARGIN) / CELL_SIZE);
    const requiredRows = Math.max(minRowsForMinHeight, maxY + 4); // +4 buffer

    const newHeight = maxHeight || Math.max(MIN_CONTAINER_HEIGHT,
      requiredRows * CELL_SIZE - MARGIN + CONTAINER_PADDING * 2);

    const oldCols = gridDimensions.cols;
    const oldRows = gridDimensions.rows;

    setGridDimensions({
      width: rect.width, // Updated to use full container width
      height: newHeight,
      cols: newCols,
      rows: requiredRows
    });

    // Trigger reflow if cols changed OR if rows significantly increased (might mean items need to spread)
    if ((newCols !== oldCols || requiredRows > oldRows + 2) && newCols > 0 && items.length > 0) {
      reflowItems(newCols, requiredRows);
    }
  }, [items, maxHeight, gridDimensions.cols, gridDimensions.rows]);


  const reflowItems = (newCols: number, newRows: number) => {
    const processedItems: GridItem[] = [];

    // Create a local isValidPosition function that uses the new dimensions
    const isValidPositionForNewGrid = (item: GridItem, allItems: GridItem[], excludeId?: string) => {
      if (item.w < MIN_SIZE || item.h < MIN_SIZE) return false;
      if (item.x < 0 || item.y < 0 ||
        item.x + item.w > newCols ||
        item.y + item.h > newRows) {
        return false;
      }
      return !allItems.some(other => {
        if (other.id === item.id || other.id === excludeId) return false;
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

    const itemsToProcess = sortedItems.map(item => {
      const targetW = item.originalW !== undefined ? Math.min(item.originalW, newCols) : Math.min(item.w, newCols);
      const targetH = item.originalH !== undefined ? item.originalH : item.h; // Heights usually less dependent on cols
      return {
        ...item,
        w: Math.max(MIN_SIZE, targetW), // Ensure min width
        h: Math.max(MIN_SIZE, targetH), // Ensure min height
        isAnimating: true,
      };
    });

    if (newCols > gridDimensions.cols) { // Expanding
      const restored: GridItem[] = [];
      const needsRepositioning: GridItem[] = [];

      for (const item of itemsToProcess) {
        if (item.originalX !== undefined && item.originalY !== undefined) {
          const restoredItem = {
            ...item, // Contains already adjusted w/h
            x: item.originalX,
            y: item.originalY,
          };
          // Check if original position is valid and doesn't conflict with already restored items
          if (restoredItem.x + restoredItem.w <= newCols &&
            restoredItem.y + restoredItem.h <= newRows &&
            isValidPositionForNewGrid(restoredItem, restored)) {
            restored.push(restoredItem);
          } else {
            needsRepositioning.push(item); // item already has target w/h
          }
        } else {
          needsRepositioning.push(item);
        }
      }

      for (const item of needsRepositioning) {
        // preferCurrentOverStoredOriginal = false (use originalX/Y as base)
        const safePosData = findSafePositionForNewGrid(item, restored, false, newCols, newRows);
        restored.push({
          ...item, // Contains item's target w/h
          x: safePosData.x,
          y: safePosData.y,
          w: safePosData.w, // Use width from findSafePosition
          h: safePosData.h, // Use height from findSafePosition
          // originalX/Y/W/H are preserved from item
        });
      }
      setItems(detectAndFixOverlaps(restored, true));
    } else { // Shrinking or same size
      for (const item of itemsToProcess) {
        let targetX = item.x;
        // If shrinking, ensure x is valid for new width. Max(0, newCols - item.w) is key.
        if (newCols < gridDimensions.cols) {
          targetX = Math.min(item.x, Math.max(0, newCols - item.w));
        }
        const itemForSafePos = { ...item, x: targetX }; // item already has target w/h
        // preferCurrentOverStoredOriginal = true (use current/adjusted x/y as base)
        const safePosData = findSafePositionForNewGrid(itemForSafePos, processedItems, true, newCols, newRows);
        processedItems.push({
          ...item, // Contains item's target w/h
          x: safePosData.x,
          y: safePosData.y,
          w: safePosData.w,
          h: safePosData.h,
        });
      }
      setItems(detectAndFixOverlaps(processedItems, true));
    }
    setTimeout(() => setItems((prev: GridItem[]) => prev.map(it => ({ ...it, isAnimating: false }))), ANIMATION_DURATION);
  };

  // Helper function for findSafePosition that works with new grid dimensions
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

    // Check if initial position is valid using new grid dimensions
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

    if (isValidForNewGrid(testItemInitial)) {
      return { ...testItemInitial, isAnimating: true };
    }

    const maxSearchDistance = Math.max(cols, rows);
    for (let distance = 1; distance <= maxSearchDistance; distance++) {
      for (let dy = -distance; dy <= distance; dy++) {
        for (let dx = -distance; dx <= distance; dx++) {
          if (Math.abs(dx) !== distance && Math.abs(dy) !== distance) continue;

          const testX = startX + dx;
          const testY = startY + dy;

          if (testX < 0 || testX + currentW > cols ||
            testY < 0 || testY + currentH > rows) continue;

          const candidateItem = { ...item, x: testX, y: testY, w: currentW, h: currentH };
          if (isValidForNewGrid(candidateItem)) {
            return { ...candidateItem, isAnimating: true };
          }
        }
      }
    }

    for (let y = 0; y <= rows - currentH; y++) {
      for (let x = 0; x <= cols - currentW; x++) {
        const candidateItem = { ...item, x, y, w: currentW, h: currentH };
        if (isValidForNewGrid(candidateItem)) {
          return { ...candidateItem, isAnimating: true };
        }
      }
    }

    const finalW = Math.min(currentW, cols);
    const finalH = Math.min(currentH, rows);
    return { ...item, x: 0, y: 0, w: finalW, h: finalH, isAnimating: true };
  };
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const gridContentRect = containerRef.current?.getBoundingClientRect();
    if (!gridContentRect) return;

    const mouseXInGridContent = e.clientX - gridContentRect.left - CONTAINER_PADDING;
    const mouseYInGridContent = e.clientY - gridContentRect.top - CONTAINER_PADDING;

    if (dragState && preview) {
      const itemX = mouseXInGridContent - dragState.startX;
      const itemY = mouseYInGridContent - dragState.startY;

      // FIX: Convert pixel coordinates to grid coordinates properly
      const gridPos = {
        x: pixelToGrid(itemX, 0, 'x'),      // Only X coordinate matters for X grid position
        y: pixelToGrid(0, itemY, 'y')       // Only Y coordinate matters for Y grid position
      };

      let newX = Math.max(0, Math.min(gridDimensions.cols - preview.w, gridPos.x));
      let newY = Math.max(0, Math.min(gridDimensions.rows - preview.h, gridPos.y));

      setPreview({ ...preview, x: newX, y: newY });
    }

    if (resizeState && preview) {
      let { x, y, w, h } = resizeState.originalItem;
      const handle = resizeState.handle;

      // FIX: Calculate delta in grid units properly for resize
      const dxInGridUnits = pixelToGrid(mouseXInGridContent - resizeState.startX, 0, 'x');
      const dyInGridUnits = pixelToGrid(0, mouseYInGridContent - resizeState.startY, 'y');

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
      w = Math.max(MIN_SIZE, w);
      h = Math.max(MIN_SIZE, h);

      setPreview({ ...preview, x, y, w, h });
    }
  }, [dragState, resizeState, preview, gridDimensions.cols, gridDimensions.rows]);

  const handleMouseUp = useCallback(() => {
    if ((dragState || resizeState) && preview) {
      // const activeId = dragState?.id || resizeState?.id || '';
      // const actionType = dragState ? 'drag' : 'resize';

      // Clamp final preview values to be safe
      const finalX = Math.max(0, Math.min(preview.x, gridDimensions.cols - MIN_SIZE));
      const finalY = Math.max(0, Math.min(preview.y, gridDimensions.rows - MIN_SIZE));
      const finalW = Math.max(MIN_SIZE, Math.min(preview.w, gridDimensions.cols - finalX));
      const finalH = Math.max(MIN_SIZE, Math.min(preview.h, gridDimensions.rows - finalY));

      const finalPreview = {
        ...preview,
        x: finalX, y: finalY, w: finalW, h: finalH,
      };

      const updatedItems = items.map(item => {
        if (item.id === (dragState?.id || resizeState?.id)) {
          return {
            ...finalPreview,
            originalX: finalPreview.x,
            originalY: finalPreview.y,
            originalW: finalPreview.w,
            originalH: finalPreview.h,
            isAnimating: true,
          };
        }
        return item;
      });

      setItems(updatedItems);
      setItems((prev: GridItem[]) => detectAndFixOverlaps(prev.map((it: GridItem) => ({ ...it, isAnimating: false })), true));
    }

    setDragState(null);
    setResizeState(null);
    setPreview(null);
  }, [dragState, resizeState, preview, items, gridDimensions.cols, gridDimensions.rows]);

  useEffect(() => {
    if (dragState || resizeState) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState, resizeState, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(calculateDimensions, DEBOUNCE_DELAY) as unknown as number;
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
    if (!enableEditMode) return; // Don't allow toggling if edit mode is disabled
    const newEditMode = !isEditMode;
    setIsEditMode(newEditMode);
    setIsAddWidgetMode(false);
    setDragState(null); setResizeState(null); setPreview(null);

    // Call the callback if provided
    onEditModeChange?.(newEditMode);
  };

  const toggleAddWidgetMode = () => {
    if (!isEditMode) return;
    const newAddWidgetMode = !isAddWidgetMode;
    setIsAddWidgetMode(newAddWidgetMode);

    // Call the callback if provided
    onAddWidgetModeChange?.(newAddWidgetMode);
  };

  const toggleFixedHeight = () => {
    const newMaxHeight = maxHeight === null ? MIN_CONTAINER_HEIGHT * 1.5 : null;
    setMaxHeight(newMaxHeight);

    // Call the callback if provided
    onFixedHeightChange?.(newMaxHeight !== null);
  };

  const addWidgetAtPosition = (widgetConfig: WidgetType, x?: number, y?: number) => {
    if (!isEditMode) return;

    const tempItemForPositioning: GridItem = {
      id: 'temp',
      x: x ?? 0, y: y ?? 0,
      w: widgetConfig.defaultSize.w, h: widgetConfig.defaultSize.h,
      type: widgetConfig.type, title: widgetConfig.title, content: () => null,
      originalX: x ?? 0, originalY: y ?? 0,
      originalW: widgetConfig.defaultSize.w, originalH: widgetConfig.defaultSize.h,
    };

    const safePosData = findSafePosition(tempItemForPositioning, items, false);

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
    if (isValidPosition(newItem, items)) {
      const newItems = [...items, newItem];
      const itemsWithOverlapsFixed = detectAndFixOverlaps(newItems, true);
      setItems(itemsWithOverlapsFixed);
      setNextId(prevId => prevId + 1);

      // Remove animation after a delay
      setTimeout(() => {
        setItems((prev: GridItem[]) => prev.map((it: GridItem) => ({ ...it, isAnimating: false })));
      }, ANIMATION_DURATION);
    } else {
      const fallbackItem = { ...newItem, x: 0, y: 0, originalX: 0, originalY: 0 };
      const newItems = [...items, fallbackItem];
      const itemsWithOverlapsFixed = detectAndFixOverlaps(newItems, true);
      setItems(itemsWithOverlapsFixed);
      setNextId(prevId => prevId + 1);

      // Remove animation after a delay
      setTimeout(() => {
        setItems((prev: GridItem[]) => prev.map((it: GridItem) => ({ ...it, isAnimating: false })));
      }, ANIMATION_DURATION);
    }
  };

  const removeItem = (id: string) => {
    if (!isEditMode) return;
    setItems(items.filter(item => item.id !== id));
  };

  const autoOrganize = () => {
    if (!isEditMode) return;

    // Sort by area (largest first) then by ID for consistent ordering
    const sorted = [...items].sort((a, b) => {
      const aArea = (a.originalW ?? a.w) * (a.originalH ?? a.h);
      const bArea = (b.originalW ?? b.w) * (b.originalH ?? b.h);
      return bArea - aArea || parseInt(a.id) - parseInt(b.id);
    });

    const organized: GridItem[] = [];

    // Process each item to find the best position
    for (const item of sorted) {
      // Use original dimensions if available, but clamp to current grid
      const targetW = Math.min(
        item.originalW ?? item.w,
        gridDimensions.cols
      );
      const targetH = item.originalH ?? item.h;

      // Create a temporary item for position finding
      const itemToPlace: GridItem = {
        ...item,
        w: Math.max(MIN_SIZE, targetW),
        h: Math.max(MIN_SIZE, targetH),
        isAnimating: true,
      };

      // Find the best position using a more systematic approach
      let bestPosition = null;
      let bestY = Infinity;
      let bestX = Infinity;

      // Try to place the item starting from top-left, scanning row by row
      for (let y = 0; y <= gridDimensions.rows - itemToPlace.h; y++) {
        for (let x = 0; x <= gridDimensions.cols - itemToPlace.w; x++) {
          const candidateItem = { ...itemToPlace, x, y };

          // Check if this position is valid (no overlaps with already placed items)
          const isValid = !organized.some(placedItem =>
            itemsOverlap(candidateItem, placedItem)
          );

          if (isValid) {
            // This position works - check if it's better than our current best
            if (y < bestY || (y === bestY && x < bestX)) {
              bestPosition = { x, y };
              bestY = y;
              bestX = x;
              break; // Found the leftmost position in this row
            }
          }
        }
        if (bestPosition && bestY === y) break; // Found position in this row
      }

      if (bestPosition) {
        // Use the best position we found
        const organizedItem: GridItem = {
          ...item,
          x: bestPosition.x,
          y: bestPosition.y,
          w: itemToPlace.w,
          h: itemToPlace.h,
          originalX: bestPosition.x,
          originalY: bestPosition.y,
          originalW: itemToPlace.w,
          originalH: itemToPlace.h,
          isAnimating: true,
        };
        organized.push(organizedItem);
      } else {
        // Fallback: use findSafePosition if no position found
        const safePositionData = findSafePosition(itemToPlace, organized, false);
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
        };
        organized.push(organizedItem);
      }
    }

    // Apply the organized layout
    setItems(organized);

    // Remove animation flag after animation completes
    setTimeout(() => {
      setItems(prev => prev.map(item => ({ ...item, isAnimating: false })));
    }, ANIMATION_DURATION);
  };


  const renderItem = (item: GridItem, isPreview = false) => {
    const pos = gridToPixel(item.x, item.y);
    // Ensure width/height are at least 0 to prevent style errors if item.w/h somehow become negative during processing
    const itemWidth = Math.max(0, item.w);
    const itemHeight = Math.max(0, item.h);

    const size = {
      width: itemWidth * GRID_SIZE + (itemWidth > 0 ? (itemWidth - 1) * MARGIN : 0),
      height: itemHeight * GRID_SIZE + (itemHeight > 0 ? (itemHeight - 1) * MARGIN : 0)
    };
    const isActive = dragState?.id === item.id || resizeState?.id === item.id;

    // Handle mouse down for both dragging and resizing
    const handleMouseDownOnWidget = (e: any) => {
      if (!isEditMode || isPreview) return;
      e.preventDefault();

      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Define corner areas (20px from each edge)
      const cornerSize = 20;
      const isInTopLeft = mouseX <= cornerSize && mouseY <= cornerSize;
      const isInTopRight = mouseX >= rect.width - cornerSize && mouseY <= cornerSize;
      const isInBottomLeft = mouseX <= cornerSize && mouseY >= rect.height - cornerSize;
      const isInBottomRight = mouseX >= rect.width - cornerSize && mouseY >= rect.height - cornerSize;

      if (isInTopLeft || isInTopRight || isInBottomLeft || isInBottomRight) {
        // Handle resize
        let handle = '';
        if (isInTopLeft) handle = 'nw';
        else if (isInTopRight) handle = 'ne';
        else if (isInBottomLeft) handle = 'sw';
        else if (isInBottomRight) handle = 'se';

        const gridContentRect = containerRef.current?.getBoundingClientRect();
        if (!gridContentRect) return;

        setResizeState({
          id: item.id,
          startX: e.clientX - gridContentRect.left - CONTAINER_PADDING,
          startY: e.clientY - gridContentRect.top - CONTAINER_PADDING,
          originalItem: { ...item },
          handle
        });
        setPreview({ ...item });
      } else {
        // Handle drag from header area
        const gridContentRect = containerRef.current?.getBoundingClientRect();
        if (!gridContentRect) return;

        // Calculate mouse position relative to grid content area
        const mouseXInGridContent = e.clientX - gridContentRect.left - CONTAINER_PADDING;
        const mouseYInGridContent = e.clientY - gridContentRect.top - CONTAINER_PADDING;

        // Calculate the item's current pixel position
        const itemPixelPos = gridToPixel(item.x, item.y);

        // Store the offset from mouse to item's top-left corner (both in grid content coordinates)
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
        className={`group absolute rounded-lg border ${item.isAnimating || isPreview ? 'transition-all duration-300' : ''} ${isPreview ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600 border-2 opacity-80 z-50' : `bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl dark:shadow-gray-900/50 z-10 ${isActive && !isPreview ? 'opacity-50' : ''}`} ${isEditMode && !isPreview ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
        style={{ left: pos.x, top: pos.y, width: size.width, height: size.height }}
        onMouseDown={handleMouseDownOnWidget}
      >
        {/* Corner resize areas - invisible but functional */}
        {!isPreview && isEditMode && (
          <>
            <div className="absolute top-0 left-0 w-5 h-5 cursor-nw-resize z-20" />
            <div className="absolute top-0 right-0 w-5 h-5 cursor-ne-resize z-20" />
            <div className="absolute bottom-0 left-0 w-5 h-5 cursor-sw-resize z-20" />
            <div className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize z-20" />
          </>
        )}

        <div
          className={`flex items-center justify-between p-2 text-xs border-b select-none ${isPreview ? 'bg-blue-50 dark:bg-blue-900/50 border-blue-200 dark:border-blue-700' : 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-700 border-gray-200 dark:border-gray-700 hover:from-blue-100 hover:to-purple-100 dark:hover:from-gray-600 dark:hover:to-gray-600'}`}
        >
          <span className={`font-medium truncate ${isPreview ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-200'}`}>
            {item.title}
          </span>
          {!isPreview && (
            <div className="flex items-center gap-0.5 flex-shrink-0">
              {isEditMode && item.onMenuClick && (
                <button
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-0.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    item.onMenuClick?.(e);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  title="Widget options"
                >
                  {item.menuIcon || <MoreHorizontal size={14} />}
                </button>
              )}
              {isEditMode && (
                <button
                  onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 p-0.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  title="Remove widget"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}
        </div>
        <div className="p-1 flex items-center justify-center h-[calc(100%-30px)] overflow-auto">
          {item.content ? item.content() : null}
        </div>
      </div>
    );
  };



  // Create dashboard actions object for custom toolbars
  const dashboardActions: DashboardActions = {
    toggleEditMode,
    toggleAddWidgetMode,
    autoOrganize,
    toggleFixedHeight,
    addWidget: addWidgetAtPosition,
    removeItem,
  };

  // Create dashboard state object for custom toolbars
  const dashboardState: DashboardState = {
    isEditMode,
    isAddWidgetMode,
    isFixedHeight: maxHeight !== null,
    gridDimensions,
    itemCount: items.length,
    items,
  };

  // Custom toolbar props
  const customToolbarProps: CustomToolbarProps = {
    state: dashboardState,
    actions: dashboardActions,
    availableWidgetTypes,
  };

  // Grid rendering functions
  const renderElegantGrid = () => (
    <>
      {/* Light mode elegant grid */}
      <div
        className="absolute pointer-events-none opacity-20"
        style={{
          top: CONTAINER_PADDING, left: CONTAINER_PADDING,
          right: CONTAINER_PADDING, bottom: CONTAINER_PADDING,
          backgroundImage: `
            linear-gradient(to right, rgba(156, 163, 175, 0.25) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(156, 163, 175, 0.25) 1px, transparent 1px)
          `,
          backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
        }}
      />

      {/* Dark mode elegant grid */}
      <div
        className="absolute pointer-events-none dark:block hidden opacity-15"
        style={{
          top: CONTAINER_PADDING, left: CONTAINER_PADDING,
          right: CONTAINER_PADDING, bottom: CONTAINER_PADDING,
          backgroundImage: `
            linear-gradient(to right, rgba(75, 85, 99, 0.3) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(75, 85, 99, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
        }}
      />
    </>
  );

  const renderDotsGrid = () => (
    <div
      className="absolute pointer-events-none opacity-30 dark:opacity-20"
      style={{
        top: CONTAINER_PADDING, left: CONTAINER_PADDING,
        right: CONTAINER_PADDING, bottom: CONTAINER_PADDING,
        backgroundImage: `
          radial-gradient(circle at center, rgba(156, 163, 175, 0.4) 1px, transparent 1px),
          radial-gradient(circle at center, rgba(75, 85, 99, 0.5) 1px, transparent 1px)
        `,
        backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
        backgroundPosition: `${CELL_SIZE / 2}px ${CELL_SIZE / 2}px`,
      }}
    />
  );

  const renderHarshGrid = () => (
    <div
      className="absolute opacity-20 dark:opacity-10 pointer-events-none"
      style={{
        top: CONTAINER_PADDING, left: CONTAINER_PADDING,
        right: CONTAINER_PADDING, bottom: CONTAINER_PADDING,
        backgroundImage: `
          linear-gradient(to right, #ccc 1px, transparent 1px), 
          linear-gradient(to bottom, #ccc 1px, transparent 1px)
        `,
        backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
      }}
    />
  );

  const renderGrid = () => {
    switch (gridMode) {
      case 'dots':
        return renderDotsGrid();
      case 'harsh':
        return renderHarshGrid();
      case 'blank':
        return null;
      case 'elegant':
      default:
        return renderElegantGrid();
    }
  };

  return (
    <div className={`p-4 bg-gray-50 dark:bg-gray-900 min-h-screen ${className}`}>
      {/* Conditional toolbar rendering */}
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
        />
      )}

      {/* Custom toolbar */}
      {customToolbar && (
        <div className={toolbarClassName}>
          {React.isValidElement(customToolbar)
            ? customToolbar
            : React.createElement(customToolbar as React.ComponentType<CustomToolbarProps>, customToolbarProps)
          }
        </div>
      )}

      <div className="w-full">
        <div
          ref={containerRef}
          className={`relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg w-full ${maxHeight ? 'overflow-auto' : 'overflow-hidden'}`}
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
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Plus size={24} />
                  </div>
                  <p>{isEditMode ? 'Click "Add Widget" to start' : 'No widgets'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
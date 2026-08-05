import type { DashboardItem, SerializedItem, SerializedLayout } from './types';

export const SCHEMA_VERSION = 1;

/** Strip everything non-structural so a layout is safe to `JSON.stringify`. */
export function serializeLayout(items: readonly DashboardItem[]): SerializedLayout {
  return {
    version: SCHEMA_VERSION,
    items: items.map((item) => ({
      id: item.id,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      type: item.type,
      title: item.title,
      anchorX: item.anchorX,
      anchorY: item.anchorY,
      anchorW: item.anchorW,
      anchorH: item.anchorH,
    })),
  };
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function parseItem(raw: unknown): SerializedItem | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const it = raw as Record<string, unknown>;
  if (typeof it.id !== 'string' || it.id === '') return null;
  if (!isFiniteNumber(it.x) || !isFiniteNumber(it.y)) return null;
  if (!isFiniteNumber(it.w) || !isFiniteNumber(it.h)) return null;
  if (typeof it.type !== 'string') return null;

  const optional = (key: string) => (isFiniteNumber(it[key]) ? (it[key] as number) : undefined);

  return {
    id: it.id,
    x: Math.trunc(it.x),
    y: Math.trunc(it.y),
    w: Math.trunc(it.w),
    h: Math.trunc(it.h),
    type: it.type,
    title: typeof it.title === 'string' ? it.title : '',
    anchorX: optional('anchorX'),
    anchorY: optional('anchorY'),
    anchorW: optional('anchorW'),
    anchorH: optional('anchorH'),
  };
}

export interface ParseResult {
  layout: SerializedLayout;
  /** Human-readable notes about anything dropped or migrated. */
  warnings: string[];
}

/**
 * Validate and normalise an untrusted layout payload — e.g. one read back out
 * of `localStorage` or an API. Never throws: bad items are dropped and
 * reported, so a single corrupt entry cannot take down the dashboard.
 */
export function parseLayout(raw: unknown): ParseResult {
  const warnings: string[] = [];
  const empty: SerializedLayout = { version: SCHEMA_VERSION, items: [] };

  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      return { layout: empty, warnings: ['Layout was not valid JSON.'] };
    }
  }

  if (typeof raw !== 'object' || raw === null) {
    return { layout: empty, warnings: ['Layout was not an object.'] };
  }

  const payload = raw as Record<string, unknown>;
  const version = isFiniteNumber(payload.version) ? payload.version : 0;

  if (version === 0) {
    warnings.push('Layout had no version; assuming the current schema.');
  } else if (version > SCHEMA_VERSION) {
    warnings.push(
      `Layout was written by a newer version (v${version} > v${SCHEMA_VERSION}); unknown fields ignored.`
    );
  }

  if (!Array.isArray(payload.items)) {
    return { layout: empty, warnings: [...warnings, 'Layout had no items array.'] };
  }

  const items: SerializedItem[] = [];
  const seen = new Set<string>();

  payload.items.forEach((entry, index) => {
    const parsed = parseItem(entry);
    if (!parsed) {
      warnings.push(`Dropped malformed item at index ${index}.`);
      return;
    }
    if (seen.has(parsed.id)) {
      warnings.push(`Dropped duplicate item id "${parsed.id}".`);
      return;
    }
    seen.add(parsed.id);
    items.push(parsed);
  });

  return { layout: { version: SCHEMA_VERSION, items }, warnings };
}

/** Next free numeric id for a set of items. */
export function nextItemId(items: readonly { id: string }[]): string {
  const max = items.reduce((acc, item) => {
    const n = Number.parseInt(item.id, 10);
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return String(max + 1);
}

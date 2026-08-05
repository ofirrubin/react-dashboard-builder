import { describe, expect, it } from 'vitest';
import { SCHEMA_VERSION, nextItemId, parseLayout, serializeLayout } from '../src/serialize';
import type { DashboardItem } from '../src/types';

const items: DashboardItem[] = [
  { id: '1', x: 0, y: 0, w: 4, h: 2, type: 'stat', title: 'Revenue' },
  { id: '2', x: 4, y: 0, w: 4, h: 2, type: 'chart', title: 'Traffic', anchorX: 4, anchorY: 0 },
];

describe('serializeLayout', () => {
  it('stamps the current schema version', () => {
    expect(serializeLayout(items).version).toBe(SCHEMA_VERSION);
  });

  it('is JSON-safe even when items carry extra runtime fields', () => {
    const withFunction = [
      { ...items[0], render: () => null, node: { self: null as unknown } },
    ] as unknown as DashboardItem[];
    const serialized = serializeLayout(withFunction);
    expect(() => JSON.stringify(serialized)).not.toThrow();
    expect(serialized.items[0]).not.toHaveProperty('render');
    expect(serialized.items[0]).not.toHaveProperty('node');
  });

  it('round-trips losslessly', () => {
    const { layout, warnings } = parseLayout(JSON.stringify(serializeLayout(items)));
    expect(warnings).toEqual([]);
    expect(layout).toEqual(serializeLayout(items));
  });
});

describe('parseLayout', () => {
  it('accepts a JSON string', () => {
    const { layout } = parseLayout('{"version":1,"items":[]}');
    expect(layout.items).toEqual([]);
  });

  it('never throws on garbage', () => {
    for (const bad of ['not json', null, undefined, 42, [], '', { items: 'nope' }]) {
      expect(() => parseLayout(bad)).not.toThrow();
      expect(parseLayout(bad).layout.items).toEqual([]);
    }
  });

  it('drops malformed items but keeps the good ones', () => {
    const { layout, warnings } = parseLayout({
      version: 1,
      items: [
        items[0],
        { id: 'missing-coords', type: 'stat' },
        { x: 0, y: 0, w: 2, h: 2, type: 'stat' },
        { ...items[1], x: Number.NaN },
      ],
    });
    expect(layout.items.map((i) => i.id)).toEqual(['1']);
    expect(warnings).toHaveLength(3);
  });

  it('drops duplicate ids', () => {
    const { layout, warnings } = parseLayout({ version: 1, items: [items[0], items[0]] });
    expect(layout.items).toHaveLength(1);
    expect(warnings[0]).toContain('duplicate');
  });

  it('warns about a missing version but still loads', () => {
    const { layout, warnings } = parseLayout({ items: [items[0]] });
    expect(layout.items).toHaveLength(1);
    expect(warnings[0]).toContain('no version');
  });

  it('warns about a future version but still loads what it recognises', () => {
    const { layout, warnings } = parseLayout({
      version: SCHEMA_VERSION + 5,
      items: [{ ...items[0], somethingNew: true }],
    });
    expect(layout.items).toHaveLength(1);
    expect(layout.items[0]).not.toHaveProperty('somethingNew');
    expect(warnings[0]).toContain('newer version');
  });

  it('truncates fractional coordinates', () => {
    const { layout } = parseLayout({
      version: 1,
      items: [{ ...items[0], x: 2.7, y: 3.9, w: 4.2, h: 2.8 }],
    });
    expect(layout.items[0]).toMatchObject({ x: 2, y: 3, w: 4, h: 2 });
  });

  it('defaults a missing title to an empty string', () => {
    const { layout } = parseLayout({
      version: 1,
      items: [{ id: '1', x: 0, y: 0, w: 2, h: 2, type: 'stat' }],
    });
    expect(layout.items[0].title).toBe('');
  });
});

describe('nextItemId', () => {
  it('returns one past the highest numeric id', () => {
    expect(nextItemId([{ id: '1' }, { id: '7' }, { id: '3' }])).toBe('8');
  });

  it('starts at 1 for an empty list', () => {
    expect(nextItemId([])).toBe('1');
  });

  it('ignores non-numeric ids', () => {
    expect(nextItemId([{ id: 'header' }, { id: 'abc' }])).toBe('1');
    expect(nextItemId([{ id: 'header' }, { id: '4' }])).toBe('5');
  });
});

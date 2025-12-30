import { describe, expect, it } from 'vitest';
import {
  addJazzMetadata,
  createDeepMock,
  createIterableCoList,
  createMockCoList,
  createMockCoMap,
  createMockCoRecord,
} from './covalue.js';

describe('createMockCoMap', () => {
  it('creates a CoMap with data', () => {
    const map = createMockCoMap({ name: 'Test', count: 42 });

    expect(map.name).toBe('Test');
    expect(map.count).toBe(42);
  });

  it('has $isLoaded property', () => {
    const map = createMockCoMap({ name: 'Test' });
    expect(map.$isLoaded).toBe(true);
  });

  it('has $jazz API', () => {
    const map = createMockCoMap({ name: 'Test' });

    expect(map.$jazz).toBeDefined();
    expect(map.$jazz.id).toMatch(/^comap-/);
    expect(map.$jazz.set).toBeDefined();
    expect(map.$jazz.owner).toBeDefined();
  });

  it('uses custom ID', () => {
    const map = createMockCoMap({ name: 'Test' }, { id: 'custom-id' });
    expect(map.$jazz.id).toBe('custom-id');
  });

  it('tracks mutations when enabled', () => {
    const map = createMockCoMap({ name: 'Original' }, { trackMutations: true });

    map.$jazz.set('name', 'Updated');
    expect(map.name).toBe('Updated');
  });

  it('does not mutate without trackMutations', () => {
    const map = createMockCoMap({ name: 'Original' });

    map.$jazz.set('name', 'Updated');
    expect(map.name).toBe('Original'); // Not changed
    expect(map.$jazz.set).toHaveBeenCalledWith('name', 'Updated');
  });
});

describe('createMockCoList', () => {
  it('creates a CoList with items', () => {
    const list = createMockCoList([1, 2, 3]);

    expect(list.length).toBe(3);
    expect(list[0]).toBe(1);
    expect(list[1]).toBe(2);
    expect(list[2]).toBe(3);
  });

  it('is iterable', () => {
    const list = createMockCoList(['a', 'b', 'c']);
    const result = [...list];

    expect(result).toEqual(['a', 'b', 'c']);
  });

  it('has $isLoaded property', () => {
    const list = createMockCoList([]);
    expect(list.$isLoaded).toBe(true);
  });

  it('has $jazz API', () => {
    const list = createMockCoList([]);

    expect(list.$jazz).toBeDefined();
    expect(list.$jazz.id).toMatch(/^colist-/);
    expect(list.$jazz.push).toBeDefined();
    expect(list.$jazz.splice).toBeDefined();
  });

  it('tracks push when enabled', () => {
    const list = createMockCoList([1, 2], { trackMutations: true });

    list.$jazz.push(3);
    expect(list.length).toBe(3);
    expect(list[2]).toBe(3);
  });

  it('tracks splice when enabled', () => {
    const list = createMockCoList([1, 2, 3], { trackMutations: true });

    list.$jazz.splice(1, 1); // Remove item at index 1
    expect(list.length).toBe(2);
    expect(list).toEqual(expect.arrayContaining([1, 3]));
  });
});

describe('createMockCoRecord', () => {
  it('creates a CoRecord with data', () => {
    const record = createMockCoRecord({
      template1: { name: 'Template 1' },
      template2: { name: 'Template 2' },
    });

    expect(record.template1.name).toBe('Template 1');
    expect(record.template2.name).toBe('Template 2');
  });

  it('has $isLoaded and $jazz', () => {
    const record = createMockCoRecord({});

    expect(record.$isLoaded).toBe(true);
    expect(record.$jazz).toBeDefined();
    expect(record.$jazz.id).toMatch(/^corecord-/);
  });

  it('allows iteration over non-Jazz keys', () => {
    const record = createMockCoRecord({
      a: 1,
      b: 2,
    });

    const keys = Object.keys(record).filter((k) => !k.startsWith('$'));
    expect(keys).toEqual(['a', 'b']);
  });
});

describe('addJazzMetadata', () => {
  it('adds $isLoaded and $jazz to existing object', () => {
    const data = { name: 'Test', items: [] };
    const covalue = addJazzMetadata(data);

    expect(covalue.$isLoaded).toBe(true);
    expect(covalue.$jazz).toBeDefined();
    expect(covalue.name).toBe('Test');
  });

  it('uses custom ID', () => {
    const data = { name: 'Test' };
    const covalue = addJazzMetadata(data, { id: 'my-id' });

    expect(covalue.$jazz.id).toBe('my-id');
  });
});

describe('createDeepMock', () => {
  it('adds Jazz metadata to nested objects', () => {
    const data = {
      name: 'Root',
      child: {
        name: 'Child',
      },
    };

    const mock = createDeepMock(data);

    expect(mock.$isLoaded).toBe(true);
    expect(mock.$jazz).toBeDefined();
    expect(mock.child.$isLoaded).toBe(true);
    expect(mock.child.$jazz).toBeDefined();
  });

  it('converts arrays to CoLists', () => {
    const data = {
      items: [{ name: 'Item 1' }, { name: 'Item 2' }],
    };

    const mock = createDeepMock(data);

    expect(mock.items.$isLoaded).toBe(true);
    expect(mock.items.$jazz).toBeDefined();
    expect(mock.items[0].$isLoaded).toBe(true);
  });

  it('preserves primitive values', () => {
    const data = {
      name: 'Test',
      count: 42,
      active: true,
    };

    const mock = createDeepMock(data);

    expect(mock.name).toBe('Test');
    expect(mock.count).toBe(42);
    expect(mock.active).toBe(true);
  });
});

describe('createIterableCoList', () => {
  it('creates list with iterator support', () => {
    const list = createIterableCoList([1, 2, 3]);

    const result: number[] = [];
    for (const item of list) {
      result.push(item);
    }

    expect(result).toEqual([1, 2, 3]);
  });

  it('has findIndex method', () => {
    const list = createIterableCoList([
      { id: 'a', name: 'Alice' },
      { id: 'b', name: 'Bob' },
    ]);

    const index = list.findIndex((item) => item.id === 'b');
    expect(index).toBe(1);
  });

  it('findIndex returns -1 when not found', () => {
    const list = createIterableCoList([{ id: 'a' }]);
    const index = list.findIndex((item) => item.id === 'missing');
    expect(index).toBe(-1);
  });
});

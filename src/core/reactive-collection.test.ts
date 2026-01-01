import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearBlobLoaderTimers,
  createMapWithReactiveCollections,
  createMapWithSyncImages,
  createReactiveList,
  createReactiveRecord,
} from './reactive-collection.js';

describe('createReactiveRecord', () => {
  it('creates an empty reactive record', () => {
    const record = createReactiveRecord();

    expect(record.$isLoaded).toBe(true);
    expect(record.$jazz).toBeDefined();
    expect(record.$jazz.set).toBeDefined();
    expect(record.$jazz.delete).toBeDefined();
  });

  it('tracks set calls', () => {
    const record = createReactiveRecord<{ name: string }>();

    record.$jazz.set('item-1', { name: 'Test Item' });

    expect(record.$jazz.set).toHaveBeenCalledWith('item-1', { name: 'Test Item' });
    expect(record['item-1']).toEqual({ name: 'Test Item' });
  });

  it('tracks delete calls', () => {
    const record = createReactiveRecord<{ name: string }>();

    record.$jazz.set('item-1', { name: 'Test' });
    record.$jazz.delete('item-1');

    expect(record.$jazz.delete).toHaveBeenCalledWith('item-1');
    expect(record['item-1']).toBeUndefined();
  });

  it('has method checks if key exists', () => {
    const record = createReactiveRecord<string>();

    record.$jazz.set('key', 'value');

    expect(record.$jazz.has('key')).toBe(true);
    expect(record.$jazz.has('missing')).toBe(false);
  });

  it('get method retrieves values', () => {
    const record = createReactiveRecord<string>();

    record.$jazz.set('key', 'value');

    expect(record.$jazz.get('key')).toBe('value');
    expect(record.$jazz.get('missing')).toBeUndefined();
  });

  it('supports direct property access via Proxy', () => {
    const record = createReactiveRecord<number>();

    record.$jazz.set('count', 42);

    expect(record.count).toBe(42);
  });

  it('supports property assignment via Proxy', () => {
    const record = createReactiveRecord<number>();

    record.count = 42;

    expect(record.count).toBe(42);
  });

  it('does not allow setting $ properties via Proxy', () => {
    const record = createReactiveRecord<unknown>();

    // Attempting to set $foo should not work
    record['$foo' as keyof typeof record] = 'test' as unknown;

    expect(record.$foo).toBeUndefined();
  });

  it('reports $isLoaded and $jazz in has check', () => {
    const record = createReactiveRecord();

    expect('$isLoaded' in record).toBe(true);
    expect('$jazz' in record).toBe(true);
  });

  it('ownKeys returns only data keys', () => {
    const record = createReactiveRecord<string>();

    record.$jazz.set('a', '1');
    record.$jazz.set('b', '2');

    const keys = Object.keys(record);
    expect(keys).toContain('a');
    expect(keys).toContain('b');
    expect(keys).not.toContain('$isLoaded');
    expect(keys).not.toContain('$jazz');
  });

  it('getOwnPropertyDescriptor works for data keys', () => {
    const record = createReactiveRecord<string>();

    record.$jazz.set('key', 'value');

    const desc = Object.getOwnPropertyDescriptor(record, 'key');
    expect(desc?.enumerable).toBe(true);
    expect(desc?.value).toBe('value');
  });

  it('getOwnPropertyDescriptor returns non-enumerable for $ keys', () => {
    const record = createReactiveRecord();

    const desc = Object.getOwnPropertyDescriptor(record, '$isLoaded');
    expect(desc?.enumerable).toBe(false);
  });
});

describe('createReactiveRecord with async loading', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('wraps file items with delayed blob loader', async () => {
    const record = createReactiveRecord<{ file: { toBlob: () => Blob | undefined } }>({
      simulateAsyncLoading: true,
      asyncLoadDelayMs: 100,
    });

    const mockBlob = new Blob(['test'], { type: 'text/plain' });
    const item = {
      file: {
        toBlob: () => mockBlob,
      },
    };

    record.$jazz.set('img-1', item);

    // Initially, blob should be undefined
    expect(record['img-1'].file.toBlob()).toBeUndefined();

    // After delay, blob should be available
    await vi.advanceTimersByTimeAsync(150);
    expect(record['img-1'].file.toBlob()).toBe(mockBlob);
  });

  it('does not wrap items without file property', () => {
    const record = createReactiveRecord<{ name: string }>({
      simulateAsyncLoading: true,
    });

    record.$jazz.set('item-1', { name: 'Test' });

    // Should be set directly without modification
    expect(record['item-1']).toEqual({ name: 'Test' });
  });

  it('handles missing toBlob function', async () => {
    const record = createReactiveRecord<{ file: Record<string, unknown> }>({
      simulateAsyncLoading: true,
      asyncLoadDelayMs: 50,
    });

    record.$jazz.set('item-1', { file: {} });

    await vi.advanceTimersByTimeAsync(100);

    // Should create a default blob
    const blob = record['item-1'].file.toBlob?.();
    expect(blob).toBeInstanceOf(Blob);
  });

  afterEach(() => {
    vi.useRealTimers();
  });
});

describe('createReactiveList', () => {
  it('creates an empty reactive list', () => {
    const list = createReactiveList();

    expect(list.$isLoaded).toBe(true);
    expect(list.$jazz).toBeDefined();
    expect(list.length).toBe(0);
  });

  it('creates a list with initial items', () => {
    const list = createReactiveList([1, 2, 3]);

    expect(list.length).toBe(3);
    expect(list[0]).toBe(1);
    expect(list[1]).toBe(2);
    expect(list[2]).toBe(3);
  });

  it('tracks push calls', () => {
    const list = createReactiveList<number>([]);

    list.$jazz.push(42);

    expect(list.$jazz.push).toHaveBeenCalledWith(42);
    expect(list.length).toBe(1);
    expect(list[0]).toBe(42);
  });

  it('tracks splice calls', () => {
    const list = createReactiveList([1, 2, 3]);

    list.$jazz.splice(1, 1);

    expect(list.$jazz.splice).toHaveBeenCalledWith(1, 1);
    expect(list.length).toBe(2);
    expect(list[0]).toBe(1);
    expect(list[1]).toBe(3);
  });

  it('is iterable', () => {
    const list = createReactiveList(['a', 'b', 'c']);

    const result = [...list];

    expect(result).toEqual(['a', 'b', 'c']);
  });

  it('supports array methods', () => {
    const list = createReactiveList([1, 2, 3, 4, 5]);

    expect(list.filter((x) => x > 2)).toEqual([3, 4, 5]);
    expect(list.map((x) => x * 2)).toEqual([2, 4, 6, 8, 10]);
    expect(list.find((x) => x === 3)).toBe(3);
  });

  it('$jazz properties are non-enumerable', () => {
    const list = createReactiveList([1, 2]);

    const props = Object.keys(list);
    expect(props).not.toContain('$isLoaded');
    expect(props).not.toContain('$jazz');
  });
});

describe('createReactiveList with async loading', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('wraps file items with delayed blob loader on push', async () => {
    const list = createReactiveList<{ file: { toBlob: () => Blob | undefined } }>([], {
      simulateAsyncLoading: true,
      asyncLoadDelayMs: 100,
    });

    const mockBlob = new Blob(['test'], { type: 'text/plain' });
    list.$jazz.push({
      file: { toBlob: () => mockBlob },
    });

    // Initially, blob should be undefined
    expect(list[0].file.toBlob()).toBeUndefined();

    // After delay, blob should be available
    await vi.advanceTimersByTimeAsync(150);
    expect(list[0].file.toBlob()).toBe(mockBlob);
  });

  afterEach(() => {
    vi.useRealTimers();
  });
});

describe('createMapWithReactiveCollections', () => {
  it('creates a map with default values', () => {
    const map = createMapWithReactiveCollections();

    expect(map.$isLoaded).toBe(true);
    expect(map.name).toBe('Test Map');
    expect(map.type).toBe('map');
    expect(map.id).toBeDefined();
  });

  it('uses custom name', () => {
    const map = createMapWithReactiveCollections({ name: 'My Custom Map' });

    expect(map.name).toBe('My Custom Map');
    expect(map.path).toBe('/My Custom Map');
  });

  it('uses custom id', () => {
    const map = createMapWithReactiveCollections({ id: 'custom-id-123' });

    expect(map.id).toBe('custom-id-123');
  });

  it('has reactive images collection', () => {
    const map = createMapWithReactiveCollections();

    expect(map.images.$isLoaded).toBe(true);
    expect(map.images.$jazz).toBeDefined();

    map.images.$jazz.set('img-1', { name: 'Test Image' });
    expect(map.images['img-1']).toEqual({ name: 'Test Image' });
  });

  it('has reactive files collection', () => {
    const map = createMapWithReactiveCollections();

    expect(map.files.$isLoaded).toBe(true);
    expect(map.files.$jazz).toBeDefined();

    map.files.$jazz.set('file-1', { name: 'Test File' });
    expect(map.files['file-1']).toEqual({ name: 'Test File' });
  });

  it('has reactive pois list', () => {
    const map = createMapWithReactiveCollections();

    expect(map.pois.$isLoaded).toBe(true);
    expect(map.pois.$jazz).toBeDefined();
    expect(Array.isArray(map.pois)).toBe(true);
  });

  it('has reactive templates and schemas', () => {
    const map = createMapWithReactiveCollections();

    expect(map.templates.$isLoaded).toBe(true);
    expect(map.schemas.$isLoaded).toBe(true);
    expect(map.icons.$isLoaded).toBe(true);
  });

  it('sets default template and schema', () => {
    const map = createMapWithReactiveCollections({
      defaultTemplate: 'template-1',
      defaultSchema: 'schema-1',
    });

    expect(map.defaultTemplate).toBe('template-1');
    expect(map.defaultSchema).toBe('schema-1');
  });

  it('has $jazz API on root', () => {
    const map = createMapWithReactiveCollections();

    expect(map.$jazz).toBeDefined();
    expect(map.$jazz.set).toBeDefined();
  });

  it('passes async options to images and files', () => {
    vi.useFakeTimers();

    const map = createMapWithReactiveCollections({
      simulateAsyncLoading: true,
      asyncLoadDelayMs: 200,
    });

    const mockBlob = new Blob(['test'], { type: 'image/png' });
    map.images.$jazz.set('img-1', {
      file: { toBlob: () => mockBlob },
    });

    // Should use delayed loading
    expect(
      (map.images['img-1'] as { file: { toBlob: () => Blob | undefined } }).file.toBlob(),
    ).toBeUndefined();

    vi.useRealTimers();
  });

  it('has correct timestamps', () => {
    const before = new Date();
    const map = createMapWithReactiveCollections();
    const after = new Date();

    expect(map.created_at.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(map.created_at.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});

describe('createMapWithSyncImages', () => {
  it('is an alias for createMapWithReactiveCollections', () => {
    const map = createMapWithSyncImages({ name: 'Test' });

    expect(map.name).toBe('Test');
    expect(map.$isLoaded).toBe(true);
    expect(map.images.$isLoaded).toBe(true);
  });

  it('maps blobLoadDelayMs to asyncLoadDelayMs', () => {
    vi.useFakeTimers();

    const map = createMapWithSyncImages({
      simulateAsyncLoading: true,
      blobLoadDelayMs: 300,
    });

    const mockBlob = new Blob(['test'], { type: 'image/png' });
    map.images.$jazz.set('img-1', {
      file: { toBlob: () => mockBlob },
    });

    // Should be undefined initially due to delay
    expect(
      (map.images['img-1'] as { file: { toBlob: () => Blob | undefined } }).file.toBlob(),
    ).toBeUndefined();

    vi.useRealTimers();
  });

  it('passes defaultTemplate and defaultSchema', () => {
    const map = createMapWithSyncImages({
      defaultTemplate: 't1',
      defaultSchema: 's1',
    });

    expect(map.defaultTemplate).toBe('t1');
    expect(map.defaultSchema).toBe('s1');
  });
});

describe('clearBlobLoaderTimers', () => {
  it('clears pending timers', () => {
    vi.useFakeTimers();

    const record = createReactiveRecord<{ file: { toBlob: () => Blob } }>({
      simulateAsyncLoading: true,
      asyncLoadDelayMs: 1000,
    });

    const mockBlob = new Blob(['test'], { type: 'text/plain' });
    record.$jazz.set('item', { file: { toBlob: () => mockBlob } });

    // Initially undefined
    expect(record.item.file.toBlob()).toBeUndefined();

    // Clear timers before they complete
    clearBlobLoaderTimers();

    // Advance time - blob should still be undefined because timer was cleared
    vi.advanceTimersByTime(2000);
    expect(record.item.file.toBlob()).toBeUndefined();

    vi.useRealTimers();
  });

  it('can be called multiple times safely', () => {
    clearBlobLoaderTimers();
    clearBlobLoaderTimers();
    // Should not throw
  });

  it('does not affect other code', () => {
    vi.useFakeTimers();

    let called = false;
    setTimeout(() => {
      called = true;
    }, 100);

    clearBlobLoaderTimers();

    vi.advanceTimersByTime(200);
    expect(called).toBe(true); // Other timers unaffected

    vi.useRealTimers();
  });
});

describe('reactive collection edge cases', () => {
  it('handles null values in record', () => {
    const record = createReactiveRecord<null>();

    record.$jazz.set('key', null);

    expect(record.key).toBeNull();
  });

  it('handles undefined values in record', () => {
    const record = createReactiveRecord<undefined>();

    record.$jazz.set('key', undefined);

    expect(record.key).toBeUndefined();
    expect(record.$jazz.has('key')).toBe(true);
  });

  it('handles objects with file property but no toBlob', async () => {
    vi.useFakeTimers();

    const record = createReactiveRecord<{ file: { name: string } }>({
      simulateAsyncLoading: true,
      asyncLoadDelayMs: 50,
    });

    record.$jazz.set('item', { file: { name: 'test.txt' } });

    await vi.advanceTimersByTimeAsync(100);

    // Should have the delayed blob loader added
    expect(record.item.file).toBeDefined();

    vi.useRealTimers();
  });

  it('handles Promise-returning toBlob', async () => {
    vi.useFakeTimers();

    const mockBlob = new Blob(['async'], { type: 'text/plain' });
    const record = createReactiveRecord<{ file: { toBlob: () => Promise<Blob> } }>({
      simulateAsyncLoading: true,
      asyncLoadDelayMs: 50,
    });

    record.$jazz.set('item', {
      file: { toBlob: () => Promise.resolve(mockBlob) },
    });

    // Need to advance timers and flush promises
    await vi.advanceTimersByTimeAsync(100);

    expect(record.item.file.toBlob()).toBe(mockBlob);

    vi.useRealTimers();
  });

  it('empty list stays empty after iteration', () => {
    const list = createReactiveList([]);

    for (const _ of list) {
      // Should not execute
    }

    expect(list.length).toBe(0);
  });
});

describe('blob loader error handling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    clearBlobLoaderTimers();
    vi.useRealTimers();
  });

  it('handles toBlob throwing synchronously', async () => {
    const record = createReactiveRecord<{ file: { toBlob: () => Blob } }>({
      simulateAsyncLoading: true,
      asyncLoadDelayMs: 50,
    });

    record.$jazz.set('item', {
      file: {
        toBlob: () => {
          throw new Error('Sync error in toBlob');
        },
      },
    });

    // Initially undefined
    expect(record.item.file.toBlob()).toBeUndefined();

    // After delay, should return null (error was caught)
    await vi.advanceTimersByTimeAsync(100);
    expect(record.item.file.toBlob()).toBeNull();
  });

  it('handles toBlob returning rejected Promise', async () => {
    const record = createReactiveRecord<{ file: { toBlob: () => Promise<Blob> } }>({
      simulateAsyncLoading: true,
      asyncLoadDelayMs: 50,
    });

    record.$jazz.set('item', {
      file: {
        toBlob: () => Promise.reject(new Error('Async error in toBlob')),
      },
    });

    // Initially undefined
    expect(record.item.file.toBlob()).toBeUndefined();

    // After delay, should return null (rejection was caught)
    await vi.advanceTimersByTimeAsync(100);
    expect(record.item.file.toBlob()).toBeNull();
  });

  it('handles toBlob returning undefined', async () => {
    const record = createReactiveRecord<{ file: { toBlob: () => Blob | undefined } }>({
      simulateAsyncLoading: true,
      asyncLoadDelayMs: 50,
    });

    record.$jazz.set('item', {
      file: {
        toBlob: () => undefined,
      },
    });

    await vi.advanceTimersByTimeAsync(100);
    expect(record.item.file.toBlob()).toBeNull();
  });

  it('handles toBlob returning null via Promise', async () => {
    const record = createReactiveRecord<{ file: { toBlob: () => Promise<Blob | null> } }>({
      simulateAsyncLoading: true,
      asyncLoadDelayMs: 50,
    });

    record.$jazz.set('item', {
      file: {
        toBlob: () => Promise.resolve(null) as Promise<Blob | null>,
      },
    });

    await vi.advanceTimersByTimeAsync(100);
    expect(record.item.file.toBlob()).toBeNull();
  });

  it('list items handle toBlob errors', async () => {
    const list = createReactiveList<{ file: { toBlob: () => Blob } }>([], {
      simulateAsyncLoading: true,
      asyncLoadDelayMs: 50,
    });

    list.$jazz.push({
      file: {
        toBlob: () => {
          throw new Error('List item toBlob error');
        },
      },
    });

    expect(list[0].file.toBlob()).toBeUndefined();

    await vi.advanceTimersByTimeAsync(100);
    expect(list[0].file.toBlob()).toBeNull();
  });

  it('splice items handle toBlob errors', async () => {
    // Start with empty list - items added via splice will get wrapped
    const list = createReactiveList<{ file: { toBlob: () => Blob } }>([], {
      simulateAsyncLoading: true,
      asyncLoadDelayMs: 50,
    });

    // Insert at index 0 via splice
    list.$jazz.splice(0, 0, {
      file: {
        toBlob: () => {
          throw new Error('Splice item toBlob error');
        },
      },
    });

    expect(list[0].file.toBlob()).toBeUndefined();

    await vi.advanceTimersByTimeAsync(100);
    expect(list[0].file.toBlob()).toBeNull();
  });
});

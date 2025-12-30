/**
 * CoValue mock factories
 *
 * Creates mock CoMap and CoList objects that behave like Jazz CoValues
 * but without actual Jazz runtime.
 */

import { type Mock, vi } from 'vitest';
import { createMockJazzAPI, type MockJazzAPI, type MockOwner } from './jazz-api.js';

/**
 * Base properties that all mock CoValues have
 */
export interface MockCoValueBase {
  /** Indicates the CoValue is loaded (always true for mocks) */
  $isLoaded: true;
  /** Jazz API for mutations */
  $jazz: MockJazzAPI;
}

/**
 * A mock CoMap with data and Jazz metadata
 */
export type MockCoMap<T extends object = Record<string, unknown>> = T &
  MockCoValueBase & {
    /** Optional ensureLoaded method */
    ensureLoaded?: Mock<(options?: { resolve?: unknown }) => Promise<MockCoMap<T>>>;
  };

/**
 * A mock CoList (array) with Jazz metadata
 */
export type MockCoList<T = unknown> = T[] &
  MockCoValueBase & {
    /** Optional ensureLoaded method */
    ensureLoaded?: Mock<(options?: { resolve?: unknown }) => Promise<MockCoList<T>>>;
  };

/**
 * A mock CoRecord (object collection) with Jazz metadata
 */
export type MockCoRecord<T = unknown> = Record<string, T> &
  MockCoValueBase & {
    /** Optional ensureLoaded method */
    ensureLoaded?: Mock<(options?: { resolve?: unknown }) => Promise<MockCoRecord<T>>>;
  };

/**
 * Options for creating mock CoValues
 */
export interface CreateMockCoValueOptions {
  /** Custom ID for the CoValue */
  id?: string;
  /** ID prefix for generated ID */
  idPrefix?: string;
  /** Custom owner */
  owner?: MockOwner;
  /** Whether to track mutations on the target object */
  trackMutations?: boolean;
}

/**
 * Create a mock CoMap
 *
 * Creates a plain object with $isLoaded and $jazz properties that
 * simulate a loaded Jazz CoMap.
 *
 * @param data - Initial data for the CoMap
 * @param options - Configuration options
 * @returns Mock CoMap with Jazz metadata
 *
 * @example
 * ```typescript
 * const folder = createMockCoMap({
 *   name: 'My Folder',
 *   expanded: true,
 *   archived: false,
 * });
 *
 * // Access data
 * expect(folder.name).toBe('My Folder');
 *
 * // Check Jazz metadata
 * expect(folder.$isLoaded).toBe(true);
 * expect(folder.$jazz.id).toBeDefined();
 *
 * // Mutations are tracked
 * folder.$jazz.set('name', 'Updated');
 * expect(folder.$jazz.set).toHaveBeenCalledWith('name', 'Updated');
 * ```
 *
 * @example
 * ```typescript
 * // With mutation tracking (updates the actual object)
 * const folder = createMockCoMap(
 *   { name: 'Original' },
 *   { trackMutations: true }
 * );
 *
 * folder.$jazz.set('name', 'Updated');
 * expect(folder.name).toBe('Updated');
 * ```
 */
export function createMockCoMap<T extends object>(
  data: T,
  options: CreateMockCoValueOptions = {},
): MockCoMap<T> {
  const target = { ...data } as T & MockCoValueBase;

  const $jazz = createMockJazzAPI({
    id: options.id,
    idPrefix: options.idPrefix ?? 'comap',
    owner: options.owner,
    target: options.trackMutations ? (target as Record<string, unknown>) : undefined,
  });

  target.$isLoaded = true;
  target.$jazz = $jazz;

  return target as MockCoMap<T>;
}

/**
 * Create a mock CoList
 *
 * Creates an array with $isLoaded and $jazz properties that
 * simulate a loaded Jazz CoList.
 *
 * @param items - Initial items for the CoList
 * @param options - Configuration options
 * @returns Mock CoList with Jazz metadata
 *
 * @example
 * ```typescript
 * const items = createMockCoList([
 *   { id: '1', name: 'Item 1' },
 *   { id: '2', name: 'Item 2' },
 * ]);
 *
 * // Iterate normally
 * for (const item of items) {
 *   console.log(item.name);
 * }
 *
 * // Check Jazz metadata
 * expect(items.$isLoaded).toBe(true);
 * expect(items.$jazz.push).toBeDefined();
 * ```
 *
 * @example
 * ```typescript
 * // With mutation tracking
 * const items = createMockCoList<string>(['a', 'b'], { trackMutations: true });
 *
 * // Push tracks the call AND mutates the array
 * items.$jazz.push('c');
 * expect(items.$jazz.push).toHaveBeenCalledWith('c');
 * ```
 */
export function createMockCoList<T>(
  items: T[] = [],
  options: CreateMockCoValueOptions = {},
): MockCoList<T> {
  const list = [...items] as MockCoList<T>;

  const baseJazz = createMockJazzAPI({
    id: options.id,
    idPrefix: options.idPrefix ?? 'colist',
    owner: options.owner,
  });

  // Override push and splice to actually mutate the array if tracking
  if (options.trackMutations) {
    baseJazz.push = vi.fn((value: unknown) => {
      list.push(value as T);
    });
    baseJazz.splice = vi.fn((index: number, count: number) => {
      list.splice(index, count);
    });
  }

  list.$isLoaded = true;
  list.$jazz = baseJazz;

  return list;
}

/**
 * Create a mock CoRecord
 *
 * Creates an object collection with $isLoaded and $jazz properties that
 * simulate a loaded Jazz CoRecord.
 *
 * @param data - Initial key-value data for the CoRecord
 * @param options - Configuration options
 * @returns Mock CoRecord with Jazz metadata
 *
 * @example
 * ```typescript
 * const templates = createMockCoRecord({
 *   'default': { id: 'default', name: 'Default Template' },
 *   'custom': { id: 'custom', name: 'Custom Template' },
 * });
 *
 * // Access by key
 * expect(templates['default'].name).toBe('Default Template');
 *
 * // Iterate over entries
 * for (const [key, template] of Object.entries(templates)) {
 *   if (key.startsWith('$')) continue; // Skip Jazz metadata
 *   console.log(template.name);
 * }
 * ```
 */
export function createMockCoRecord<T>(
  data: Record<string, T> = {},
  options: CreateMockCoValueOptions = {},
): MockCoRecord<T> {
  const record = { ...data } as MockCoRecord<T>;

  const $jazz = createMockJazzAPI({
    id: options.id,
    idPrefix: options.idPrefix ?? 'corecord',
    owner: options.owner,
    target: options.trackMutations ? (record as Record<string, unknown>) : undefined,
  });

  record.$isLoaded = true;
  record.$jazz = $jazz;

  return record;
}

/**
 * Add Jazz metadata to an existing object
 *
 * Useful when you have an existing object that needs Jazz metadata added.
 *
 * @param target - Object to add metadata to
 * @param options - Configuration options
 * @returns The same object with Jazz metadata added
 *
 * @example
 * ```typescript
 * const data = { name: 'Test', items: [] };
 * const covalue = addJazzMetadata(data);
 *
 * expect(covalue.$isLoaded).toBe(true);
 * expect(covalue.$jazz.id).toBeDefined();
 * ```
 */
export function addJazzMetadata<T extends object>(
  target: T,
  options: CreateMockCoValueOptions = {},
): T & MockCoValueBase {
  const result = target as T & MockCoValueBase;

  result.$isLoaded = true;
  result.$jazz = createMockJazzAPI({
    id: options.id,
    idPrefix: options.idPrefix,
    owner: options.owner,
    target: options.trackMutations ? (target as Record<string, unknown>) : undefined,
  });

  return result;
}

/**
 * Create a deeply nested mock structure with Jazz metadata
 *
 * Recursively adds $isLoaded and $jazz to all nested objects and arrays.
 * Useful for complex nested CoValue structures.
 *
 * @param data - Data structure to convert
 * @param options - Configuration options
 * @returns Deep mock structure with Jazz metadata at each level
 *
 * @example
 * ```typescript
 * const account = createDeepMock({
 *   profile: { name: 'Test User' },
 *   root: {
 *     folders: [
 *       { name: 'Folder 1', items: [] },
 *       { name: 'Folder 2', items: [] },
 *     ],
 *   },
 * });
 *
 * // All levels have Jazz metadata
 * expect(account.$isLoaded).toBe(true);
 * expect(account.root.$isLoaded).toBe(true);
 * expect(account.root.folders.$isLoaded).toBe(true);
 * expect(account.root.folders[0].$isLoaded).toBe(true);
 * ```
 */
export function createDeepMock<T>(
  data: T,
  options: CreateMockCoValueOptions = {},
): T extends Array<infer U>
  ? MockCoList<U extends object ? MockCoMap<U> : U>
  : T extends object
    ? MockCoMap<{
        [K in keyof T]: T[K] extends Array<infer U>
          ? MockCoList<U extends object ? MockCoMap<U> : U>
          : T[K] extends object
            ? MockCoMap<T[K]>
            : T[K];
      }>
    : T {
  if (Array.isArray(data)) {
    const items = data.map((item) =>
      typeof item === 'object' && item !== null
        ? createDeepMock(item, { ...options, id: undefined })
        : item,
    );
    return createMockCoList(items, options) as ReturnType<typeof createDeepMock<T>>;
  }

  if (typeof data === 'object' && data !== null) {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'object' && value !== null) {
        result[key] = createDeepMock(value, { ...options, id: undefined });
      } else {
        result[key] = value;
      }
    }

    return createMockCoMap(result, options) as ReturnType<typeof createDeepMock<T>>;
  }

  return data as ReturnType<typeof createDeepMock<T>>;
}

/**
 * Create a mock CoList with iterator support
 *
 * Jazz CoLists are iterable. This helper ensures proper Symbol.iterator support.
 *
 * @param items - Initial items
 * @param options - Configuration options
 * @returns Mock CoList with full iterator support
 */
export function createIterableCoList<T>(
  items: T[] = [],
  options: CreateMockCoValueOptions = {},
): MockCoList<T> & { findIndex: (fn: (item: T) => boolean) => number } {
  const list = createMockCoList(items, options);

  // Ensure iterator is properly set up
  (list as unknown as { [Symbol.iterator]: () => Iterator<T> })[Symbol.iterator] = function* () {
    for (let i = 0; i < list.length; i++) {
      yield list[i];
    }
  };

  // Add findIndex for convenience
  (list as unknown as { findIndex: (fn: (item: T) => boolean) => number }).findIndex = (
    fn: (item: T) => boolean,
  ) => {
    for (let i = 0; i < list.length; i++) {
      if (fn(list[i])) return i;
    }
    return -1;
  };

  return list as MockCoList<T> & { findIndex: (fn: (item: T) => boolean) => number };
}

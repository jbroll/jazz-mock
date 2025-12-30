/**
 * Mock $jazz API for CoValue operations
 *
 * Jazz CoValues have a $jazz property that provides mutation methods.
 * This module provides mock implementations for testing.
 */

import { vi, type Mock } from "vitest";
import { generateId } from "./id.js";

/**
 * Mock owner reference
 */
export interface MockOwner {
  id: string;
}

/**
 * The $jazz API interface that all CoValues have
 */
export interface MockJazzAPI {
  /** Unique ID of this CoValue */
  id: string;
  /** Set a property value */
  set: Mock<(key: string, value: unknown) => void>;
  /** Push to a list property */
  push: Mock<(value: unknown) => void>;
  /** Splice a list property */
  splice: Mock<(index: number, count: number) => void>;
  /** Delete a property */
  delete: Mock<(key: string) => void>;
  /** Check if a property exists */
  has: Mock<(key: string) => boolean>;
  /** Get a property value */
  get: Mock<(key: string) => unknown>;
  /** Owner reference */
  owner: MockOwner;
}

/**
 * Options for creating a mock $jazz API
 */
export interface CreateMockJazzAPIOptions {
  /** Custom ID for the CoValue */
  id?: string;
  /** ID prefix for generated ID */
  idPrefix?: string;
  /** Custom owner */
  owner?: MockOwner;
  /** Target object to mutate (for set/delete operations) */
  target?: Record<string, unknown>;
}

/**
 * Create a mock $jazz API
 *
 * The $jazz API provides methods for mutating CoValues:
 * - set(key, value): Set a property
 * - push(value): Push to a list
 * - splice(index, count): Remove items from a list
 * - delete(key): Delete a property
 * - has(key): Check if property exists
 * - get(key): Get property value
 *
 * @param options - Configuration options
 * @returns Mock $jazz API with spy functions
 *
 * @example
 * ```typescript
 * const $jazz = createMockJazzAPI();
 *
 * // Use in tests
 * myCoValue.$jazz.set('name', 'Test');
 * expect($jazz.set).toHaveBeenCalledWith('name', 'Test');
 * ```
 *
 * @example
 * ```typescript
 * // With target object for actual mutations
 * const data = { name: 'Original' };
 * const $jazz = createMockJazzAPI({ target: data });
 *
 * $jazz.set('name', 'Updated');
 * expect(data.name).toBe('Updated');
 * ```
 */
export function createMockJazzAPI(options: CreateMockJazzAPIOptions = {}): MockJazzAPI {
  const id = options.id ?? generateId(options.idPrefix);
  const owner = options.owner ?? { id: "test-group" };
  const target = options.target;

  return {
    id,
    set: vi.fn((key: string, value: unknown) => {
      if (target) {
        target[key] = value;
      }
    }),
    push: vi.fn((_value: unknown) => {
      // Push is typically used on list properties
    }),
    splice: vi.fn((_index: number, _count: number) => {
      // Splice removes items from list properties
    }),
    delete: vi.fn((key: string) => {
      if (target) {
        delete target[key];
      }
    }),
    has: vi.fn((key: string) => {
      if (target) {
        return key in target;
      }
      return false;
    }),
    get: vi.fn((key: string) => {
      if (target) {
        return target[key];
      }
      return undefined;
    }),
    owner,
  };
}

/**
 * Create a mock ensureLoaded function
 *
 * Jazz's ensureLoaded() returns a promise that resolves when all
 * nested CoValues are loaded. In tests, we resolve immediately.
 *
 * @returns Mock ensureLoaded function
 *
 * @example
 * ```typescript
 * const map = createMockCoMap({ name: 'Test' });
 * map.ensureLoaded = createMockEnsureLoaded();
 *
 * const loaded = await map.ensureLoaded({ resolve: { items: true } });
 * expect(loaded).toBe(map);
 * ```
 */
export function createMockEnsureLoaded<T>(): Mock<(options?: { resolve?: unknown }) => Promise<T>> {
  return vi.fn(async function (this: T, _options?: { resolve?: unknown }): Promise<T> {
    return this;
  });
}

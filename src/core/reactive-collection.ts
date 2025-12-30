/**
 * Proxy-based reactive collection mocks
 *
 * Jazz collections sync data asynchronously. These mocks simulate that behavior
 * with configurable sync/async modes for different testing scenarios.
 */

import { vi } from 'vitest';
import { createMockJazzAPI, type MockJazzAPI } from './jazz-api.js';

/**
 * Options for reactive collection mocks
 */
export interface ReactiveCollectionOptions {
  /**
   * Simulate async loading behavior
   *
   * When true, items appear immediately but nested blobs/data
   * load asynchronously (simulates page reload scenario).
   *
   * When false (default), everything is available immediately
   * (simulates upload scenario where data was just created).
   */
  simulateAsyncLoading?: boolean;

  /**
   * Delay in ms before async data becomes available
   * Only used when simulateAsyncLoading is true
   * @default 100
   */
  asyncLoadDelayMs?: number;
}

/**
 * Create a delayed blob loader that simulates Jazz async loading
 *
 * Jazz FileStreams load blobs asynchronously. After upload, the blob
 * is immediately available. But after page reload, toBlob() returns
 * undefined until the blob is fetched from storage.
 */
function createDelayedBlobLoader(
  originalFile: { toBlob?: () => Blob | Promise<Blob> | undefined },
  delayMs: number,
) {
  let blobReady = false;
  let blob: Blob | null = null;

  // Start async loading
  setTimeout(async () => {
    if (typeof originalFile.toBlob === 'function') {
      const result = originalFile.toBlob();
      blob = result instanceof Promise ? await result : (result ?? null);
    } else {
      blob = new Blob(['mock'], { type: 'application/octet-stream' });
    }
    blobReady = true;
  }, delayMs);

  return {
    ...originalFile,
    $isLoaded: true,
    toBlob: () => {
      // Returns undefined until blob is loaded (Jazz pattern)
      return blobReady ? blob : undefined;
    },
  };
}

/**
 * Reactive collection type
 *
 * A record with Jazz metadata accessible via Proxy.
 * The $isLoaded and $jazz properties are accessed via the Proxy getter,
 * not as actual properties on the object.
 */
export type ReactiveCollection<T> = Record<string, T> & {
  readonly $isLoaded: true;
  readonly $jazz: MockJazzAPI;
};

/**
 * Create a reactive record collection
 *
 * Returns a Proxy-based collection that tracks mutations and optionally
 * simulates async loading behavior for nested blobs.
 *
 * @param options - Configuration options
 * @returns Reactive collection with $jazz API
 *
 * @example
 * ```typescript
 * // Fast mode (default): Everything available immediately
 * const images = createReactiveRecord<ImageDefinition>();
 * images.$jazz.set('img-1', imageData);
 * expect(images['img-1']).toBeDefined();
 *
 * // Async mode: Simulate page reload behavior
 * const images = createReactiveRecord<ImageDefinition>({
 *   simulateAsyncLoading: true,
 *   asyncLoadDelayMs: 150,
 * });
 * images.$jazz.set('img-1', imageData);
 * // Image exists but blob loads async
 * expect(images['img-1']).toBeDefined();
 * expect(images['img-1'].file.toBlob()).toBeUndefined(); // Initially
 * await new Promise(r => setTimeout(r, 200));
 * expect(images['img-1'].file.toBlob()).toBeDefined(); // After delay
 * ```
 */
export function createReactiveRecord<T = unknown>(
  options: ReactiveCollectionOptions = {},
): ReactiveCollection<T> {
  const data: Record<string, T> = {};
  const simulateAsync = options.simulateAsyncLoading ?? false;
  const loadDelay = options.asyncLoadDelayMs ?? 100;

  const $jazz: MockJazzAPI = {
    ...createMockJazzAPI(),
    set: vi.fn((key: string, value: T) => {
      if (simulateAsync && value && typeof value === 'object' && 'file' in value) {
        // Wrap file with delayed blob loader
        const valueWithDelayedBlob = {
          ...value,
          file: createDelayedBlobLoader(
            (value as { file: { toBlob?: () => Blob | undefined } }).file,
            loadDelay,
          ),
        };
        data[key] = valueWithDelayedBlob as T;
      } else {
        data[key] = value;
      }
    }),
    delete: vi.fn((key: string) => {
      delete data[key];
    }),
    has: vi.fn((key: string) => key in data),
    get: vi.fn((key: string) => data[key]),
  };

  return new Proxy(data as ReactiveCollection<T>, {
    get(target, prop) {
      if (prop === '$isLoaded') return true;
      if (prop === '$jazz') return $jazz;
      return target[prop as string];
    },
    set(target, prop, value) {
      if (typeof prop === 'string' && !prop.startsWith('$')) {
        target[prop] = value;
      }
      return true;
    },
    has(target, prop) {
      if (prop === '$isLoaded' || prop === '$jazz') return true;
      return prop in target;
    },
    ownKeys(target) {
      return Object.keys(target);
    },
    getOwnPropertyDescriptor(target, prop) {
      if (prop === '$isLoaded' || prop === '$jazz') {
        return { enumerable: false, configurable: true, value: undefined };
      }
      return {
        enumerable: true,
        configurable: true,
        value: target[prop as string],
      };
    },
  });
}

/**
 * Create a reactive list collection
 *
 * Returns a Proxy-based array that tracks mutations.
 *
 * @param initialItems - Initial items
 * @param options - Configuration options
 * @returns Reactive list with $jazz API
 *
 * @example
 * ```typescript
 * const items = createReactiveList<POI>([]);
 * items.$jazz.push({ name: 'New POI' });
 * expect(items.length).toBe(1);
 * ```
 */
export function createReactiveList<T = unknown>(
  initialItems: T[] = [],
  options: ReactiveCollectionOptions = {},
): T[] & { $isLoaded: true; $jazz: MockJazzAPI } {
  const data: T[] = [...initialItems];
  const simulateAsync = options.simulateAsyncLoading ?? false;
  const loadDelay = options.asyncLoadDelayMs ?? 100;

  const $jazz: MockJazzAPI = {
    ...createMockJazzAPI({ idPrefix: 'colist' }),
    push: vi.fn((value: T) => {
      if (simulateAsync && value && typeof value === 'object' && 'file' in value) {
        const valueWithDelayedBlob = {
          ...value,
          file: createDelayedBlobLoader(
            (value as { file: { toBlob?: () => Blob | undefined } }).file,
            loadDelay,
          ),
        };
        data.push(valueWithDelayedBlob as T);
      } else {
        data.push(value);
      }
    }),
    splice: vi.fn((index: number, count: number) => {
      data.splice(index, count);
    }),
  };

  // Add iterator support
  const listWithMeta = data as T[] & { $isLoaded: true; $jazz: MockJazzAPI };
  Object.defineProperty(listWithMeta, '$isLoaded', { value: true, enumerable: false });
  Object.defineProperty(listWithMeta, '$jazz', { value: $jazz, enumerable: false });

  return listWithMeta;
}

/**
 * Options for createMapWithReactiveCollections
 */
export interface MapWithReactiveCollectionsOptions extends ReactiveCollectionOptions {
  /** Map name */
  name?: string;
  /** Map ID */
  id?: string;
  /** Default template name */
  defaultTemplate?: string;
  /** Default schema name */
  defaultSchema?: string;
}

/**
 * Create a map fixture with reactive collections
 *
 * Useful for testing image/file upload workflows where you need
 * collections that respond to $jazz.set() calls.
 *
 * @param options - Configuration options
 * @returns Map fixture with reactive images and files collections
 *
 * @example
 * ```typescript
 * // Fast mode: For upload tests
 * const map = createMapWithReactiveCollections({ name: "Test Map" });
 *
 * // Upload an image
 * map.images.$jazz.set('img-1', imageDefinition);
 * expect(map.images['img-1']).toBeDefined();
 *
 * // Async mode: For page reload tests
 * const map = createMapWithReactiveCollections({
 *   name: "Test Map",
 *   simulateAsyncLoading: true,
 *   asyncLoadDelayMs: 150,
 * });
 * ```
 */
export function createMapWithReactiveCollections(options: MapWithReactiveCollectionsOptions = {}) {
  const id = options.id ?? `map-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const name = options.name ?? 'Test Map';

  return {
    $isLoaded: true as const,
    id,
    name,
    path: `/${name}`,
    type: 'map' as const,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: 'test-user',
    permissions: {
      owner: 'test-user',
      ownerPermissions: 'rwx',
      publicPermissions: '---',
      inheritFromParent: true,
    },
    pois: createReactiveList([]),
    templates: createReactiveRecord(),
    schemas: createReactiveRecord(),
    images: createReactiveRecord({
      simulateAsyncLoading: options.simulateAsyncLoading,
      asyncLoadDelayMs: options.asyncLoadDelayMs,
    }),
    files: createReactiveRecord({
      simulateAsyncLoading: options.simulateAsyncLoading,
      asyncLoadDelayMs: options.asyncLoadDelayMs,
    }),
    icons: createReactiveRecord(),
    defaultTemplate: options.defaultTemplate,
    defaultSchema: options.defaultSchema,
    $jazz: createMockJazzAPI({ id }),
  };
}

/**
 * Options for createMapWithSyncImages (alias for backward compatibility)
 */
export interface MapWithSyncImagesOptions {
  name?: string;
  defaultTemplate?: string;
  defaultSchema?: string;
  /** Simulate async blob loading (page reload scenario) */
  simulateAsyncLoading?: boolean;
  /** Delay in ms before blobs become available */
  blobLoadDelayMs?: number;
}

/**
 * Create a map fixture with synchronous image/file collections
 *
 * Alias for createMapWithReactiveCollections with backward-compatible options.
 *
 * @param options - Configuration options
 * @returns Map fixture with reactive images and files collections
 *
 * @example
 * ```typescript
 * // Fast mode: For upload tests (images and blobs immediately available)
 * const map = createMapWithSyncImages({ name: "Test Map" });
 *
 * // Realistic mode: For page reload tests (images appear but blobs load async)
 * const map = createMapWithSyncImages({
 *   name: "Test Map",
 *   simulateAsyncLoading: true,
 *   blobLoadDelayMs: 150,
 * });
 * ```
 */
export function createMapWithSyncImages(options: MapWithSyncImagesOptions = {}) {
  return createMapWithReactiveCollections({
    name: options.name,
    defaultTemplate: options.defaultTemplate,
    defaultSchema: options.defaultSchema,
    simulateAsyncLoading: options.simulateAsyncLoading,
    asyncLoadDelayMs: options.blobLoadDelayMs,
  });
}

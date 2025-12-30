/**
 * Vitest setup utilities for Jazz mocking
 *
 * Provides helpers for setting up Jazz mocks in Vitest.
 */

import { vi } from 'vitest';
import { createFileStreamMock, fileStreamRegistry } from '../core/file-stream.js';
import { resetIdCounter } from '../core/id.js';
import { createJazzReactMocks, createJazzReactModuleMocks } from '../react/hooks.js';

/**
 * Create a complete jazz-tools module mock
 *
 * Mocks all commonly used jazz-tools exports:
 * - co.map(), co.list(), co.record(), co.profile(), co.account()
 * - z.* schema validators
 * - FileStream
 *
 * @returns Object suitable for vi.mock('jazz-tools')
 *
 * @example
 * ```typescript
 * vi.mock('jazz-tools', () => createJazzToolsMock());
 * ```
 */
export function createJazzToolsMock() {
  const createSchemaBuilder = () => ({
    optional: vi.fn(() => ({})),
    create: vi.fn(() => ({})),
  });

  const createMapBuilder = () => ({
    withMigration: vi.fn((_fn: unknown) => ({
      optional: vi.fn(() => ({})),
      create: vi.fn(() => ({})),
    })),
    optional: vi.fn(() => ({})),
    create: vi.fn(() => ({})),
  });

  return {
    useAccount: vi.fn(() => null),
    logout: vi.fn(),

    co: {
      map: vi.fn(() => createMapBuilder()),
      list: vi.fn(() => createSchemaBuilder()),
      record: vi.fn(() => createSchemaBuilder()),
      profile: vi.fn(() => createSchemaBuilder()),
      account: vi.fn(() => createMapBuilder()),
      fileStream: vi.fn(() => createSchemaBuilder()),
      optional: vi.fn((schema: unknown) => schema),
    },

    z: {
      string: vi.fn(() => ({ optional: vi.fn(), default: vi.fn() })),
      number: vi.fn(() => ({ optional: vi.fn(), default: vi.fn() })),
      boolean: vi.fn(() => ({ optional: vi.fn(), default: vi.fn() })),
      object: vi.fn(() => ({ optional: vi.fn() })),
      array: vi.fn(() => ({ optional: vi.fn() })),
      enum: vi.fn(() => ({ optional: vi.fn(), default: vi.fn() })),
      tuple: vi.fn(() => ({ optional: vi.fn() })),
      date: vi.fn(() => ({ optional: vi.fn() })),
      unknown: vi.fn(() => ({ optional: vi.fn() })),
      record: vi.fn(() => ({ optional: vi.fn() })),
      union: vi.fn(() => ({ optional: vi.fn() })),
      literal: vi.fn(() => ({ optional: vi.fn(), default: vi.fn() })),
      optional: vi.fn((schema: unknown) => schema),
    },

    FileStream: createFileStreamMock(),
  };
}

/**
 * Create co.* constructor mocks that return actual values
 *
 * Unlike createJazzToolsMock() which returns empty objects from .create(),
 * this returns constructors whose .create() methods return the actual
 * data passed to them. Useful for testing code that creates CoValues.
 *
 * @returns Object with co.list, co.record, co.map constructors
 *
 * @example
 * ```typescript
 * vi.mock("jazz-tools", () => ({
 *   co: createCoValueConstructorMocks(),
 * }));
 *
 * // In your code under test
 * const list = MyList.create(["a", "b"], { owner });
 * // list is now ["a", "b"] with $isLoaded and $jazz
 * ```
 */
export function createCoValueConstructorMocks() {
  return {
    list: vi.fn((_schema: unknown) => ({
      create: vi.fn((items: unknown[], _options: unknown) => {
        const result = Array.isArray(items) ? [...items] : [];
        Object.defineProperty(result, '$isLoaded', { value: true, enumerable: false });
        Object.defineProperty(result, '$jazz', {
          value: { push: vi.fn(), splice: vi.fn() },
          enumerable: false,
        });
        return result;
      }),
    })),

    record: vi.fn((_keySchema: unknown, _valueSchema: unknown) => ({
      create: vi.fn((obj: Record<string, unknown>, _options: unknown) => {
        const result = { ...obj, $isLoaded: true, $jazz: { set: vi.fn(), delete: vi.fn() } };
        return result;
      }),
    })),

    map: vi.fn((_schema: unknown) => ({
      create: vi.fn((data: Record<string, unknown>, _options: unknown) => {
        const result = { ...data, $isLoaded: true, $jazz: { set: vi.fn(), delete: vi.fn() } };
        return result;
      }),
    })),
  };
}

/**
 * Options for setupJazzMocks
 */
export interface SetupJazzMocksOptions {
  /** Reset ID counter before each test */
  resetIds?: boolean;
  /** Clear FileStream registry before each test */
  clearFileRegistry?: boolean;
  /** Reset React mocks before each test */
  resetReactMocks?: boolean;
}

/**
 * Set up Jazz mocks for Vitest
 *
 * Call this in your vitest setup file to configure all Jazz mocks.
 * It sets up beforeEach/afterEach hooks for proper cleanup.
 *
 * @param options - Configuration options
 * @returns Promise that resolves when setup is complete
 *
 * @example
 * ```typescript
 * // In vitest.setup.ts
 * import { setupJazzMocks } from 'jazz-mock/vitest';
 *
 * await setupJazzMocks();
 * ```
 *
 * @example
 * ```typescript
 * // With custom options
 * await setupJazzMocks({
 *   resetIds: true,
 *   clearFileRegistry: true,
 *   resetReactMocks: true,
 * });
 * ```
 */
export async function setupJazzMocks(options: SetupJazzMocksOptions = {}): Promise<void> {
  const { resetIds = true, clearFileRegistry = true, resetReactMocks = true } = options;

  // Import hooks dynamically to avoid circular dependencies
  const { resetJazzReactMocks } = await import('../react/hooks.js');

  // Access beforeEach from global scope (Vitest globals)
  const globalBeforeEach = (globalThis as Record<string, unknown>).beforeEach as
    | ((fn: () => void) => void)
    | undefined;

  if (typeof globalBeforeEach !== 'function') {
    console.warn(
      'jazz-mock: beforeEach not found in global scope. ' +
        'Ensure Vitest globals are enabled or call resetJazzMocks() manually in beforeEach.',
    );
    return;
  }

  globalBeforeEach(() => {
    if (resetIds) {
      resetIdCounter();
    }
    if (clearFileRegistry) {
      fileStreamRegistry.clear();
    }
    if (resetReactMocks) {
      resetJazzReactMocks();
    }
  });
}

/**
 * Vitest config preset for Jazz testing
 *
 * Merges with your existing Vitest config for optimal Jazz testing.
 *
 * @example
 * ```typescript
 * // vitest.config.ts
 * import { defineConfig, mergeConfig } from 'vitest/config';
 * import { jazzTestConfig } from 'jazz-mock/vitest';
 *
 * export default mergeConfig(jazzTestConfig, defineConfig({
 *   // Your custom config
 * }));
 * ```
 */
export const jazzTestConfig = {
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
  },
};

/**
 * Get all Jazz module mocks as an object
 *
 * Useful for setting up multiple mocks at once in your setup file.
 *
 * @returns Object with all Jazz mock factories
 *
 * @example
 * ```typescript
 * const { jazzTools, jazzReact, jazzToolsReact } = getJazzMocks();
 *
 * vi.mock('jazz-tools', () => jazzTools);
 * vi.mock('jazz-react', () => jazzReact);
 * vi.mock('jazz-tools/react', () => jazzToolsReact);
 * ```
 */
export function getJazzMocks() {
  return {
    jazzTools: createJazzToolsMock(),
    jazzReact: createJazzReactModuleMocks(),
    jazzToolsReact: createJazzReactMocks(),
  };
}

/**
 * Default patterns for Jazz-related console messages to suppress
 */
const DEFAULT_JAZZ_PATTERNS: RegExp[] = [
  /^\[Jazz\]/,
  /^Jazz:/,
  /Jazz initialization/i,
  /CoMap initialization warning/i,
  /CoList initialization warning/i,
  /^Warning: ReactDOM\.render is deprecated/,
  /^Warning: componentWillReceiveProps has been renamed/,
  /^Warning: componentWillMount has been renamed/,
];

/**
 * Options for createJazzConsoleFilter
 */
export interface JazzConsoleFilterOptions {
  /**
   * Additional patterns to suppress (extends default patterns)
   */
  additionalPatterns?: RegExp[];
  /**
   * Replace default patterns entirely instead of extending
   */
  replaceDefaults?: boolean;
}

/**
 * Console filter for suppressing Jazz-related noise in tests
 *
 * Jazz initialization can produce console warnings that clutter test output.
 * This filter suppresses known Jazz-related messages using specific patterns.
 *
 * @param options - Configuration options
 * @returns Object with filtered error and warn functions
 *
 * @example
 * ```typescript
 * // In setup.ts
 * import { createJazzConsoleFilter } from 'jazz-mock/vitest';
 *
 * const filter = createJazzConsoleFilter();
 *
 * global.console = {
 *   ...console,
 *   error: filter.error,
 *   warn: filter.warn,
 * };
 * ```
 *
 * @example
 * ```typescript
 * // With custom patterns
 * const filter = createJazzConsoleFilter({
 *   additionalPatterns: [/^MyApp:/],
 * });
 * ```
 */
export function createJazzConsoleFilter(options: JazzConsoleFilterOptions = {}) {
  const originalError = console.error;
  const originalWarn = console.warn;

  const patterns = options.replaceDefaults
    ? (options.additionalPatterns ?? [])
    : [...DEFAULT_JAZZ_PATTERNS, ...(options.additionalPatterns ?? [])];

  const shouldSuppress = (message: string): boolean => {
    return patterns.some((pattern) => pattern.test(message));
  };

  return {
    error: (...args: unknown[]) => {
      const message = String(args[0] ?? '');
      if (!shouldSuppress(message)) {
        originalError(...args);
      }
    },
    warn: (...args: unknown[]) => {
      const message = String(args[0] ?? '');
      if (!shouldSuppress(message)) {
        originalWarn(...args);
      }
    },
    /**
     * Get the patterns being used for filtering
     */
    getPatterns: () => [...patterns],
  };
}

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
 *
 * @example
 * ```typescript
 * // In vitest.setup.ts
 * import { setupJazzMocks } from 'jazz-mock/vitest';
 *
 * setupJazzMocks();
 * ```
 *
 * @example
 * ```typescript
 * // With custom options
 * setupJazzMocks({
 *   resetIds: true,
 *   clearFileRegistry: true,
 *   resetReactMocks: true,
 * });
 * ```
 */
export function setupJazzMocks(options: SetupJazzMocksOptions = {}): void {
  const { resetIds = true, clearFileRegistry = true, resetReactMocks = true } = options;

  // Import hooks dynamically to avoid circular dependencies
  import('../react/hooks.js').then(({ resetJazzReactMocks }) => {
    // Access beforeEach from global scope (Vitest globals)
    const globalBeforeEach = (globalThis as Record<string, unknown>).beforeEach as
      | ((fn: () => void) => void)
      | undefined;

    if (typeof globalBeforeEach === 'function') {
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
 * Console filter for suppressing Jazz-related noise in tests
 *
 * Jazz initialization can produce console warnings that clutter test output.
 * This filter suppresses known Jazz-related messages.
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
 */
export function createJazzConsoleFilter() {
  const originalError = console.error;
  const originalWarn = console.warn;

  const jazzPatterns = [
    'Jazz',
    'CoMap',
    'CoList',
    'account initialization',
    'Warning: ReactDOM.render',
    'componentWillReceiveProps',
  ];

  const shouldSuppress = (message: string): boolean => {
    return jazzPatterns.some((pattern) => message.includes(pattern));
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
  };
}

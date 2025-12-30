/**
 * Vitest integration for jazz-mock
 *
 * Provides setup utilities and custom matchers for testing Jazz applications.
 */

// Re-export cleanup utilities for convenience
export { clearBlobLoaderTimers } from '../core/reactive-collection.js';
export { jazzMatchers, registerJazzMatchers } from './matchers.js';
export {
  createCoValueConstructorMocks,
  createJazzConsoleFilter,
  createJazzToolsMock,
  getJazzMocks,
  type JazzConsoleFilterOptions,
  jazzTestConfig,
  type SetupJazzMocksOptions,
  setupJazzMocks,
} from './setup.js';

/**
 * Vitest integration for jazz-mock
 *
 * Provides setup utilities and custom matchers for testing Jazz applications.
 */

export { jazzMatchers, registerJazzMatchers } from './matchers.js';
export {
  createJazzConsoleFilter,
  createJazzToolsMock,
  getJazzMocks,
  jazzTestConfig,
  type SetupJazzMocksOptions,
  setupJazzMocks,
} from './setup.js';

/**
 * Vitest integration for jazz-mock
 *
 * Provides setup utilities and custom matchers for testing Jazz applications.
 */

export {
  createJazzToolsMock,
  setupJazzMocks,
  jazzTestConfig,
  getJazzMocks,
  createJazzConsoleFilter,
  type SetupJazzMocksOptions,
} from "./setup.js";

export { jazzMatchers, registerJazzMatchers } from "./matchers.js";

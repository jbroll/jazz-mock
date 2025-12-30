/**
 * React integration for jazz-mock
 *
 * Provides mock utilities for Jazz React hooks.
 */

export {
  mockUsePasskeyAuth,
  mockUseCoState,
  mockUseAccount,
  mockUseIsAuthenticated,
  resetJazzReactMocks,
  createJazzReactMocks,
  createJazzReactModuleMocks,
  getMockImplementations,
  type MockPasskeyAuthState,
  type MockAccountState,
} from "./hooks.js";

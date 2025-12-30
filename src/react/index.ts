/**
 * React integration for jazz-mock
 *
 * Provides mock utilities for Jazz React hooks.
 */

export {
  createJazzReactMocks,
  createJazzReactModuleMocks,
  getMockImplementations,
  type MockAccountState,
  type MockPasskeyAuthState,
  mockUseAccount,
  mockUseCoState,
  mockUseIsAuthenticated,
  mockUsePasskeyAuth,
  resetJazzReactMocks,
} from './hooks.js';

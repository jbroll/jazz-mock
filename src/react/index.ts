/**
 * React integration for jazz-mock
 *
 * Provides mock utilities for Jazz React hooks.
 */

export {
  createIsolatedMockContext,
  createJazzReactMocks,
  createJazzReactModuleMocks,
  getMockImplementations,
  type IsolatedMockContext,
  type MockAccountState,
  type MockPasskeyAuthState,
  mockUseAccount,
  mockUseCoState,
  mockUseIsAuthenticated,
  mockUsePasskeyAuth,
  resetJazzReactMocks,
} from './hooks.js';

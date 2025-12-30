/**
 * React hook mocks for jazz-tools/react
 *
 * Provides configurable mocks for Jazz React hooks:
 * - useAccount
 * - useCoState
 * - usePasskeyAuth
 * - useIsAuthenticated
 */

import { type Mock, vi } from 'vitest';

/**
 * Mock auth state for usePasskeyAuth
 */
export interface MockPasskeyAuthState {
  state: 'ready' | 'loading' | 'anonymous';
  logIn: Mock<() => void>;
}

/**
 * Mock account state for useAccount
 */
export interface MockAccountState {
  id?: string;
  profile?: {
    name?: string;
    displayName?: string;
  };
  root?: unknown;
  logOut?: Mock<() => void>;
  $jazz?: {
    id?: string;
    has?: Mock<(key: string) => boolean>;
    set?: Mock<(key: string, value: unknown) => void>;
  };
}

// Store for mock implementations
let mockUsePasskeyAuthImpl: () => MockPasskeyAuthState = () => ({
  state: 'loading',
  logIn: vi.fn(),
});

let mockUseCoStateImpl: () => unknown = () => null;

let mockUseAccountImpl: () => MockAccountState | undefined = () => ({
  logOut: vi.fn(),
});

let mockUseIsAuthenticatedImpl: () => boolean = () => false;

/**
 * Configure the usePasskeyAuth mock
 *
 * @param config - Auth state configuration
 *
 * @example
 * ```typescript
 * // User is ready to authenticate
 * mockUsePasskeyAuth({ state: "ready" });
 *
 * // User is anonymous
 * mockUsePasskeyAuth({ state: "anonymous" });
 *
 * // With custom logIn handler
 * const logIn = vi.fn();
 * mockUsePasskeyAuth({ state: "ready", logIn });
 * ```
 */
export function mockUsePasskeyAuth(config: {
  state: 'ready' | 'loading' | 'anonymous';
  logIn?: Mock<() => void>;
}): void {
  mockUsePasskeyAuthImpl = () => ({
    state: config.state,
    logIn: config.logIn ?? vi.fn(),
  });
}

/**
 * Configure the useCoState mock
 *
 * @param data - CoValue data to return, or null for loading state
 *
 * @example
 * ```typescript
 * // Return mock data
 * mockUseCoState({ id: 'test', items: [] });
 *
 * // Return null (loading state)
 * mockUseCoState(null);
 * ```
 */
export function mockUseCoState<T>(data: T | null): void {
  mockUseCoStateImpl = () => data;
}

/**
 * Configure the useAccount mock
 *
 * @param account - Account data to return, or undefined for unauthenticated
 *
 * @example
 * ```typescript
 * // Authenticated user
 * mockUseAccount({
 *   id: 'account-123',
 *   profile: { name: 'Test User' },
 *   root: { folders: [] },
 * });
 *
 * // Unauthenticated
 * mockUseAccount(undefined);
 * ```
 */
export function mockUseAccount(account: MockAccountState | undefined): void {
  mockUseAccountImpl = () =>
    account
      ? {
          ...account,
          logOut: account.logOut ?? vi.fn(),
        }
      : undefined;
}

/**
 * Configure the useIsAuthenticated mock
 *
 * @param isAuthenticated - Whether user is authenticated
 *
 * @example
 * ```typescript
 * mockUseIsAuthenticated(true);
 * mockUseIsAuthenticated(false);
 * ```
 */
export function mockUseIsAuthenticated(isAuthenticated: boolean): void {
  mockUseIsAuthenticatedImpl = () => isAuthenticated;
}

/**
 * Reset all Jazz React mocks to default state
 *
 * Call this in afterEach() to ensure clean state between tests.
 *
 * @example
 * ```typescript
 * afterEach(() => {
 *   resetJazzReactMocks();
 * });
 * ```
 */
export function resetJazzReactMocks(): void {
  mockUsePasskeyAuthImpl = () => ({
    state: 'loading',
    logIn: vi.fn(),
  });
  mockUseCoStateImpl = () => null;
  mockUseAccountImpl = () => ({
    logOut: vi.fn(),
  });
  mockUseIsAuthenticatedImpl = () => false;
}

/**
 * Get the current mock implementations
 *
 * Used internally by createJazzReactMocks() to create the vi.mock factory.
 *
 * @returns Object with hook implementation getters
 */
export function getMockImplementations(): {
  usePasskeyAuth: () => MockPasskeyAuthState;
  useCoState: () => unknown;
  useAccount: () => MockAccountState | undefined;
  useIsAuthenticated: () => boolean;
} {
  return {
    usePasskeyAuth: () => mockUsePasskeyAuthImpl(),
    useCoState: () => mockUseCoStateImpl(),
    useAccount: () => mockUseAccountImpl(),
    useIsAuthenticated: () => mockUseIsAuthenticatedImpl(),
  };
}

/**
 * Isolated mock context interface
 */
export interface IsolatedMockContext {
  /** Configure the usePasskeyAuth mock for this context */
  mockUsePasskeyAuth(config: {
    state: 'ready' | 'loading' | 'anonymous';
    logIn?: Mock<() => void>;
  }): void;
  /** Configure the useCoState mock for this context */
  mockUseCoState<T>(data: T | null): void;
  /** Configure the useAccount mock for this context */
  mockUseAccount(account: MockAccountState | undefined): void;
  /** Configure the useIsAuthenticated mock for this context */
  mockUseIsAuthenticated(isAuthenticated: boolean): void;
  /** Reset this context to default state */
  reset(): void;
  /** Get the current implementations for this context */
  getImplementations(): {
    usePasskeyAuth: () => MockPasskeyAuthState;
    useCoState: () => unknown;
    useAccount: () => MockAccountState | undefined;
    useIsAuthenticated: () => boolean;
  };
  /** Create vi.mock factory for this context */
  createMocks(): {
    usePasskeyAuth: Mock<() => MockPasskeyAuthState>;
    useCoState: Mock<() => unknown>;
    useAccount: Mock<() => MockAccountState | undefined>;
    useIsAuthenticated: Mock<() => boolean>;
  };
}

/**
 * Isolated mock context for parallel test execution
 *
 * Creates a fresh set of mock implementations that don't share state
 * with other tests. Use this when running tests in parallel to avoid
 * test pollution.
 *
 * @returns Object with mock configuration functions and hook implementations
 *
 * @example
 * ```typescript
 * // In a test file
 * const context = createIsolatedMockContext();
 *
 * // Configure mocks for this context only
 * context.mockUseAccount({ id: 'test', profile: { name: 'Test' } });
 *
 * // Get mocks for vi.mock
 * vi.mock('jazz-tools/react', () => context.createMocks());
 * ```
 */
export function createIsolatedMockContext(): IsolatedMockContext {
  let usePasskeyAuthImpl: () => MockPasskeyAuthState = () => ({
    state: 'loading',
    logIn: vi.fn(),
  });

  let useCoStateImpl: () => unknown = () => null;

  let useAccountImpl: () => MockAccountState | undefined = () => ({
    logOut: vi.fn(),
  });

  let useIsAuthenticatedImpl: () => boolean = () => false;

  return {
    /**
     * Configure the usePasskeyAuth mock for this context
     */
    mockUsePasskeyAuth(config: {
      state: 'ready' | 'loading' | 'anonymous';
      logIn?: Mock<() => void>;
    }): void {
      usePasskeyAuthImpl = () => ({
        state: config.state,
        logIn: config.logIn ?? vi.fn(),
      });
    },

    /**
     * Configure the useCoState mock for this context
     */
    mockUseCoState<T>(data: T | null): void {
      useCoStateImpl = () => data;
    },

    /**
     * Configure the useAccount mock for this context
     */
    mockUseAccount(account: MockAccountState | undefined): void {
      useAccountImpl = () =>
        account
          ? {
              ...account,
              logOut: account.logOut ?? vi.fn(),
            }
          : undefined;
    },

    /**
     * Configure the useIsAuthenticated mock for this context
     */
    mockUseIsAuthenticated(isAuthenticated: boolean): void {
      useIsAuthenticatedImpl = () => isAuthenticated;
    },

    /**
     * Reset this context to default state
     */
    reset(): void {
      usePasskeyAuthImpl = () => ({ state: 'loading', logIn: vi.fn() });
      useCoStateImpl = () => null;
      useAccountImpl = () => ({ logOut: vi.fn() });
      useIsAuthenticatedImpl = () => false;
    },

    /**
     * Get the current implementations for this context
     */
    getImplementations() {
      return {
        usePasskeyAuth: () => usePasskeyAuthImpl(),
        useCoState: () => useCoStateImpl(),
        useAccount: () => useAccountImpl(),
        useIsAuthenticated: () => useIsAuthenticatedImpl(),
      };
    },

    /**
     * Create vi.mock factory for this context
     */
    createMocks() {
      return {
        usePasskeyAuth: vi.fn(() => usePasskeyAuthImpl()),
        useCoState: vi.fn(() => useCoStateImpl()),
        useAccount: vi.fn(() => useAccountImpl()),
        useIsAuthenticated: vi.fn(() => useIsAuthenticatedImpl()),
      };
    },
  };
}

/**
 * Create a vi.mock factory for jazz-tools/react
 *
 * Use this in your test setup to mock all Jazz React hooks.
 *
 * @returns Object suitable for vi.mock('jazz-tools/react')
 *
 * @example
 * ```typescript
 * // In setup.ts or at top of test file
 * vi.mock('jazz-tools/react', () => createJazzReactMocks());
 *
 * // In tests
 * mockUseAccount({ id: 'test', profile: { name: 'Test' } });
 * render(<MyComponent />);
 * ```
 */
export function createJazzReactMocks() {
  return {
    usePasskeyAuth: vi.fn(() => getMockImplementations().usePasskeyAuth()),
    useCoState: vi.fn(() => getMockImplementations().useCoState()),
    useAccount: vi.fn(() => getMockImplementations().useAccount()),
    useIsAuthenticated: vi.fn(() => getMockImplementations().useIsAuthenticated()),
  };
}

/**
 * Create a vi.mock factory for jazz-react (alternative import path)
 *
 * Some projects use 'jazz-react' instead of 'jazz-tools/react'.
 *
 * @returns Object suitable for vi.mock('jazz-react')
 */
export function createJazzReactModuleMocks() {
  return {
    ...createJazzReactMocks(),
    DemoAuth: vi.fn(() => null),
    DemoAuthBasicUI: vi.fn(() => null),
  };
}

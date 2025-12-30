import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createIsolatedMockContext,
  createJazzReactMocks,
  getMockImplementations,
  mockUseAccount,
  mockUseCoState,
  mockUseIsAuthenticated,
  mockUsePasskeyAuth,
  resetJazzReactMocks,
} from './hooks.js';

describe('mockUsePasskeyAuth', () => {
  beforeEach(() => {
    resetJazzReactMocks();
  });

  it('sets auth state to ready', () => {
    mockUsePasskeyAuth({ state: 'ready' });
    const impl = getMockImplementations();

    expect(impl.usePasskeyAuth().state).toBe('ready');
  });

  it('sets auth state to anonymous', () => {
    mockUsePasskeyAuth({ state: 'anonymous' });
    const impl = getMockImplementations();

    expect(impl.usePasskeyAuth().state).toBe('anonymous');
  });

  it('includes logIn function', () => {
    mockUsePasskeyAuth({ state: 'ready' });
    const impl = getMockImplementations();

    expect(impl.usePasskeyAuth().logIn).toBeDefined();
    expect(typeof impl.usePasskeyAuth().logIn).toBe('function');
  });
});

describe('mockUseCoState', () => {
  beforeEach(() => {
    resetJazzReactMocks();
  });

  it('returns mock data', () => {
    const mockData = { id: 'test', items: [1, 2, 3] };
    mockUseCoState(mockData);

    const impl = getMockImplementations();
    expect(impl.useCoState()).toEqual(mockData);
  });

  it('returns null for loading state', () => {
    mockUseCoState(null);

    const impl = getMockImplementations();
    expect(impl.useCoState()).toBeNull();
  });
});

describe('mockUseAccount', () => {
  beforeEach(() => {
    resetJazzReactMocks();
  });

  it('returns mock account', () => {
    mockUseAccount({
      id: 'account-123',
      profile: { name: 'Test User' },
    });

    const impl = getMockImplementations();
    const account = impl.useAccount();

    expect(account?.id).toBe('account-123');
    expect(account?.profile?.name).toBe('Test User');
  });

  it('returns undefined for unauthenticated', () => {
    mockUseAccount(undefined);

    const impl = getMockImplementations();
    expect(impl.useAccount()).toBeUndefined();
  });

  it('includes logOut function', () => {
    mockUseAccount({ id: 'test' });

    const impl = getMockImplementations();
    expect(impl.useAccount()?.logOut).toBeDefined();
  });
});

describe('mockUseIsAuthenticated', () => {
  beforeEach(() => {
    resetJazzReactMocks();
  });

  it('returns true when authenticated', () => {
    mockUseIsAuthenticated(true);

    const impl = getMockImplementations();
    expect(impl.useIsAuthenticated()).toBe(true);
  });

  it('returns false when not authenticated', () => {
    mockUseIsAuthenticated(false);

    const impl = getMockImplementations();
    expect(impl.useIsAuthenticated()).toBe(false);
  });
});

describe('resetJazzReactMocks', () => {
  it('resets to default state', () => {
    // Set custom values
    mockUsePasskeyAuth({ state: 'ready' });
    mockUseCoState({ data: 'test' });
    mockUseAccount({ id: 'custom' });
    mockUseIsAuthenticated(true);

    // Reset
    resetJazzReactMocks();

    // Check defaults
    const impl = getMockImplementations();
    expect(impl.usePasskeyAuth().state).toBe('loading');
    expect(impl.useCoState()).toBeNull();
    expect(impl.useAccount()?.logOut).toBeDefined(); // Default has logOut
    expect(impl.useIsAuthenticated()).toBe(false);
  });
});

describe('createJazzReactMocks', () => {
  beforeEach(() => {
    resetJazzReactMocks();
  });

  it('creates mock module with all hooks', () => {
    const mocks = createJazzReactMocks();

    expect(mocks.usePasskeyAuth).toBeDefined();
    expect(mocks.useCoState).toBeDefined();
    expect(mocks.useAccount).toBeDefined();
    expect(mocks.useIsAuthenticated).toBeDefined();
  });

  it('hooks return values from getMockImplementations', () => {
    mockUseAccount({ id: 'test-account' });

    const mocks = createJazzReactMocks();
    const account = mocks.useAccount();

    expect(account?.id).toBe('test-account');
  });

  it('hooks are spy functions', () => {
    const mocks = createJazzReactMocks();

    mocks.useAccount();
    expect(mocks.useAccount).toHaveBeenCalled();
  });
});

describe('createIsolatedMockContext', () => {
  it('creates an isolated context with all mock functions', () => {
    const context = createIsolatedMockContext();

    expect(context.mockUsePasskeyAuth).toBeDefined();
    expect(context.mockUseCoState).toBeDefined();
    expect(context.mockUseAccount).toBeDefined();
    expect(context.mockUseIsAuthenticated).toBeDefined();
    expect(context.reset).toBeDefined();
    expect(context.getImplementations).toBeDefined();
    expect(context.createMocks).toBeDefined();
  });

  it('does not share state with global mocks', () => {
    const context = createIsolatedMockContext();

    // Set global mock
    mockUseAccount({ id: 'global-account' });

    // Set context mock
    context.mockUseAccount({ id: 'context-account' });

    // They should be independent
    const globalImpl = getMockImplementations();
    const contextImpl = context.getImplementations();

    expect(globalImpl.useAccount()?.id).toBe('global-account');
    expect(contextImpl.useAccount()?.id).toBe('context-account');
  });

  it('contexts are independent from each other', () => {
    const context1 = createIsolatedMockContext();
    const context2 = createIsolatedMockContext();

    context1.mockUseAccount({ id: 'context-1' });
    context2.mockUseAccount({ id: 'context-2' });

    expect(context1.getImplementations().useAccount()?.id).toBe('context-1');
    expect(context2.getImplementations().useAccount()?.id).toBe('context-2');
  });

  it('mockUsePasskeyAuth sets state correctly', () => {
    const context = createIsolatedMockContext();

    context.mockUsePasskeyAuth({ state: 'ready' });

    expect(context.getImplementations().usePasskeyAuth().state).toBe('ready');
  });

  it('mockUsePasskeyAuth accepts custom logIn function', () => {
    const context = createIsolatedMockContext();
    const customLogIn = vi.fn();

    context.mockUsePasskeyAuth({ state: 'ready', logIn: customLogIn });

    const result = context.getImplementations().usePasskeyAuth();
    expect(result.logIn).toBe(customLogIn);
  });

  it('mockUseCoState sets data correctly', () => {
    const context = createIsolatedMockContext();
    const testData = { id: 'test', items: [1, 2, 3] };

    context.mockUseCoState(testData);

    expect(context.getImplementations().useCoState()).toEqual(testData);
  });

  it('mockUseCoState handles null', () => {
    const context = createIsolatedMockContext();

    context.mockUseCoState(null);

    expect(context.getImplementations().useCoState()).toBeNull();
  });

  it('mockUseAccount adds logOut if not provided', () => {
    const context = createIsolatedMockContext();

    context.mockUseAccount({ id: 'test' });

    const account = context.getImplementations().useAccount();
    expect(account?.logOut).toBeDefined();
    expect(typeof account?.logOut).toBe('function');
  });

  it('mockUseAccount preserves custom logOut', () => {
    const context = createIsolatedMockContext();
    const customLogOut = vi.fn();

    context.mockUseAccount({ id: 'test', logOut: customLogOut });

    expect(context.getImplementations().useAccount()?.logOut).toBe(customLogOut);
  });

  it('mockUseAccount handles undefined for unauthenticated', () => {
    const context = createIsolatedMockContext();

    context.mockUseAccount(undefined);

    expect(context.getImplementations().useAccount()).toBeUndefined();
  });

  it('mockUseIsAuthenticated sets boolean correctly', () => {
    const context = createIsolatedMockContext();

    context.mockUseIsAuthenticated(true);
    expect(context.getImplementations().useIsAuthenticated()).toBe(true);

    context.mockUseIsAuthenticated(false);
    expect(context.getImplementations().useIsAuthenticated()).toBe(false);
  });

  it('reset restores default state', () => {
    const context = createIsolatedMockContext();

    // Set custom values
    context.mockUsePasskeyAuth({ state: 'ready' });
    context.mockUseCoState({ data: 'test' });
    context.mockUseAccount({ id: 'custom' });
    context.mockUseIsAuthenticated(true);

    // Reset
    context.reset();

    // Check defaults
    const impl = context.getImplementations();
    expect(impl.usePasskeyAuth().state).toBe('loading');
    expect(impl.useCoState()).toBeNull();
    expect(impl.useAccount()?.logOut).toBeDefined();
    expect(impl.useIsAuthenticated()).toBe(false);
  });

  it('createMocks returns vi.mock compatible object', () => {
    const context = createIsolatedMockContext();
    context.mockUseAccount({ id: 'test-id' });

    const mocks = context.createMocks();

    expect(mocks.usePasskeyAuth).toBeDefined();
    expect(mocks.useCoState).toBeDefined();
    expect(mocks.useAccount).toBeDefined();
    expect(mocks.useIsAuthenticated).toBeDefined();

    // Mocks should return context values
    expect(mocks.useAccount()?.id).toBe('test-id');
  });

  it('createMocks returns spy functions', () => {
    const context = createIsolatedMockContext();
    const mocks = context.createMocks();

    mocks.useAccount();
    mocks.useAccount();

    expect(mocks.useAccount).toHaveBeenCalledTimes(2);
  });
});

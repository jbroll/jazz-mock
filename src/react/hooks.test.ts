import { beforeEach, describe, expect, it } from 'vitest';
import {
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

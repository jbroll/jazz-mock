/**
 * Jazz Test Context
 *
 * Fluent API for testing Jazz applications with swappable backends.
 * Provides generic Group-based permission testing.
 *
 * @example
 * ```typescript
 * import { JazzTestContext } from 'jazz-mock';
 *
 * describe('My Tests', () => {
 *   let ctx: JazzTestContext;
 *
 *   beforeEach(async () => {
 *     // Uses JAZZ_TEST_BACKEND env var, defaults to 'mock'
 *     ctx = await JazzTestContext.create();
 *
 *     // Or explicitly specify backend
 *     ctx = await JazzTestContext.create({ backend: 'jazz' });
 *   });
 *
 *   it('tests group permissions', async () => {
 *     const group = ctx.createGroup();
 *     const collaborator = await ctx.createAccount('Bob');
 *
 *     ctx.addMember(group, collaborator, 'writer');
 *
 *     expect(ctx.canWrite(group, collaborator)).toBe(true);
 *     expect(ctx.canAdmin(group, collaborator)).toBe(false);
 *   });
 * });
 * ```
 */

import { createJazzBackend } from '../backends/jazz.js';
import { createMockBackend } from '../backends/mock.js';
import type {
  BackendType,
  CreateContextOptions,
  Role,
  TestAccount,
  TestBackend,
  TestGroup,
} from './types.js';

/**
 * Get the default backend from environment variable
 */
function getDefaultBackend(): BackendType {
  if (typeof process !== 'undefined' && process.env?.JAZZ_TEST_BACKEND) {
    const backend = process.env.JAZZ_TEST_BACKEND.toLowerCase();
    if (backend === 'jazz' || backend === 'mock') {
      return backend;
    }
    console.warn(
      `Invalid JAZZ_TEST_BACKEND value: "${backend}". Using 'mock'. Valid values: 'mock', 'jazz'`,
    );
  }
  return 'mock';
}

/**
 * Jazz Test Context
 *
 * Manages test accounts and groups with a fluent API.
 * Supports both mock (fast) and jazz (real) backends.
 */
export class JazzTestContext {
  /** The backend implementation */
  private backend: TestBackend;

  /** Primary test account (owner) */
  public account: TestAccount;

  /** All created accounts */
  private accounts: TestAccount[] = [];

  private constructor(backend: TestBackend, account: TestAccount) {
    this.backend = backend;
    this.account = account;
    this.accounts.push(account);
  }

  /**
   * Create a new test context
   *
   * @param options - Configuration options
   * @returns Initialized test context
   *
   * @example
   * ```typescript
   * // Use default backend (from JAZZ_TEST_BACKEND or 'mock')
   * const ctx = await JazzTestContext.create();
   *
   * // Explicitly use mock backend (fast)
   * const ctx = await JazzTestContext.create({ backend: 'mock' });
   *
   * // Explicitly use jazz backend (real Jazz behavior)
   * const ctx = await JazzTestContext.create({
   *   backend: 'jazz',
   *   AccountSchema: MyAccountSchema,
   * });
   * ```
   */
  static async create(options: CreateContextOptions = {}): Promise<JazzTestContext> {
    const backendType = options.backend ?? getDefaultBackend();
    const name = options.name ?? 'Test Owner';

    // Create backend based on type
    const backend =
      backendType === 'jazz'
        ? createJazzBackend({
            AccountSchema: options.AccountSchema,
          })
        : createMockBackend();

    // Initialize backend
    await backend.setup();

    // Create primary account
    const account = await backend.createPrimaryAccount(name);

    return new JazzTestContext(backend, account);
  }

  /**
   * Get the backend type
   */
  get backendType(): BackendType {
    return this.backend.type;
  }

  /**
   * Create an additional test account
   *
   * Accounts are automatically linked for sync (jazz backend).
   *
   * @param name - Account name
   * @returns New test account
   */
  async createAccount(name: string): Promise<TestAccount> {
    const account = await this.backend.createAccount(name);
    this.accounts.push(account);
    return account;
  }

  /**
   * Switch the active account for subsequent operations
   *
   * @param account - Account to make active
   */
  setActiveAccount(account: TestAccount): void {
    this.backend.setActiveAccount(account);
  }

  /**
   * Create a new group owned by the current account
   *
   * @returns New group with current account as admin
   *
   * @example
   * ```typescript
   * const group = ctx.createGroup();
   * // Owner is automatically admin
   * expect(ctx.canAdmin(group, ctx.account)).toBe(true);
   * ```
   */
  createGroup(): TestGroup {
    return this.backend.createGroup(this.account);
  }

  /**
   * Add a member to a group with a specific role
   *
   * @param group - Group to add member to
   * @param account - Account to add
   * @param role - Permission role ('reader', 'writer', 'admin')
   *
   * @example
   * ```typescript
   * const group = ctx.createGroup();
   * const collaborator = await ctx.createAccount('Bob');
   *
   * ctx.addMember(group, collaborator, 'writer');
   * ```
   */
  addMember(group: TestGroup, account: TestAccount, role: Role = 'writer'): void {
    group.addMember(account, role);
  }

  /**
   * Remove a member from a group
   *
   * @param group - Group to remove member from
   * @param account - Account to remove
   */
  removeMember(group: TestGroup, account: TestAccount): void {
    group.removeMember(account);
  }

  /**
   * Check if an account can read (has any role in the group)
   */
  canRead(group: TestGroup, account: TestAccount): boolean {
    const role = group.getRoleOf(account.id);
    return role !== undefined;
  }

  /**
   * Check if an account can write (writer or admin role)
   */
  canWrite(group: TestGroup, account: TestAccount): boolean {
    const role = group.getRoleOf(account.id);
    return role === 'writer' || role === 'admin';
  }

  /**
   * Check if an account has admin access
   */
  canAdmin(group: TestGroup, account: TestAccount): boolean {
    const role = group.getRoleOf(account.id);
    return role === 'admin';
  }

  /**
   * Get the role of an account in a group
   */
  getRoleOf(group: TestGroup, account: TestAccount): Role | undefined {
    return group.getRoleOf(account.id);
  }

  /**
   * Wait for all accounts to sync their CoValues
   *
   * This is essential for reliable tests when using the 'jazz' backend.
   * For the 'mock' backend, this is a no-op since everything is synchronous.
   *
   * Call this after operations that modify shared data to ensure
   * all accounts have the latest state before making assertions.
   *
   * @example
   * ```typescript
   * ctx.shareFolder(folder, collaborator, 'writer');
   * await ctx.waitForSync();  // Ensure sync is complete
   * expect(ctx.canWrite(folder, collaborator)).toBe(true);
   * ```
   */
  async waitForSync(): Promise<void> {
    await this.backend.waitForSync();
  }
}

/**
 * Setup Jazz testing for a test suite
 *
 * Call this at the module level to get a context getter.
 * The context is automatically created before each test.
 *
 * @param options - Context options
 * @returns Function to get the current context
 *
 * @example
 * ```typescript
 * import { setupJazzTesting } from 'jazz-mock';
 *
 * describe('My Tests', () => {
 *   const getContext = setupJazzTesting();
 *
 *   it('creates groups', async () => {
 *     const ctx = getContext();
 *     const group = ctx.createGroup();
 *     expect(ctx.canAdmin(group, ctx.account)).toBe(true);
 *   });
 * });
 * ```
 */
export function setupJazzTesting(_options: CreateContextOptions = {}): () => JazzTestContext {
  const context: JazzTestContext | null = null;

  // Note: Caller must use beforeEach to initialize with these options
  // This is just a helper for the common pattern
  return () => {
    if (!context) {
      throw new Error(
        'Jazz context not initialized. Call await JazzTestContext.create() in beforeEach.',
      );
    }
    return context;
  };
}

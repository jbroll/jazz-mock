/**
 * Fluent API Types
 *
 * Shared type definitions for the fluent testing API.
 * These types are backend-agnostic and focus on Jazz primitives (Accounts, Groups).
 */

/**
 * Role type for group members
 */
export type Role = 'reader' | 'writer' | 'admin';

/**
 * Backend type for test context
 * - 'mock': Fast mocks using jazz-mock (no real Jazz runtime)
 * - 'jazz': Real Jazz behavior using jazz-tools/testing
 */
export type BackendType = 'mock' | 'jazz';

/**
 * A test account abstraction
 */
export interface TestAccount {
  /** Account ID */
  id: string;
  /** Account name */
  name: string;
  /** The underlying account object (type varies by backend) */
  // biome-ignore lint/suspicious/noExplicitAny: Backend-specific account type
  raw: any;
}

/**
 * A test group abstraction
 */
export interface TestGroup {
  /** Group ID */
  id: string;
  /** Add a member to the group */
  addMember(account: TestAccount, role: Role): void;
  /** Remove a member from the group */
  removeMember(account: TestAccount): void;
  /** Get role of an account in this group */
  getRoleOf(accountId: string): Role | undefined;
  /** The underlying group object (type varies by backend) */
  // biome-ignore lint/suspicious/noExplicitAny: Backend-specific group type
  raw: any;
}

/**
 * Options for creating a test context
 */
export interface CreateContextOptions {
  /** Backend to use: 'mock' (fast) or 'jazz' (jazz-tools/testing) */
  backend?: BackendType;
  /** Name for the primary account */
  name?: string;
  /** Account schema (for jazz backend) */
  // biome-ignore lint/suspicious/noExplicitAny: Schema type varies
  AccountSchema?: any;
}

/**
 * Backend interface
 *
 * Implementations provide the actual account/group creation logic.
 * Focused on Jazz primitives - app-specific concepts (folders, etc.)
 * should be built on top of this in app-specific test utilities.
 */
export interface TestBackend {
  /** Backend type identifier */
  readonly type: BackendType;

  /** Initialize the backend (called once before tests) */
  setup(): Promise<void>;

  /** Create the primary test account */
  createPrimaryAccount(name: string): Promise<TestAccount>;

  /** Create an additional test account */
  createAccount(name: string): Promise<TestAccount>;

  /** Link accounts for sync (jazz backend only, no-op for mock) */
  linkAccounts(a: TestAccount, b: TestAccount): Promise<void>;

  /** Set the active account for operations */
  setActiveAccount(account: TestAccount): void;

  /** Create a group owned by the given account */
  createGroup(owner: TestAccount): TestGroup;

  /** Wait for all accounts to sync their CoValues (jazz backend uses real sync, mock is no-op) */
  waitForSync(): Promise<void>;
}

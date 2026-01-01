/**
 * Jazz Backend
 *
 * Real Jazz implementation using jazz-tools/testing.
 * Provides actual Jazz behavior including Groups, permissions, and sync.
 *
 * Requires jazz-tools as a peer dependency.
 */

import type { Role, TestAccount, TestBackend, TestGroup } from '../fluent/types.js';

// Dynamic imports for jazz-tools (peer dependency)
// biome-ignore lint/suspicious/noExplicitAny: Dynamic import types
let jazzTools: any;
// biome-ignore lint/suspicious/noExplicitAny: Dynamic import types
let jazzTesting: any;

/**
 * Lazily load jazz-tools modules
 */
async function loadJazzTools() {
  if (!jazzTools) {
    try {
      // @ts-expect-error - jazz-tools is an optional peer dependency
      jazzTools = await import('jazz-tools');
    } catch (_e) {
      throw new Error(
        'jazz-tools is required for the jazz backend. Install it with: npm install jazz-tools',
      );
    }
  }
  if (!jazzTesting) {
    try {
      // @ts-expect-error - jazz-tools is an optional peer dependency
      jazzTesting = await import('jazz-tools/testing');
    } catch (_e) {
      throw new Error(
        'jazz-tools/testing is required for the jazz backend. Make sure jazz-tools is installed.',
      );
    }
  }
  return { jazzTools, jazzTesting };
}

/**
 * Wrap a Jazz account in the TestAccount interface
 */
// biome-ignore lint/suspicious/noExplicitAny: Jazz account type varies
function wrapAccount(raw: any, name: string): TestAccount {
  return {
    id: raw.$jazz?.id ?? raw.id,
    name,
    raw,
  };
}

/**
 * Wrap a Jazz Group in the TestGroup interface
 */
// biome-ignore lint/suspicious/noExplicitAny: Jazz Group type varies
function wrapGroup(raw: any): TestGroup {
  return {
    id: raw.$jazz?.id ?? raw.id,
    raw,
    addMember(account: TestAccount, role: Role) {
      raw.addMember(account.raw, role);
    },
    removeMember(account: TestAccount) {
      raw.removeMember(account.raw);
    },
    getRoleOf(accountId: string): Role | undefined {
      return raw.getRoleOf(accountId);
    },
  };
}

/**
 * Options for creating the Jazz backend
 */
export interface JazzBackendOptions {
  /** Account schema (required for jazz backend) */
  // biome-ignore lint/suspicious/noExplicitAny: Schema type varies
  AccountSchema?: any;
}

/**
 * Create Jazz backend
 */
export function createJazzBackend(options: JazzBackendOptions = {}): TestBackend {
  const accounts: TestAccount[] = [];
  // biome-ignore lint/suspicious/noExplicitAny: Jazz module types
  let Group: any;

  return {
    type: 'jazz',

    async setup() {
      const { jazzTools, jazzTesting } = await loadJazzTools();
      Group = jazzTools.Group;

      await jazzTesting.setupJazzTestSync();
    },

    async createPrimaryAccount(name: string): Promise<TestAccount> {
      const { jazzTesting } = await loadJazzTools();

      const AccountSchema = options.AccountSchema;
      if (!AccountSchema) {
        throw new Error('AccountSchema is required for jazz backend');
      }

      const raw = await jazzTesting.createJazzTestAccount({
        AccountSchema,
        isCurrentActiveAccount: true,
        creationProps: { name },
      });

      const account = wrapAccount(raw, name);
      accounts.push(account);
      return account;
    },

    async createAccount(name: string): Promise<TestAccount> {
      const { jazzTesting } = await loadJazzTools();

      const AccountSchema = options.AccountSchema;
      if (!AccountSchema) {
        throw new Error('AccountSchema is required for jazz backend');
      }

      const raw = await jazzTesting.createJazzTestAccount({
        AccountSchema,
        creationProps: { name },
      });

      const account = wrapAccount(raw, name);

      // Link with all existing accounts
      for (const existing of accounts) {
        await jazzTesting.linkAccounts(existing.raw, raw);
      }

      accounts.push(account);
      return account;
    },

    async linkAccounts(a: TestAccount, b: TestAccount): Promise<void> {
      const { jazzTesting } = await loadJazzTools();
      await jazzTesting.linkAccounts(a.raw, b.raw);
    },

    setActiveAccount(account: TestAccount): void {
      // Use the cached module-level jazzTesting
      jazzTesting?.setActiveAccount?.(account.raw);
    },

    createGroup(_owner: TestAccount): TestGroup {
      // In Jazz, Group.create() uses the active account as owner
      const raw = Group.create();
      return wrapGroup(raw);
    },
  };
}

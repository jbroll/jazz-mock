/**
 * Mock Backend
 *
 * Fast mock implementation using jazz-mock primitives.
 * No real Jazz runtime - pure JavaScript mocks.
 */

import { createMockAccount, createMockGroup } from '../core/account.js';
import { createMockCoList, createMockCoMap } from '../core/covalue.js';
import type { Role, TestAccount, TestBackend, TestGroup } from '../fluent/types.js';

/**
 * Wrap a mock account in the TestAccount interface
 */
function wrapAccount(raw: ReturnType<typeof createMockAccount>, name: string): TestAccount {
  return {
    id: raw.id,
    name,
    raw,
  };
}

/**
 * Wrap a mock group in the TestGroup interface
 */
function wrapGroup(raw: ReturnType<typeof createMockGroup>): TestGroup {
  // Track roles for each member
  const roles = new Map<string, Role>();

  return {
    id: raw.id,
    raw,
    addMember(account: TestAccount, role: Role) {
      raw.addMember({ id: account.id });
      roles.set(account.id, role);
    },
    removeMember(account: TestAccount) {
      raw.removeMember(account.id);
      roles.delete(account.id);
    },
    getRoleOf(accountId: string): Role | undefined {
      return roles.get(accountId);
    },
  };
}

/**
 * Create mock backend
 */
export function createMockBackend(): TestBackend {
  return {
    type: 'mock',

    async setup() {
      // No setup needed for mock backend
    },

    async createPrimaryAccount(name: string): Promise<TestAccount> {
      const folders = createMockCoList([], { trackMutations: true });
      const root = createMockCoMap({ folders }, { trackMutations: true });
      const raw = createMockAccount({ name, root, trackMutations: true });
      return wrapAccount(raw, name);
    },

    async createAccount(name: string): Promise<TestAccount> {
      const folders = createMockCoList([], { trackMutations: true });
      const root = createMockCoMap({ folders }, { trackMutations: true });
      const raw = createMockAccount({ name, root, trackMutations: true });
      return wrapAccount(raw, name);
    },

    async linkAccounts(_a: TestAccount, _b: TestAccount): Promise<void> {
      // No-op for mock backend - no real sync
    },

    setActiveAccount(_account: TestAccount): void {
      // No-op for mock backend - no real state tracking needed
    },

    createGroup(owner: TestAccount): TestGroup {
      const raw = createMockGroup({
        owner: { id: owner.id },
        members: [{ id: owner.id }],
      });
      const group = wrapGroup(raw);
      // Owner is always admin
      group.addMember(owner, 'admin');
      return group;
    },

    async waitForSync(): Promise<void> {
      // No-op for mock backend - everything is synchronous
    },
  };
}

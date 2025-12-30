/**
 * Account and Group mock factories
 *
 * Creates mock Jazz Account and Group objects for testing.
 */

import { type Mock, vi } from 'vitest';
import {
  createIterableCoList,
  createMockCoMap,
  type MockCoList,
  type MockCoMap,
} from './covalue.js';
import { generateId } from './id.js';
import { createMockJazzAPI, type MockJazzAPI } from './jazz-api.js';

/**
 * Mock profile structure
 */
export interface MockProfile {
  $isLoaded: true;
  name?: string;
  displayName?: string;
  $jazz?: MockJazzAPI;
}

/**
 * Options for creating a mock account
 */
export interface CreateMockAccountOptions<TRoot = unknown> {
  /** Custom account ID */
  id?: string;
  /** Profile name */
  name?: string;
  /** Profile display name */
  displayName?: string;
  /** Root data structure */
  root?: TRoot;
  /** Whether to track mutations */
  trackMutations?: boolean;
}

/**
 * Mock account structure
 */
export interface MockAccount<TRoot = unknown> {
  $isLoaded: true;
  id: string;
  $jazz: MockJazzAPI;
  profile: MockProfile;
  root: TRoot & { $isLoaded: true; $jazz: MockJazzAPI };
  logOut: Mock<() => void>;
}

/**
 * Create a mock Jazz account
 *
 * @param options - Configuration options
 * @returns Mock account with profile and root
 *
 * @example
 * ```typescript
 * const account = createMockAccount({
 *   name: 'Test User',
 *   root: {
 *     folders: createMockCoList([]),
 *     viewState: createMockCoMap({}),
 *   },
 * });
 *
 * expect(account.profile.name).toBe('Test User');
 * expect(account.root.folders.$isLoaded).toBe(true);
 * ```
 */
export function createMockAccount<TRoot extends object = Record<string, unknown>>(
  options: CreateMockAccountOptions<TRoot> = {},
): MockAccount<TRoot> {
  const id = options.id ?? generateId('account');
  const name = options.name ?? 'Test User';
  const displayName = options.displayName ?? name;

  const profile: MockProfile = {
    $isLoaded: true,
    name,
    displayName,
    $jazz: createMockJazzAPI({ idPrefix: 'profile' }),
  };

  // Create root with Jazz metadata if provided
  const rootData = options.root ?? ({} as TRoot);
  const root = {
    ...rootData,
    $isLoaded: true as const,
    $jazz: createMockJazzAPI({
      idPrefix: 'root',
      target: options.trackMutations ? (rootData as Record<string, unknown>) : undefined,
    }),
  };

  return {
    $isLoaded: true,
    id,
    $jazz: createMockJazzAPI({
      id,
      target: options.trackMutations ? ({ profile, root } as Record<string, unknown>) : undefined,
    }),
    profile,
    root,
    logOut: vi.fn(),
  } as MockAccount<TRoot>;
}

/**
 * Options for creating a mock group
 */
export interface CreateMockGroupOptions {
  /** Custom group ID */
  id?: string;
  /** Group owner account */
  owner?: { id: string };
  /** Group members */
  members?: Array<{ id: string }>;
}

/**
 * Mock group structure
 */
export interface MockGroup {
  $isLoaded: true;
  id: string;
  $jazz: MockJazzAPI;
  owner: { id: string };
  members: Array<{ id: string }>;
  addMember: Mock<(member: { id: string }) => void>;
  removeMember: Mock<(memberId: string) => void>;
}

/**
 * Create a mock Jazz group
 *
 * Groups in Jazz manage permissions and membership for shared CoValues.
 *
 * @param options - Configuration options
 * @returns Mock group
 *
 * @example
 * ```typescript
 * const owner = createMockAccount({ name: 'Owner' });
 * const member = createMockAccount({ name: 'Member' });
 *
 * const group = createMockGroup({
 *   owner: { id: owner.id },
 *   members: [{ id: owner.id }, { id: member.id }],
 * });
 *
 * expect(group.members).toHaveLength(2);
 * ```
 */
export function createMockGroup(options: CreateMockGroupOptions = {}): MockGroup {
  const id = options.id ?? generateId('group');
  const owner = options.owner ?? { id: 'test-owner' };
  const members = options.members ?? [owner];

  return {
    $isLoaded: true,
    id,
    $jazz: createMockJazzAPI({ id }),
    owner,
    members: [...members],
    addMember: vi.fn((member: { id: string }) => {
      members.push(member);
    }),
    removeMember: vi.fn((memberId: string) => {
      const index = members.findIndex((m) => m.id === memberId);
      if (index !== -1) {
        members.splice(index, 1);
      }
    }),
  };
}

/**
 * Common root structure with folders (like wicketmap/checklist)
 */
export interface FoldersRoot<TFolder = unknown> {
  $isLoaded: true;
  $jazz: MockJazzAPI;
  folders: MockCoList<TFolder>;
  viewState?: MockCoMap<Record<string, unknown>>;
}

/**
 * Create a mock account with a folders-based root structure
 *
 * This is a common pattern in Jazz apps where the account root
 * contains a list of folders/items.
 *
 * @param folders - Initial folders
 * @param options - Additional options
 * @returns Mock account with folders root
 *
 * @example
 * ```typescript
 * const folder1 = createMockCoMap({ name: 'Folder 1', items: [] });
 * const folder2 = createMockCoMap({ name: 'Folder 2', items: [] });
 *
 * const account = createMockAccountWithFolders([folder1, folder2], {
 *   name: 'Test User',
 * });
 *
 * expect(account.root.folders).toHaveLength(2);
 * expect(account.root.folders[0].name).toBe('Folder 1');
 * ```
 */
export function createMockAccountWithFolders<TFolder>(
  folders: TFolder[] = [],
  options: Omit<CreateMockAccountOptions, 'root'> = {},
): MockAccount<FoldersRoot<TFolder>> {
  const foldersList = createIterableCoList(folders, {
    idPrefix: 'folders',
    trackMutations: options.trackMutations,
  });

  const root: FoldersRoot<TFolder> = {
    $isLoaded: true,
    $jazz: createMockJazzAPI({ idPrefix: 'root' }),
    folders: foldersList,
    viewState: createMockCoMap<Record<string, unknown>>({ folderExpanded: {} }),
  };

  return createMockAccount({
    ...options,
    root,
  });
}

/**
 * Tree node structure (common pattern for hierarchical data)
 */
export interface TreeNode {
  $isLoaded: true;
  $jazz: MockJazzAPI;
  id: string;
  name: string;
  type: 'folder' | 'map' | 'item';
  parent?: TreeNode;
  children?: MockCoList<TreeNode>;
  expanded?: boolean;
  archived?: boolean;
}

/**
 * Options for creating a mock tree node
 */
export interface CreateMockTreeNodeOptions {
  /** Custom node ID */
  id?: string;
  /** Node name */
  name: string;
  /** Node type */
  type?: 'folder' | 'map' | 'item';
  /** Child nodes */
  children?: TreeNode[];
  /** Parent node */
  parent?: TreeNode;
  /** Whether node is expanded */
  expanded?: boolean;
  /** Whether node is archived */
  archived?: boolean;
  /** Additional properties */
  extra?: Record<string, unknown>;
}

/**
 * Create a mock tree node
 *
 * Tree nodes are a common pattern for hierarchical data like folders
 * and items in Jazz applications.
 *
 * @param options - Node configuration
 * @returns Mock tree node
 *
 * @example
 * ```typescript
 * const child = createMockTreeNode({ name: 'Child', type: 'item' });
 * const parent = createMockTreeNode({
 *   name: 'Parent',
 *   type: 'folder',
 *   children: [child],
 *   expanded: true,
 * });
 *
 * expect(parent.children).toHaveLength(1);
 * expect(parent.children![0].name).toBe('Child');
 * ```
 */
export function createMockTreeNode(options: CreateMockTreeNodeOptions): TreeNode {
  const id = options.id ?? generateId(options.type ?? 'node');
  const type = options.type ?? 'folder';

  const children = options.children
    ? createIterableCoList(options.children, { idPrefix: 'children' })
    : undefined;

  const node: TreeNode = {
    $isLoaded: true,
    $jazz: createMockJazzAPI({ id }),
    id,
    name: options.name,
    type,
    parent: options.parent,
    children,
    expanded: options.expanded ?? false,
    archived: options.archived ?? false,
    ...options.extra,
  };

  // Fix parent references now that node exists
  if (children) {
    for (const child of children) {
      child.parent = node;
    }
  }

  return node;
}

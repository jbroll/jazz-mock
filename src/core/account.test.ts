import { describe, expect, it } from 'vitest';
import {
  createMockAccount,
  createMockAccountWithFolders,
  createMockGroup,
  createMockTreeNode,
} from './account.js';
import { createMockCoMap } from './covalue.js';

describe('createMockAccount', () => {
  it('creates account with default values', () => {
    const account = createMockAccount();

    expect(account.$isLoaded).toBe(true);
    expect(account.id).toMatch(/^account-/);
    expect(account.profile.name).toBe('Test User');
    expect(account.profile.displayName).toBe('Test User');
    expect(account.logOut).toBeDefined();
  });

  it('uses custom name', () => {
    const account = createMockAccount({ name: 'John Doe' });

    expect(account.profile.name).toBe('John Doe');
    expect(account.profile.displayName).toBe('John Doe');
  });

  it('uses custom displayName', () => {
    const account = createMockAccount({
      name: 'john',
      displayName: 'John Doe',
    });

    expect(account.profile.name).toBe('john');
    expect(account.profile.displayName).toBe('John Doe');
  });

  it('has $jazz API on account and root', () => {
    const account = createMockAccount();

    expect(account.$jazz).toBeDefined();
    expect(account.$jazz.id).toBeDefined();
    expect(account.root.$jazz).toBeDefined();
  });

  it('includes custom root data', () => {
    const account = createMockAccount({
      root: {
        customField: 'value',
        folders: [],
      },
    });

    expect((account.root as Record<string, unknown>).customField).toBe('value');
  });
});

describe('createMockGroup', () => {
  it('creates group with default values', () => {
    const group = createMockGroup();

    expect(group.$isLoaded).toBe(true);
    expect(group.id).toMatch(/^group-/);
    expect(group.owner).toEqual({ id: 'test-owner' });
    expect(group.members).toHaveLength(1);
  });

  it('uses custom owner', () => {
    const group = createMockGroup({ owner: { id: 'my-owner' } });
    expect(group.owner).toEqual({ id: 'my-owner' });
  });

  it('uses custom members', () => {
    const group = createMockGroup({
      members: [{ id: 'user1' }, { id: 'user2' }],
    });

    expect(group.members).toHaveLength(2);
    expect(group.members[0]).toEqual({ id: 'user1' });
    expect(group.members[1]).toEqual({ id: 'user2' });
  });

  it('addMember adds to members', () => {
    const group = createMockGroup({ members: [] });

    group.addMember({ id: 'new-user' });
    expect(group.addMember).toHaveBeenCalledWith({ id: 'new-user' });
  });

  it('removeMember is callable', () => {
    const group = createMockGroup({
      members: [{ id: 'user1' }, { id: 'user2' }],
    });

    group.removeMember('user1');
    expect(group.removeMember).toHaveBeenCalledWith('user1');
  });
});

describe('createMockAccountWithFolders', () => {
  it('creates account with folders list', () => {
    const folder1 = createMockCoMap({ name: 'Folder 1' });
    const folder2 = createMockCoMap({ name: 'Folder 2' });

    const account = createMockAccountWithFolders([folder1, folder2]);

    expect(account.root.folders).toHaveLength(2);
    expect(account.root.folders[0].name).toBe('Folder 1');
    expect(account.root.folders[1].name).toBe('Folder 2');
  });

  it('folders list has Jazz metadata', () => {
    const account = createMockAccountWithFolders([]);

    expect(account.root.folders.$isLoaded).toBe(true);
    expect(account.root.folders.$jazz).toBeDefined();
    expect(account.root.folders.$jazz.push).toBeDefined();
  });

  it('includes viewState', () => {
    const account = createMockAccountWithFolders([]);

    expect(account.root.viewState).toBeDefined();
    expect(account.root.viewState?.$isLoaded).toBe(true);
  });

  it('folders list is iterable', () => {
    const folder = createMockCoMap({ name: 'Test' });
    const account = createMockAccountWithFolders([folder]);

    const names: string[] = [];
    for (const f of account.root.folders) {
      names.push((f as { name: string }).name);
    }

    expect(names).toEqual(['Test']);
  });
});

describe('createMockTreeNode', () => {
  it('creates node with name and type', () => {
    const node = createMockTreeNode({ name: 'My Folder', type: 'folder' });

    expect(node.name).toBe('My Folder');
    expect(node.type).toBe('folder');
    expect(node.$isLoaded).toBe(true);
    expect(node.$jazz).toBeDefined();
  });

  it('defaults to folder type', () => {
    const node = createMockTreeNode({ name: 'Test' });
    expect(node.type).toBe('folder');
  });

  it('creates node with children', () => {
    const child1 = createMockTreeNode({ name: 'Child 1', type: 'item' });
    const child2 = createMockTreeNode({ name: 'Child 2', type: 'item' });

    const parent = createMockTreeNode({
      name: 'Parent',
      type: 'folder',
      children: [child1, child2],
    });

    expect(parent.children).toBeDefined();
    expect(parent.children).toHaveLength(2);
  });

  it('sets parent references on children', () => {
    const child = createMockTreeNode({ name: 'Child', type: 'item' });

    const parent = createMockTreeNode({
      name: 'Parent',
      type: 'folder',
      children: [child],
    });

    // Parent reference should be set
    expect(parent.children?.[0].parent).toBe(parent);
  });

  it('creates expanded/archived nodes', () => {
    const node = createMockTreeNode({
      name: 'Test',
      expanded: true,
      archived: true,
    });

    expect(node.expanded).toBe(true);
    expect(node.archived).toBe(true);
  });

  it('uses custom ID', () => {
    const node = createMockTreeNode({ name: 'Test', id: 'custom-node-id' });
    expect(node.id).toBe('custom-node-id');
  });
});

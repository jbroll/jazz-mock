import { describe, expect, it } from 'vitest';
import { createMockEnsureLoaded, createMockJazzAPI } from './jazz-api.js';

describe('createMockJazzAPI', () => {
  it('creates API with default values', () => {
    const $jazz = createMockJazzAPI();

    expect($jazz.id).toMatch(/^mock-/);
    expect($jazz.owner).toEqual({ id: 'test-group' });
    expect($jazz.set).toBeDefined();
    expect($jazz.push).toBeDefined();
    expect($jazz.splice).toBeDefined();
    expect($jazz.delete).toBeDefined();
    expect($jazz.has).toBeDefined();
    expect($jazz.get).toBeDefined();
  });

  it('uses custom ID', () => {
    const $jazz = createMockJazzAPI({ id: 'custom-id' });
    expect($jazz.id).toBe('custom-id');
  });

  it('uses ID prefix', () => {
    const $jazz = createMockJazzAPI({ idPrefix: 'folder' });
    expect($jazz.id).toMatch(/^folder-/);
  });

  it('uses custom owner', () => {
    const $jazz = createMockJazzAPI({ owner: { id: 'my-group' } });
    expect($jazz.owner).toEqual({ id: 'my-group' });
  });

  it('set() is a spy function', () => {
    const $jazz = createMockJazzAPI();
    $jazz.set('name', 'Test');
    expect($jazz.set).toHaveBeenCalledWith('name', 'Test');
  });

  it('set() mutates target when provided', () => {
    const target = { name: 'Original' };
    const $jazz = createMockJazzAPI({ target });

    $jazz.set('name', 'Updated');
    expect(target.name).toBe('Updated');
  });

  it('delete() mutates target when provided', () => {
    const target: Record<string, unknown> = { name: 'Test', extra: 'value' };
    const $jazz = createMockJazzAPI({ target });

    $jazz.delete('extra');
    expect(target.extra).toBeUndefined();
    expect('extra' in target).toBe(false);
  });

  it('has() checks target when provided', () => {
    const target = { name: 'Test' };
    const $jazz = createMockJazzAPI({ target });

    expect($jazz.has('name')).toBe(true);
    expect($jazz.has('missing')).toBe(false);
  });

  it('get() returns from target when provided', () => {
    const target = { name: 'Test' };
    const $jazz = createMockJazzAPI({ target });

    expect($jazz.get('name')).toBe('Test');
    expect($jazz.get('missing')).toBeUndefined();
  });
});

describe('createMockEnsureLoaded', () => {
  it('returns the object it was called on', async () => {
    const ensureLoaded = createMockEnsureLoaded();
    const obj = { name: 'Test', ensureLoaded };

    const result = await obj.ensureLoaded.call(obj, { resolve: { items: true } });
    expect(result).toBe(obj);
  });

  it('is a spy function', async () => {
    const ensureLoaded = createMockEnsureLoaded();
    const obj = { name: 'Test' };

    await ensureLoaded.call(obj, { resolve: { nested: true } });
    expect(ensureLoaded).toHaveBeenCalledWith({ resolve: { nested: true } });
  });
});

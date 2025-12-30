import { beforeAll, describe, expect, it, vi } from 'vitest';
import { createMockCoMap } from '../core/covalue.js';
import { jazzMatchers, registerJazzMatchers } from './matchers.js';

// Register matchers for testing
beforeAll(() => {
  registerJazzMatchers();
});

describe('jazzMatchers', () => {
  describe('toBeCoValue', () => {
    it('passes for valid CoValue', () => {
      const covalue = createMockCoMap({ name: 'Test' });

      expect(() => expect(covalue).toBeCoValue()).not.toThrow();
    });

    it('fails for plain object', () => {
      const plainObj = { name: 'Test' };

      const result = jazzMatchers.toBeCoValue(plainObj);

      expect(result.pass).toBe(false);
      expect(result.message()).toContain('to be a CoValue');
    });

    it('fails for null', () => {
      const result = jazzMatchers.toBeCoValue(null);

      expect(result.pass).toBe(false);
    });

    it('fails for undefined', () => {
      const result = jazzMatchers.toBeCoValue(undefined);

      expect(result.pass).toBe(false);
    });

    it('fails for object with only $isLoaded', () => {
      const obj = { $isLoaded: true };

      const result = jazzMatchers.toBeCoValue(obj);

      expect(result.pass).toBe(false);
    });

    it('fails for object with non-object $jazz', () => {
      const obj = { $isLoaded: true, $jazz: 'not-an-object' };

      const result = jazzMatchers.toBeCoValue(obj);

      expect(result.pass).toBe(false);
    });

    it('provides correct negation message', () => {
      const covalue = createMockCoMap({ name: 'Test' });

      const result = jazzMatchers.toBeCoValue(covalue);

      expect(result.pass).toBe(true);
      expect(result.message()).toContain('not to be a CoValue');
    });
  });

  describe('toHaveJazzId', () => {
    it('passes when ID matches', () => {
      const covalue = createMockCoMap({ name: 'Test' }, { id: 'my-id-123' });

      expect(() => expect(covalue).toHaveJazzId('my-id-123')).not.toThrow();
    });

    it('fails when ID does not match', () => {
      const covalue = createMockCoMap({ name: 'Test' }, { id: 'actual-id' });

      const result = jazzMatchers.toHaveJazzId(covalue, 'expected-id');

      expect(result.pass).toBe(false);
      expect(result.message()).toContain('expected-id');
      expect(result.message()).toContain('actual-id');
    });

    it('fails for non-CoValue', () => {
      const result = jazzMatchers.toHaveJazzId({ name: 'Test' }, 'any-id');

      expect(result.pass).toBe(false);
      expect(result.message()).toContain('to be a CoValue');
    });

    it('provides correct negation message', () => {
      const covalue = createMockCoMap({ name: 'Test' }, { id: 'my-id' });

      const result = jazzMatchers.toHaveJazzId(covalue, 'my-id');

      expect(result.pass).toBe(true);
      expect(result.message()).toContain('not to have Jazz ID');
    });
  });

  describe('toBeLoaded', () => {
    it('passes when $isLoaded is true', () => {
      const covalue = createMockCoMap({ name: 'Test' });

      expect(() => expect(covalue).toBeLoaded()).not.toThrow();
    });

    it('fails when $isLoaded is false', () => {
      const obj = {
        $isLoaded: false,
        $jazz: { id: 'test' },
      };

      const result = jazzMatchers.toBeLoaded(obj);

      expect(result.pass).toBe(false);
      expect(result.message()).toContain('to be loaded');
    });

    it('fails for non-CoValue', () => {
      const result = jazzMatchers.toBeLoaded({ name: 'Test' });

      expect(result.pass).toBe(false);
      expect(result.message()).toContain('to be a CoValue');
    });

    it('provides correct negation message', () => {
      const covalue = createMockCoMap({ name: 'Test' });

      const result = jazzMatchers.toBeLoaded(covalue);

      expect(result.pass).toBe(true);
      expect(result.message()).toContain('not to be loaded');
    });
  });

  describe('toHaveBeenCalledWithKey', () => {
    it('passes when mock was called with key', () => {
      const mockFn = vi.fn();
      mockFn('name', 'value');

      expect(() => expect(mockFn).toHaveBeenCalledWithKey('name')).not.toThrow();
    });

    it('fails when mock was not called with key', () => {
      const mockFn = vi.fn();
      mockFn('other', 'value');

      const result = jazzMatchers.toHaveBeenCalledWithKey(mockFn, 'name');

      expect(result.pass).toBe(false);
      expect(result.message()).toContain('name');
      expect(result.message()).toContain('other');
    });

    it('fails for non-mock', () => {
      const result = jazzMatchers.toHaveBeenCalledWithKey({}, 'name');

      expect(result.pass).toBe(false);
      expect(result.message()).toContain('mock function');
    });

    it('handles multiple calls', () => {
      const mockFn = vi.fn();
      mockFn('first', 1);
      mockFn('second', 2);
      mockFn('third', 3);

      expect(() => expect(mockFn).toHaveBeenCalledWithKey('second')).not.toThrow();
    });

    it('provides correct negation message', () => {
      const mockFn = vi.fn();
      mockFn('name', 'value');

      const result = jazzMatchers.toHaveBeenCalledWithKey(mockFn, 'name');

      expect(result.pass).toBe(true);
      expect(result.message()).toContain('not to have been called');
    });
  });

  describe('toHaveBeenCalledWithKeyValue', () => {
    it('passes when mock was called with key and value', () => {
      const mockFn = vi.fn();
      mockFn('name', 'Test Value');

      expect(() => expect(mockFn).toHaveBeenCalledWithKeyValue('name', 'Test Value')).not.toThrow();
    });

    it('fails when key matches but value does not', () => {
      const mockFn = vi.fn();
      mockFn('name', 'actual value');

      const result = jazzMatchers.toHaveBeenCalledWithKeyValue(mockFn, 'name', 'expected value');

      expect(result.pass).toBe(false);
      expect(result.message()).toContain('expected value');
    });

    it('fails when value matches but key does not', () => {
      const mockFn = vi.fn();
      mockFn('actual-key', 'value');

      const result = jazzMatchers.toHaveBeenCalledWithKeyValue(mockFn, 'expected-key', 'value');

      expect(result.pass).toBe(false);
    });

    it('fails for non-mock', () => {
      const result = jazzMatchers.toHaveBeenCalledWithKeyValue({}, 'name', 'value');

      expect(result.pass).toBe(false);
      expect(result.message()).toContain('mock function');
    });

    it('handles object values', () => {
      const mockFn = vi.fn();
      mockFn('data', { id: 1, name: 'Test' });

      expect(() =>
        expect(mockFn).toHaveBeenCalledWithKeyValue('data', { id: 1, name: 'Test' }),
      ).not.toThrow();
    });

    it('handles array values', () => {
      const mockFn = vi.fn();
      mockFn('items', [1, 2, 3]);

      expect(() => expect(mockFn).toHaveBeenCalledWithKeyValue('items', [1, 2, 3])).not.toThrow();
    });

    it('handles null values', () => {
      const mockFn = vi.fn();
      mockFn('empty', null);

      expect(() => expect(mockFn).toHaveBeenCalledWithKeyValue('empty', null)).not.toThrow();
    });

    it('provides correct negation message', () => {
      const mockFn = vi.fn();
      mockFn('name', 'value');

      const result = jazzMatchers.toHaveBeenCalledWithKeyValue(mockFn, 'name', 'value');

      expect(result.pass).toBe(true);
      expect(result.message()).toContain('not to have been called');
    });
  });
});

describe('registerJazzMatchers', () => {
  it('enables matchers on expect', () => {
    const covalue = createMockCoMap({ name: 'Test' }, { id: 'test-id' });

    // These should work because we called registerJazzMatchers in beforeAll
    expect(covalue).toBeCoValue();
    expect(covalue).toHaveJazzId('test-id');
    expect(covalue).toBeLoaded();
  });
});

describe('integration with CoValue mocks', () => {
  it('works with $jazz.set spy', () => {
    const covalue = createMockCoMap({ name: 'Original' });

    covalue.$jazz.set('name', 'Updated');

    expect(covalue.$jazz.set).toHaveBeenCalledWithKey('name');
    expect(covalue.$jazz.set).toHaveBeenCalledWithKeyValue('name', 'Updated');
  });

  it('works with trackMutations', () => {
    const covalue = createMockCoMap({ name: 'Original' }, { trackMutations: true });

    covalue.$jazz.set('name', 'Updated');

    expect(covalue).toBeCoValue();
    expect(covalue.$jazz.set).toHaveBeenCalledWithKeyValue('name', 'Updated');
    expect(covalue.name).toBe('Updated');
  });
});

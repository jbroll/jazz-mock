/**
 * Custom Vitest matchers for Jazz testing
 *
 * Provides assertion helpers for testing Jazz CoValues.
 */

import { expect } from 'vitest';

/**
 * Check if an object is a mock CoValue (has $isLoaded and $jazz)
 */
function isCoValue(obj: unknown): obj is { $isLoaded: boolean; $jazz: { id: string } } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    '$isLoaded' in obj &&
    '$jazz' in obj &&
    typeof (obj as Record<string, unknown>).$jazz === 'object'
  );
}

/**
 * Custom matchers for Jazz CoValue testing
 *
 * @example
 * ```typescript
 * // In setup.ts
 * import { jazzMatchers } from 'jazz-mock/vitest';
 * expect.extend(jazzMatchers);
 *
 * // In tests
 * expect(myCoValue).toBeCoValue();
 * expect(myCoValue).toHaveJazzId('expected-id');
 * expect(myCoValue.$jazz.set).toHaveBeenCalledWithKey('name');
 * ```
 */
export const jazzMatchers = {
  /**
   * Assert that a value is a CoValue (has $isLoaded and $jazz)
   */
  toBeCoValue(received: unknown) {
    const pass = isCoValue(received);

    return {
      pass,
      message: () =>
        pass
          ? `Expected ${JSON.stringify(received)} not to be a CoValue`
          : `Expected ${JSON.stringify(received)} to be a CoValue with $isLoaded and $jazz properties`,
    };
  },

  /**
   * Assert that a CoValue has a specific Jazz ID
   */
  toHaveJazzId(received: unknown, expectedId: string) {
    if (!isCoValue(received)) {
      return {
        pass: false,
        message: () => `Expected ${JSON.stringify(received)} to be a CoValue`,
      };
    }

    const actualId = received.$jazz.id;
    const pass = actualId === expectedId;

    return {
      pass,
      message: () =>
        pass
          ? `Expected CoValue not to have Jazz ID "${expectedId}"`
          : `Expected CoValue to have Jazz ID "${expectedId}", but got "${actualId}"`,
    };
  },

  /**
   * Assert that a CoValue is loaded
   */
  toBeLoaded(received: unknown) {
    if (!isCoValue(received)) {
      return {
        pass: false,
        message: () => `Expected ${JSON.stringify(received)} to be a CoValue`,
      };
    }

    const pass = received.$isLoaded === true;

    return {
      pass,
      message: () =>
        pass
          ? `Expected CoValue not to be loaded`
          : `Expected CoValue to be loaded ($isLoaded: true)`,
    };
  },

  /**
   * Assert that $jazz.set was called with a specific key
   */
  toHaveBeenCalledWithKey(received: unknown, expectedKey: string) {
    const mock = received as { mock?: { calls: unknown[][] } };

    if (!mock?.mock?.calls) {
      return {
        pass: false,
        message: () => `Expected a mock function`,
      };
    }

    const calls = mock.mock.calls;
    const pass = calls.some((call) => call[0] === expectedKey);
    const calledKeys = calls.map((call) => call[0]);

    return {
      pass,
      message: () =>
        pass
          ? `Expected not to have been called with key "${expectedKey}"`
          : `Expected to have been called with key "${expectedKey}", but was called with: ${JSON.stringify(calledKeys)}`,
    };
  },

  /**
   * Assert that $jazz.set was called with a specific key and value
   */
  toHaveBeenCalledWithKeyValue(received: unknown, expectedKey: string, expectedValue: unknown) {
    const mock = received as { mock?: { calls: unknown[][] } };

    if (!mock?.mock?.calls) {
      return {
        pass: false,
        message: () => `Expected a mock function`,
      };
    }

    const calls = mock.mock.calls;
    const pass = calls.some(
      (call) =>
        call[0] === expectedKey && JSON.stringify(call[1]) === JSON.stringify(expectedValue),
    );

    return {
      pass,
      message: () =>
        pass
          ? `Expected not to have been called with key "${expectedKey}" and value ${JSON.stringify(expectedValue)}`
          : `Expected to have been called with key "${expectedKey}" and value ${JSON.stringify(expectedValue)}`,
    };
  },
};

/**
 * TypeScript declaration merging for custom matchers
 */
declare module 'vitest' {
  interface Assertion {
    toBeCoValue(): void;
    toHaveJazzId(expectedId: string): void;
    toBeLoaded(): void;
    toHaveBeenCalledWithKey(expectedKey: string): void;
    toHaveBeenCalledWithKeyValue(expectedKey: string, expectedValue: unknown): void;
  }
}

/**
 * Register Jazz matchers with Vitest
 *
 * Call this in your setup file to enable Jazz-specific assertions.
 *
 * @example
 * ```typescript
 * // In vitest.setup.ts
 * import { registerJazzMatchers } from 'jazz-mock/vitest';
 *
 * registerJazzMatchers();
 *
 * // Now you can use Jazz matchers in tests
 * expect(folder).toBeCoValue();
 * expect(folder).toHaveJazzId('folder-123');
 * ```
 */
export function registerJazzMatchers(): void {
  expect.extend(jazzMatchers);
}

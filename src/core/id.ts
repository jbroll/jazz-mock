/**
 * ID generation utilities for mock Jazz objects
 *
 * Jazz uses unique IDs for all CoValues. This module provides
 * consistent ID generation for tests.
 */

let idCounter = 0;

/**
 * Generate a unique mock ID with optional prefix
 *
 * @param prefix - Optional prefix for the ID (default: "mock")
 * @returns A unique ID string
 *
 * @example
 * ```typescript
 * const id = generateId(); // "mock-a7f9k2m1q"
 * const poiId = generateId("poi"); // "poi-b8g0l3n2r"
 * ```
 */
export function generateId(prefix = 'mock'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a sequential ID (useful for deterministic tests)
 *
 * @param prefix - Optional prefix for the ID (default: "mock")
 * @returns A sequential ID string
 *
 * @example
 * ```typescript
 * resetIdCounter();
 * const id1 = generateSequentialId("item"); // "item-1"
 * const id2 = generateSequentialId("item"); // "item-2"
 * ```
 */
export function generateSequentialId(prefix = 'mock'): string {
  idCounter++;
  return `${prefix}-${idCounter}`;
}

/**
 * Reset the sequential ID counter
 * Call this in beforeEach() for deterministic tests
 */
export function resetIdCounter(): void {
  idCounter = 0;
}

/**
 * Generate a FileStream ID
 * Matches Jazz's internal FileStream ID format
 */
export function generateFileStreamId(): string {
  return `filestream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * jazz-mock - Testing utilities for Jazz.tools applications
 *
 * This package provides comprehensive mocking utilities for testing
 * Jazz.tools applications without a real Jazz runtime.
 *
 * @packageDocumentation
 *
 * @example
 * ```typescript
 * import {
 *   createMockCoMap,
 *   createMockCoList,
 *   createMockAccount,
 * } from 'jazz-mock';
 *
 * // Create mock CoValues
 * const folder = createMockCoMap({
 *   name: 'My Folder',
 *   items: createMockCoList([]),
 * });
 *
 * // Create mock account
 * const account = createMockAccount({
 *   name: 'Test User',
 *   root: { folders: createMockCoList([folder]) },
 * });
 *
 * // Test your service
 * const result = myService.createFolder(account, 'New Folder');
 * expect(account.root.folders.$jazz.push).toHaveBeenCalled();
 * ```
 */

// Re-export everything from core
export * from './core/index.js';

/**
 * jazz-mock - Testing utilities for Jazz.tools applications
 *
 * This package provides comprehensive mocking utilities for testing
 * Jazz.tools applications without a real Jazz runtime.
 *
 * @packageDocumentation
 *
 * @example Basic mock usage
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
 *
 * @example Fluent API with swappable backends
 * ```typescript
 * import { JazzTestContext } from 'jazz-mock';
 *
 * describe('Group Permissions', () => {
 *   let ctx: JazzTestContext;
 *
 *   beforeEach(async () => {
 *     // Uses JAZZ_TEST_BACKEND env var, defaults to 'mock'
 *     ctx = await JazzTestContext.create();
 *
 *     // Or explicitly: { backend: 'mock' } or { backend: 'jazz' }
 *   });
 *
 *   it('tests group permissions', async () => {
 *     const group = ctx.createGroup();
 *     const collaborator = await ctx.createAccount('Bob');
 *
 *     ctx.addMember(group, collaborator, 'writer');
 *
 *     expect(ctx.canWrite(group, collaborator)).toBe(true);
 *     expect(ctx.canAdmin(group, collaborator)).toBe(false);
 *   });
 * });
 * ```
 */

export { createJazzBackend, type JazzBackendOptions } from './backends/jazz.js';
// Re-export backends for advanced usage
export { createMockBackend } from './backends/mock.js';
// Re-export everything from core
export * from './core/index.js';
// Re-export fluent API
export * from './fluent/index.js';

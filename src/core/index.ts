/**
 * Core jazz-mock exports
 */

// Account and Group factories
export {
  type CreateMockAccountOptions,
  type CreateMockGroupOptions,
  type CreateMockTreeNodeOptions,
  createMockAccount,
  createMockAccountWithFolders,
  createMockGroup,
  createMockTreeNode,
  type FoldersRoot,
  type MockAccount,
  type MockGroup,
  type MockProfile,
  type TreeNode,
} from './account.js';
// CoValue factories
export {
  addJazzMetadata,
  type CreateMockCoValueOptions,
  createDeepMock,
  createIterableCoList,
  createMockCoList,
  createMockCoMap,
  createMockCoRecord,
  type MockCoList,
  type MockCoMap,
  type MockCoRecord,
  type MockCoValueBase,
} from './covalue.js';
// FileStream mocking
export {
  type CreateMockFileOptions,
  type CreateMockImageOptions,
  createFileStreamMock,
  createMockFileDefinition,
  createMockFileStream,
  createMockImageDefinition,
  FileStreamRegistry,
  fileStreamRegistry,
  type MockFileDefinition,
  type MockFileStream,
  type MockImageDefinition,
  registerMockFile,
  registerMockImage,
} from './file-stream.js';
// ID generation
export { generateFileStreamId, generateId, generateSequentialId, resetIdCounter } from './id.js';
// Jazz API mocking
export {
  type CreateMockJazzAPIOptions,
  createMockEnsureLoaded,
  createMockJazzAPI,
  type MockJazzAPI,
  type MockOwner,
} from './jazz-api.js';
// Reactive collections (Proxy-based)
export {
  clearBlobLoaderTimers,
  createMapWithReactiveCollections,
  createMapWithSyncImages,
  createReactiveList,
  createReactiveRecord,
  type MapWithReactiveCollectionsOptions,
  type MapWithSyncImagesOptions,
  type ReactiveCollection,
  type ReactiveCollectionOptions,
} from './reactive-collection.js';

/**
 * Core jazz-mock exports
 */

// ID generation
export { generateId, generateSequentialId, resetIdCounter, generateFileStreamId } from "./id.js";

// Jazz API mocking
export {
  createMockJazzAPI,
  createMockEnsureLoaded,
  type MockJazzAPI,
  type MockOwner,
  type CreateMockJazzAPIOptions,
} from "./jazz-api.js";

// CoValue factories
export {
  createMockCoMap,
  createMockCoList,
  createMockCoRecord,
  addJazzMetadata,
  createDeepMock,
  createIterableCoList,
  type MockCoValueBase,
  type MockCoMap,
  type MockCoList,
  type MockCoRecord,
  type CreateMockCoValueOptions,
} from "./covalue.js";

// Account and Group factories
export {
  createMockAccount,
  createMockGroup,
  createMockAccountWithFolders,
  createMockTreeNode,
  type MockAccount,
  type MockGroup,
  type MockProfile,
  type FoldersRoot,
  type TreeNode,
  type CreateMockAccountOptions,
  type CreateMockGroupOptions,
  type CreateMockTreeNodeOptions,
} from "./account.js";

// FileStream mocking
export {
  createMockFileStream,
  createMockImageDefinition,
  createMockFileDefinition,
  FileStreamRegistry,
  fileStreamRegistry,
  createFileStreamMock,
  registerMockImage,
  registerMockFile,
  type MockFileStream,
  type MockImageDefinition,
  type MockFileDefinition,
  type CreateMockImageOptions,
  type CreateMockFileOptions,
} from "./file-stream.js";

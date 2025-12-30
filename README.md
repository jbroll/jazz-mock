# jazz-mock

Testing utilities for [Jazz.tools](https://jazz.tools) applications.

## Features

- **CoValue Factories**: Create mock CoMap, CoList, and CoRecord objects with `$jazz` API
- **Reactive Collections**: Proxy-based collections that track mutations for image/file upload testing
- **Account & Group Mocks**: Mock Jazz accounts and groups for authentication testing
- **React Hook Mocks**: Configure `useAccount`, `useCoState`, `usePasskeyAuth`, and more
- **FileStream Mocking**: Mock file uploads and binary data handling
- **Async Loading Simulation**: Simulate page reload scenarios with delayed blob loading
- **Vitest Integration**: Setup helpers and custom matchers for Vitest
- **TypeScript First**: Full TypeScript support with generics
- **Zero Jazz Runtime**: Tests run without actual Jazz connection

## Installation

```bash
npm install -D jazz-mock
```

## Quick Start

```typescript
import {
  createMockCoMap,
  createMockCoList,
  createMockAccount,
} from 'jazz-mock';

// Create mock CoValues
const folder = createMockCoMap({
  name: 'My Folder',
  expanded: true,
  items: createMockCoList([]),
});

// Jazz metadata is automatically added
expect(folder.$isLoaded).toBe(true);
expect(folder.$jazz.id).toBeDefined();

// Track mutations
folder.$jazz.set('name', 'Updated');
expect(folder.$jazz.set).toHaveBeenCalledWith('name', 'Updated');
```

## Core API

### CoValue Factories

```typescript
import {
  createMockCoMap,
  createMockCoList,
  createMockCoRecord,
} from 'jazz-mock';

// CoMap - for object-like data
const map = createMockCoMap({
  name: 'Test',
  count: 42,
});

// CoList - for arrays
const list = createMockCoList([
  { id: '1', name: 'Item 1' },
  { id: '2', name: 'Item 2' },
]);

// CoRecord - for key-value collections
const templates = createMockCoRecord({
  'default': { name: 'Default Template' },
  'custom': { name: 'Custom Template' },
});
```

### Mutation Tracking

By default, `$jazz.set()` calls are tracked but don't mutate the object. Enable `trackMutations` to actually update the data:

```typescript
// Spy-only mode (default)
const folder = createMockCoMap({ name: 'Original' });
folder.$jazz.set('name', 'Updated');
expect(folder.name).toBe('Original'); // Not changed
expect(folder.$jazz.set).toHaveBeenCalledWith('name', 'Updated');

// With mutation tracking
const folder = createMockCoMap(
  { name: 'Original' },
  { trackMutations: true }
);
folder.$jazz.set('name', 'Updated');
expect(folder.name).toBe('Updated'); // Changed!
```

### Reactive Collections

For testing code that modifies collections (image uploads, file management):

```typescript
import {
  createMapWithSyncImages,
  createReactiveRecord,
  createReactiveList,
} from 'jazz-mock';

// Create a map with reactive image/file collections
const map = createMapWithSyncImages({ name: "Test Map" });

// When code calls map.images.$jazz.set(id, imageData)
// The image is immediately available at map.images[id]
map.images.$jazz.set('img-1', { filename: 'photo.png' });
expect(map.images['img-1'].filename).toBe('photo.png');

// Simulate async blob loading (page reload scenario)
const reloadMap = createMapWithSyncImages({
  name: "Test Map",
  simulateAsyncLoading: true,
  blobLoadDelayMs: 150,
});

// Image definition appears immediately, but blob loads async
reloadMap.images.$jazz.set('img-1', imageWithFile);
expect(reloadMap.images['img-1']).toBeDefined();
expect(reloadMap.images['img-1'].file.toBlob()).toBeUndefined(); // Not ready yet

await new Promise(r => setTimeout(r, 200));
expect(reloadMap.images['img-1'].file.toBlob()).toBeDefined(); // Now ready
```

### ensureLoaded Mocking

Mock the `ensureLoaded()` method for CoValues:

```typescript
import { createMockCoMap, createMockEnsureLoaded } from 'jazz-mock';

const map = createMockCoMap({ name: 'Test' });
map.ensureLoaded = createMockEnsureLoaded();

// In your code under test
const loaded = await map.ensureLoaded({ resolve: { items: true } });
expect(loaded).toBe(map); // Returns same object immediately
```

### Account & Group Mocking

```typescript
import {
  createMockAccount,
  createMockGroup,
  createMockAccountWithFolders,
} from 'jazz-mock';

// Basic account
const account = createMockAccount({
  name: 'Test User',
  root: {
    settings: { theme: 'dark' },
  },
});

// Account with folders (common pattern)
const folder1 = createMockCoMap({ name: 'Work' });
const folder2 = createMockCoMap({ name: 'Personal' });

const account = createMockAccountWithFolders([folder1, folder2], {
  name: 'John Doe',
});

expect(account.root.folders).toHaveLength(2);

// Groups for permission testing
const group = createMockGroup({
  owner: { id: 'owner-123' },
  members: [{ id: 'owner-123' }, { id: 'member-456' }],
});
```

### Tree Nodes

For hierarchical data (folders, nested items):

```typescript
import { createMockTreeNode } from 'jazz-mock';

const child = createMockTreeNode({ name: 'Child', type: 'item' });
const parent = createMockTreeNode({
  name: 'Parent',
  type: 'folder',
  children: [child],
  expanded: true,
});

expect(parent.children[0].parent).toBe(parent);
```

### FileStream Mocking

```typescript
import {
  createMockImageDefinition,
  createMockFileDefinition,
  createMockFileStream,
  fileStreamRegistry,
  registerMockImage,
} from 'jazz-mock';

// Create mock image
const image = createMockImageDefinition({
  filename: 'photo.png',
  contentType: 'image/png',
  size: 1024,
  altText: 'A test photo',
});

// Access blob
const blob = await image.file.toBlob();
expect(blob.type).toBe('image/png');

// Register for FileStream.loadAsBlob
registerMockImage(image);
```

## React Integration

```typescript
import {
  mockUseAccount,
  mockUseCoState,
  mockUsePasskeyAuth,
  mockUseIsAuthenticated,
  resetJazzReactMocks,
  createJazzReactMocks,
} from 'jazz-mock/react';

// Configure hooks before rendering
mockUseAccount({
  id: 'account-123',
  profile: { name: 'Test User' },
  root: { folders: [] },
});

mockUseIsAuthenticated(true);

// In your test
render(<MyComponent />);

// Reset between tests
afterEach(() => {
  resetJazzReactMocks();
});
```

### Setting up vi.mock

```typescript
// In vitest.setup.ts or at top of test file
import { createJazzReactMocks } from 'jazz-mock/react';

vi.mock('jazz-tools/react', () => createJazzReactMocks());
// or
vi.mock('jazz-react', () => createJazzReactMocks());
```

## Vitest Integration

### Setup

```typescript
// vitest.setup.ts
import { setupJazzMocks, registerJazzMatchers } from 'jazz-mock/vitest';

// Auto-cleanup between tests
setupJazzMocks();

// Enable custom matchers
registerJazzMatchers();
```

### Module Mocking

```typescript
import { createJazzToolsMock, getJazzMocks } from 'jazz-mock/vitest';

// Mock jazz-tools completely
vi.mock('jazz-tools', () => createJazzToolsMock());

// Or get all mocks at once
const { jazzTools, jazzReact, jazzToolsReact } = getJazzMocks();
vi.mock('jazz-tools', () => jazzTools);
vi.mock('jazz-react', () => jazzReact);
vi.mock('jazz-tools/react', () => jazzToolsReact);
```

### CoValue Constructor Mocks

For testing code that creates CoValues with `.create()`:

```typescript
import { createCoValueConstructorMocks } from 'jazz-mock/vitest';

vi.mock("jazz-tools", () => ({
  co: createCoValueConstructorMocks(),
}));

// In your code under test
const list = MyList.create(["a", "b"], { owner });
// list is now ["a", "b"] with $isLoaded and $jazz properties
```

### Custom Matchers

```typescript
// After calling registerJazzMatchers()

expect(folder).toBeCoValue();
expect(folder).toHaveJazzId('folder-123');
expect(folder).toBeLoaded();
expect(folder.$jazz.set).toHaveBeenCalledWithKey('name');
expect(folder.$jazz.set).toHaveBeenCalledWithKeyValue('name', 'Updated');
```

### Console Filtering

Suppress Jazz initialization noise in tests:

```typescript
import { createJazzConsoleFilter } from 'jazz-mock/vitest';

const filter = createJazzConsoleFilter();
global.console = {
  ...console,
  error: filter.error,
  warn: filter.warn,
};
```

## ID Generation

```typescript
import {
  generateId,
  generateSequentialId,
  resetIdCounter,
  generateFileStreamId,
} from 'jazz-mock';

// Random IDs (default)
const id1 = generateId(); // "mock-a7f9k2m1q"
const id2 = generateId('poi'); // "poi-b8g0l3n2r"

// Sequential IDs (for deterministic tests)
resetIdCounter();
const id1 = generateSequentialId('item'); // "item-1"
const id2 = generateSequentialId('item'); // "item-2"

// FileStream IDs
const fsId = generateFileStreamId(); // "filestream_1703000000000_x9y8z7"
```

## Common Patterns

### Testing Image Upload Services

```typescript
import { createMapWithSyncImages } from 'jazz-mock';
import { uploadImageToMap } from '../services/imageService';

test('uploads image without polling delay', async () => {
  const map = createMapWithSyncImages({ name: "Test Map" });
  const file = new File(['data'], 'test.png', { type: 'image/png' });

  // This normally polls for 5 seconds waiting for Jazz sync
  // With mocks, it completes instantly
  const imageId = await uploadImageToMap(map, file, 'user');

  expect(map.images[imageId]).toBeDefined();
  expect(map.images[imageId].filename).toBe('test.png');
});
```

### Testing Page Reload Scenarios

```typescript
import { createMapWithSyncImages } from 'jazz-mock';

test('handles async blob loading after page reload', async () => {
  const map = createMapWithSyncImages({
    name: "Test Map",
    simulateAsyncLoading: true,
    blobLoadDelayMs: 100,
  });

  // Simulate image loaded from Jazz storage
  map.images.$jazz.set('img-1', imageDefinition);

  // Image exists but blob not ready (simulates page reload)
  expect(map.images['img-1']).toBeDefined();
  expect(map.images['img-1'].file.toBlob()).toBeUndefined();

  // Wait for async loading
  await new Promise(r => setTimeout(r, 150));

  // Now blob is available
  expect(map.images['img-1'].file.toBlob()).toBeDefined();
});
```

### Testing Service Functions

```typescript
import { createMockAccountWithFolders, createMockCoMap } from 'jazz-mock';

describe('folderService', () => {
  it('creates a new folder', () => {
    const account = createMockAccountWithFolders([], { trackMutations: true });

    // Call your service
    createFolder(account, 'New Folder');

    // Verify the mutation
    expect(account.root.folders.$jazz.push).toHaveBeenCalled();
  });
});
```

### Testing Components with Jazz Hooks

```typescript
import { render, screen } from '@testing-library/react';
import { mockUseAccount, resetJazzReactMocks } from 'jazz-mock/react';

describe('UserProfile', () => {
  afterEach(() => resetJazzReactMocks());

  it('shows user name', () => {
    mockUseAccount({
      id: 'user-123',
      profile: { name: 'Jane Doe' },
    });

    render(<UserProfile />);

    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('shows login prompt when not authenticated', () => {
    mockUseAccount(undefined);

    render(<UserProfile />);

    expect(screen.getByText('Please log in')).toBeInTheDocument();
  });
});
```

### Deep Nested Structures

```typescript
import { createDeepMock } from 'jazz-mock';

const data = createDeepMock({
  profile: { name: 'User' },
  root: {
    folders: [
      { name: 'Folder 1', items: [] },
      { name: 'Folder 2', items: [] },
    ],
  },
});

// All levels have Jazz metadata
expect(data.$isLoaded).toBe(true);
expect(data.root.$isLoaded).toBe(true);
expect(data.root.folders.$isLoaded).toBe(true);
expect(data.root.folders[0].$isLoaded).toBe(true);
```

## Philosophy

This library follows a simple testing philosophy:

1. **Mock at the boundary** - Only mock the Jazz API methods you actually use
2. **Use plain fixtures** - Most tests can use plain objects rather than complex proxies
3. **Test real code** - Don't mock business logic, test actual implementations
4. **Keep it simple** - Focus on the API surface your code actually touches

## API Reference

### Core (`jazz-mock`)

| Export | Description |
|--------|-------------|
| `createMockCoMap(data, options?)` | Create a mock CoMap |
| `createMockCoList(items, options?)` | Create a mock CoList |
| `createMockCoRecord(data, options?)` | Create a mock CoRecord |
| `createMockJazzAPI(options?)` | Create a mock $jazz API |
| `createMockEnsureLoaded()` | Create a mock ensureLoaded function |
| `createMockAccount(options?)` | Create a mock account |
| `createMockGroup(options?)` | Create a mock group |
| `createMockAccountWithFolders(folders, options?)` | Create account with folders |
| `createMockTreeNode(options)` | Create a tree node |
| `createMockFileStream(content, type, id?)` | Create a FileStream |
| `createMockImageDefinition(options?)` | Create an image definition |
| `createMockFileDefinition(options?)` | Create a file definition |
| `createMapWithSyncImages(options?)` | Create map with reactive collections |
| `createMapWithReactiveCollections(options?)` | Create map with reactive collections |
| `createReactiveRecord(options?)` | Create Proxy-based record collection |
| `createReactiveList(items?, options?)` | Create Proxy-based list collection |
| `generateId(prefix?)` | Generate a random ID |
| `generateSequentialId(prefix?)` | Generate a sequential ID |
| `resetIdCounter()` | Reset sequential counter |

### React (`jazz-mock/react`)

| Export | Description |
|--------|-------------|
| `mockUseAccount(account)` | Configure useAccount mock |
| `mockUseCoState(data)` | Configure useCoState mock |
| `mockUsePasskeyAuth(config)` | Configure usePasskeyAuth mock |
| `mockUseIsAuthenticated(bool)` | Configure useIsAuthenticated mock |
| `resetJazzReactMocks()` | Reset all React mocks |
| `createJazzReactMocks()` | Create vi.mock factory for jazz-tools/react |
| `createJazzReactModuleMocks()` | Create vi.mock factory for jazz-react |

### Vitest (`jazz-mock/vitest`)

| Export | Description |
|--------|-------------|
| `setupJazzMocks(options?)` | Auto-setup cleanup hooks |
| `registerJazzMatchers()` | Register custom matchers |
| `createJazzToolsMock()` | Create jazz-tools mock |
| `createCoValueConstructorMocks()` | Create co.* mocks that return values |
| `getJazzMocks()` | Get all mock factories |
| `createJazzConsoleFilter()` | Create console filter |

## License

MIT

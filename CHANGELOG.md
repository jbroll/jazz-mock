# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `clearBlobLoaderTimers()` - Cleanup function to prevent memory leaks from async blob loaders
- `createIsolatedMockContext()` - Factory for creating isolated mock contexts for parallel test execution
- `IsolatedMockContext` interface - Type definition for isolated mock contexts
- `JazzConsoleFilterOptions` - Options interface for console filter configuration
- Tests for `reactive-collection.ts` (45 new tests)
- Tests for Vitest matchers (31 new tests)
- Repository, bugs, and homepage metadata to package.json

### Changed

- **BREAKING**: `setupJazzMocks()` is now async and returns `Promise<void>`
  - **Migration**: Add `await` before `setupJazzMocks()` calls
  - Example: `await setupJazzMocks()` instead of `setupJazzMocks()`
- Console filter patterns now use specific RegExp patterns instead of broad string matching
- `getMockImplementations()` now has explicit return type annotation
- `splice` signature in `MockJazzAPI` now includes rest parameter for inserted items

### Fixed

- Race condition in `setupJazzMocks()` where hooks were registered asynchronously without awaiting
- Deprecated `String.prototype.substr()` replaced with `slice()` in ID generation
- Dead code removed from `createMockTreeNode()` (unused forward reference loop)
- Async callback error handling in delayed blob loader now properly catches errors
- Non-null assertions replaced with proper type guards in tests

### Deprecated

- None

### Removed

- Dead code block in `createMockTreeNode()` that created an unused forward reference

### Security

- Console filter patterns are now more specific to avoid masking unrelated errors

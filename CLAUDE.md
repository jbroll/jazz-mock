# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

jazz-mock is a testing utilities library for Jazz.tools applications. It provides mock factories for CoValues (CoMap, CoList, CoRecord), accounts, groups, file streams, and React hook mocks—all without requiring an actual Jazz runtime.

## Commands

- `npm run build` - Build TypeScript to dist/ (uses `tsc`)
- `npm test` - Run all tests with Vitest
- `npm run test:watch` - Run tests in watch mode
- `npx vitest run src/core/covalue.test.ts` - Run a single test file
- `npm run typecheck` - Type-check without emitting
- `npm run lint` - Check code with Biome
- `npm run format` - Format and fix code with Biome

## Architecture

The library exports three entry points:
- `jazz-mock` - Core CoValue and account factories
- `jazz-mock/react` - React hook mocks (useAccount, useCoState, etc.)
- `jazz-mock/vitest` - Vitest setup helpers and custom matchers

### Source Structure

```
src/
├── index.ts              # Re-exports core
├── core/
│   ├── id.ts             # ID generation (random + sequential)
│   ├── jazz-api.ts       # Mock $jazz API with spies
│   ├── covalue.ts        # CoMap/CoList/CoRecord factories
│   ├── account.ts        # Account/Group/TreeNode factories
│   └── file-stream.ts    # FileStream and image mocking
├── react/
│   └── hooks.ts          # Mock implementations for Jazz React hooks
└── vitest/
    ├── setup.ts          # setupJazzMocks(), createJazzToolsMock()
    └── matchers.ts       # Custom Vitest matchers (toBeCoValue, etc.)
```

### Key Patterns

**$jazz API**: All mock CoValues include a `$jazz` property with spied methods (`set`, `push`, `delete`). By default, mutations are tracked but don't modify data. Pass `{ trackMutations: true }` to enable actual data mutation.

**Metadata fields**: Mock CoValues automatically get `$isLoaded: true`, `$loadedAs`, `$owner`, and a unique `id`.

**Deep mocking**: `createDeepMock()` recursively adds Jazz metadata to nested objects/arrays.

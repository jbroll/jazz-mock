/**
 * FileStream mocking utilities
 *
 * Jazz uses FileStream for binary data (images, files).
 * This module provides mocks for testing file operations.
 */

import { vi, type Mock } from "vitest";
import { generateFileStreamId, generateId } from "./id.js";
import { createMockJazzAPI, type MockJazzAPI } from "./jazz-api.js";

/**
 * Mock FileStream object
 */
export interface MockFileStream {
  $isLoaded: true;
  id: string;
  toBlob: Mock<() => Promise<Blob>>;
}

/**
 * Create a mock FileStream
 *
 * @param content - File content (string or Blob)
 * @param contentType - MIME type
 * @param id - Optional custom ID
 * @returns Mock FileStream
 *
 * @example
 * ```typescript
 * const fileStream = createMockFileStream('file contents', 'text/plain');
 * const blob = await fileStream.toBlob();
 * expect(blob.type).toBe('text/plain');
 * ```
 */
export function createMockFileStream(
  content: string | Blob = "",
  contentType = "application/octet-stream",
  id?: string
): MockFileStream {
  const blob = content instanceof Blob ? content : new Blob([content], { type: contentType });

  return {
    $isLoaded: true,
    id: id ?? generateFileStreamId(),
    toBlob: vi.fn().mockResolvedValue(blob),
  };
}

/**
 * Mock image definition structure
 */
export interface MockImageDefinition {
  $isLoaded: true;
  $jazz: MockJazzAPI;
  id: string;
  filename: string;
  contentType: string;
  size: number;
  file: MockFileStream;
  metadata?: {
    altText?: string;
    width?: number;
    height?: number;
  };
  uploadedAt?: string;
  uploadedBy?: string;
  /** Internal refs structure used by Jazz */
  _refs?: {
    file: { id: string };
  };
}

/**
 * Options for creating a mock image definition
 */
export interface CreateMockImageOptions {
  /** Custom image ID */
  id?: string;
  /** Filename */
  filename?: string;
  /** MIME type */
  contentType?: string;
  /** File size in bytes */
  size?: number;
  /** Image content (for toBlob) */
  content?: string | Blob;
  /** Alt text */
  altText?: string;
  /** Image dimensions */
  width?: number;
  height?: number;
  /** Upload timestamp */
  uploadedAt?: string;
  /** Uploader ID */
  uploadedBy?: string;
}

/**
 * Create a mock image definition
 *
 * @param options - Image configuration
 * @returns Mock image definition with FileStream
 *
 * @example
 * ```typescript
 * const image = createMockImageDefinition({
 *   filename: 'photo.png',
 *   contentType: 'image/png',
 *   size: 1024,
 *   altText: 'A test photo',
 * });
 *
 * expect(image.filename).toBe('photo.png');
 * const blob = await image.file.toBlob();
 * expect(blob.type).toBe('image/png');
 * ```
 */
export function createMockImageDefinition(
  options: CreateMockImageOptions = {}
): MockImageDefinition {
  const id = options.id ?? generateId("img");
  const filename = options.filename ?? "test-image.png";
  const contentType = options.contentType ?? "image/png";
  const size = options.size ?? 1024;
  const content = options.content ?? `${id}-content`;

  const fileStreamId = generateFileStreamId();
  const file = createMockFileStream(content, contentType, fileStreamId);

  return {
    $isLoaded: true,
    $jazz: createMockJazzAPI({ id }),
    id,
    filename,
    contentType,
    size,
    file,
    metadata: {
      altText: options.altText ?? `${filename} alt text`,
      width: options.width,
      height: options.height,
    },
    uploadedAt: options.uploadedAt ?? new Date().toISOString(),
    uploadedBy: options.uploadedBy ?? "test-user",
    _refs: {
      file: { id: fileStreamId },
    },
  };
}

/**
 * Mock file definition structure
 */
export interface MockFileDefinition {
  $isLoaded: true;
  $jazz: MockJazzAPI;
  id: string;
  filename: string;
  contentType: string;
  size: number;
  file: MockFileStream;
  metadata?: {
    title?: string;
    description?: string;
  };
  uploadedAt?: string;
  uploadedBy?: string;
  _refs?: {
    file: { id: string };
  };
}

/**
 * Options for creating a mock file definition
 */
export interface CreateMockFileOptions {
  /** Custom file ID */
  id?: string;
  /** Filename */
  filename?: string;
  /** MIME type */
  contentType?: string;
  /** File size in bytes */
  size?: number;
  /** File content */
  content?: string | Blob;
  /** File title */
  title?: string;
  /** File description */
  description?: string;
  /** Upload timestamp */
  uploadedAt?: string;
  /** Uploader ID */
  uploadedBy?: string;
}

/**
 * Create a mock file definition
 *
 * @param options - File configuration
 * @returns Mock file definition with FileStream
 *
 * @example
 * ```typescript
 * const file = createMockFileDefinition({
 *   filename: 'document.pdf',
 *   contentType: 'application/pdf',
 *   size: 2048,
 *   title: 'Important Document',
 * });
 *
 * const blob = await file.file.toBlob();
 * expect(blob.type).toBe('application/pdf');
 * ```
 */
export function createMockFileDefinition(options: CreateMockFileOptions = {}): MockFileDefinition {
  const id = options.id ?? generateId("file");
  const filename = options.filename ?? "test-file.txt";
  const contentType = options.contentType ?? "text/plain";
  const size = options.size ?? 512;
  const content = options.content ?? `${id}-content`;

  const fileStreamId = generateFileStreamId();
  const file = createMockFileStream(content, contentType, fileStreamId);

  return {
    $isLoaded: true,
    $jazz: createMockJazzAPI({ id }),
    id,
    filename,
    contentType,
    size,
    file,
    metadata: {
      title: options.title ?? filename,
      description: options.description,
    },
    uploadedAt: options.uploadedAt ?? new Date().toISOString(),
    uploadedBy: options.uploadedBy ?? "test-user",
    _refs: {
      file: { id: fileStreamId },
    },
  };
}

/**
 * Registry for FileStream content during tests
 *
 * Use this to register expected file content that FileStream.loadAsBlob
 * should return for specific IDs.
 */
export class FileStreamRegistry {
  private registry = new Map<string, { contentType: string; content: string | Blob }>();

  /**
   * Register file content for a FileStream ID
   */
  register(fileStreamId: string, contentType: string, content: string | Blob): void {
    this.registry.set(fileStreamId, { contentType, content });
  }

  /**
   * Get registered content for a FileStream ID
   */
  get(fileStreamId: string): { contentType: string; content: string | Blob } | undefined {
    return this.registry.get(fileStreamId);
  }

  /**
   * Check if content is registered for a FileStream ID
   */
  has(fileStreamId: string): boolean {
    return this.registry.has(fileStreamId);
  }

  /**
   * Clear all registered content
   */
  clear(): void {
    this.registry.clear();
  }

  /**
   * Get a Blob for a registered FileStream ID
   */
  getBlob(fileStreamId: string): Blob | null {
    const entry = this.registry.get(fileStreamId);
    if (!entry) return null;

    if (entry.content instanceof Blob) {
      return entry.content;
    }
    return new Blob([entry.content], { type: entry.contentType });
  }

  /**
   * Create a FileStream mock module that uses this registry
   */
  createMock(): {
    createFromBlob: Mock<(file: Blob, owner: unknown) => Promise<MockFileStream>>;
    loadAsBlob: Mock<(fileId: string) => Promise<Blob | null>>;
  } {
    return {
      createFromBlob: vi.fn(async (file: Blob, _owner: unknown) => {
        const fileStreamId = generateFileStreamId();
        this.register(fileStreamId, file.type, file);
        return createMockFileStream(file, file.type, fileStreamId);
      }),
      loadAsBlob: vi.fn(async (fileId: string) => {
        return this.getBlob(fileId);
      }),
    };
  }
}

/**
 * Global FileStream registry instance
 */
export const fileStreamRegistry = new FileStreamRegistry();

/**
 * Create a mock FileStream module for vi.mock('jazz-tools')
 *
 * @param registry - Optional registry to use (defaults to global)
 * @returns Mock FileStream module
 *
 * @example
 * ```typescript
 * vi.mock("jazz-tools", async () => {
 *   const actual = await vi.importActual("jazz-tools");
 *   return {
 *     ...actual,
 *     FileStream: createFileStreamMock(),
 *   };
 * });
 * ```
 */
export function createFileStreamMock(
  registry: FileStreamRegistry = fileStreamRegistry
): ReturnType<FileStreamRegistry["createMock"]> {
  return registry.createMock();
}

/**
 * Register a mock image in the FileStream registry
 *
 * Call this after creating a mock image to make FileStream.loadAsBlob work.
 *
 * @param imageDef - The mock image definition
 * @param registry - Optional registry to use
 */
export function registerMockImage(
  imageDef: MockImageDefinition,
  registry: FileStreamRegistry = fileStreamRegistry
): void {
  const fileStreamId = imageDef._refs?.file?.id;
  if (fileStreamId) {
    registry.register(fileStreamId, imageDef.contentType, `${imageDef.id}-content`);
  }
}

/**
 * Register a mock file in the FileStream registry
 *
 * @param fileDef - The mock file definition
 * @param registry - Optional registry to use
 */
export function registerMockFile(
  fileDef: MockFileDefinition,
  registry: FileStreamRegistry = fileStreamRegistry
): void {
  const fileStreamId = fileDef._refs?.file?.id;
  if (fileStreamId) {
    registry.register(fileStreamId, fileDef.contentType, `${fileDef.id}-content`);
  }
}

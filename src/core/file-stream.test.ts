import { describe, it, expect, beforeEach } from "vitest";
import {
  createMockFileStream,
  createMockImageDefinition,
  createMockFileDefinition,
  FileStreamRegistry,
  fileStreamRegistry,
  createFileStreamMock,
  registerMockImage,
  registerMockFile,
} from "./file-stream.js";

describe("createMockFileStream", () => {
  it("creates FileStream with ID", () => {
    const fs = createMockFileStream("content", "text/plain");

    expect(fs.$isLoaded).toBe(true);
    expect(fs.id).toMatch(/^filestream_/);
  });

  it("toBlob returns content", async () => {
    const fs = createMockFileStream("hello world", "text/plain");
    const blob = await fs.toBlob();

    expect(blob.type).toBe("text/plain");
    const text = await blob.text();
    expect(text).toBe("hello world");
  });

  it("accepts Blob as content", async () => {
    const originalBlob = new Blob(["blob content"], { type: "image/png" });
    const fs = createMockFileStream(originalBlob, "image/png");
    const blob = await fs.toBlob();

    expect(blob.type).toBe("image/png");
  });

  it("uses custom ID", () => {
    const fs = createMockFileStream("", "text/plain", "custom-fs-id");
    expect(fs.id).toBe("custom-fs-id");
  });
});

describe("createMockImageDefinition", () => {
  it("creates image with default values", () => {
    const image = createMockImageDefinition();

    expect(image.$isLoaded).toBe(true);
    expect(image.id).toMatch(/^img-/);
    expect(image.filename).toBe("test-image.png");
    expect(image.contentType).toBe("image/png");
    expect(image.size).toBe(1024);
  });

  it("uses custom values", () => {
    const image = createMockImageDefinition({
      id: "my-image",
      filename: "photo.jpg",
      contentType: "image/jpeg",
      size: 2048,
      altText: "A photo",
    });

    expect(image.id).toBe("my-image");
    expect(image.filename).toBe("photo.jpg");
    expect(image.contentType).toBe("image/jpeg");
    expect(image.size).toBe(2048);
    expect(image.metadata?.altText).toBe("A photo");
  });

  it("has FileStream reference", () => {
    const image = createMockImageDefinition();

    expect(image.file).toBeDefined();
    expect(image.file.$isLoaded).toBe(true);
    expect(image.file.id).toMatch(/^filestream_/);
  });

  it("has _refs structure", () => {
    const image = createMockImageDefinition();

    expect(image._refs).toBeDefined();
    expect(image._refs?.file.id).toBe(image.file.id);
  });

  it("file.toBlob works", async () => {
    const image = createMockImageDefinition({ contentType: "image/png" });
    const blob = await image.file.toBlob();

    expect(blob.type).toBe("image/png");
  });
});

describe("createMockFileDefinition", () => {
  it("creates file with default values", () => {
    const file = createMockFileDefinition();

    expect(file.$isLoaded).toBe(true);
    expect(file.id).toMatch(/^file-/);
    expect(file.filename).toBe("test-file.txt");
    expect(file.contentType).toBe("text/plain");
    expect(file.size).toBe(512);
  });

  it("uses custom values", () => {
    const file = createMockFileDefinition({
      id: "my-file",
      filename: "document.pdf",
      contentType: "application/pdf",
      size: 4096,
      title: "Important Doc",
    });

    expect(file.id).toBe("my-file");
    expect(file.filename).toBe("document.pdf");
    expect(file.contentType).toBe("application/pdf");
    expect(file.metadata?.title).toBe("Important Doc");
  });

  it("has FileStream reference", () => {
    const file = createMockFileDefinition();

    expect(file.file).toBeDefined();
    expect(file._refs?.file.id).toBe(file.file.id);
  });
});

describe("FileStreamRegistry", () => {
  let registry: FileStreamRegistry;

  beforeEach(() => {
    registry = new FileStreamRegistry();
  });

  it("registers and retrieves content", () => {
    registry.register("fs-1", "text/plain", "hello");

    const entry = registry.get("fs-1");
    expect(entry?.contentType).toBe("text/plain");
    expect(entry?.content).toBe("hello");
  });

  it("returns undefined for unknown IDs", () => {
    expect(registry.get("unknown")).toBeUndefined();
  });

  it("has() checks existence", () => {
    registry.register("fs-1", "text/plain", "content");

    expect(registry.has("fs-1")).toBe(true);
    expect(registry.has("fs-2")).toBe(false);
  });

  it("clear() removes all entries", () => {
    registry.register("fs-1", "text/plain", "a");
    registry.register("fs-2", "text/plain", "b");

    registry.clear();

    expect(registry.has("fs-1")).toBe(false);
    expect(registry.has("fs-2")).toBe(false);
  });

  it("getBlob returns Blob for string content", () => {
    registry.register("fs-1", "text/plain", "hello");

    const blob = registry.getBlob("fs-1");
    expect(blob).toBeInstanceOf(Blob);
    expect(blob?.type).toBe("text/plain");
  });

  it("getBlob returns null for unknown ID", () => {
    expect(registry.getBlob("unknown")).toBeNull();
  });

  it("createMock creates FileStream module mock", async () => {
    const mock = registry.createMock();

    // createFromBlob creates a FileStream and registers it
    const blob = new Blob(["test"], { type: "text/plain" });
    const fs = await mock.createFromBlob(blob, {});

    expect(fs.id).toMatch(/^filestream_/);
    expect(mock.createFromBlob).toHaveBeenCalled();

    // loadAsBlob retrieves from registry
    const loaded = await mock.loadAsBlob(fs.id);
    expect(loaded).toBeInstanceOf(Blob);
  });
});

describe("fileStreamRegistry (global)", () => {
  beforeEach(() => {
    fileStreamRegistry.clear();
  });

  it("is a shared instance", () => {
    fileStreamRegistry.register("test", "text/plain", "content");
    expect(fileStreamRegistry.has("test")).toBe(true);
  });
});

describe("createFileStreamMock", () => {
  beforeEach(() => {
    fileStreamRegistry.clear();
  });

  it("creates mock using global registry by default", async () => {
    const mock = createFileStreamMock();

    const blob = new Blob(["data"], { type: "application/json" });
    const fs = await mock.createFromBlob(blob, {});

    expect(fileStreamRegistry.has(fs.id)).toBe(true);
  });
});

describe("registerMockImage", () => {
  beforeEach(() => {
    fileStreamRegistry.clear();
  });

  it("registers image in FileStream registry", () => {
    const image = createMockImageDefinition({
      id: "my-img",
      contentType: "image/png",
    });

    registerMockImage(image);

    const fileStreamId = image._refs?.file.id;
    expect(fileStreamRegistry.has(fileStreamId!)).toBe(true);
  });
});

describe("registerMockFile", () => {
  beforeEach(() => {
    fileStreamRegistry.clear();
  });

  it("registers file in FileStream registry", () => {
    const file = createMockFileDefinition({
      id: "my-file",
      contentType: "application/pdf",
    });

    registerMockFile(file);

    const fileStreamId = file._refs?.file.id;
    expect(fileStreamRegistry.has(fileStreamId!)).toBe(true);
  });
});

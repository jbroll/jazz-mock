import { describe, it, expect, beforeEach } from "vitest";
import {
  generateId,
  generateSequentialId,
  resetIdCounter,
  generateFileStreamId,
} from "./id.js";

describe("generateId", () => {
  it("generates unique IDs", () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it("uses default prefix 'mock'", () => {
    const id = generateId();
    expect(id).toMatch(/^mock-[a-z0-9]+$/);
  });

  it("uses custom prefix", () => {
    const id = generateId("poi");
    expect(id).toMatch(/^poi-[a-z0-9]+$/);
  });
});

describe("generateSequentialId", () => {
  beforeEach(() => {
    resetIdCounter();
  });

  it("generates sequential IDs", () => {
    const id1 = generateSequentialId("item");
    const id2 = generateSequentialId("item");
    const id3 = generateSequentialId("item");

    expect(id1).toBe("item-1");
    expect(id2).toBe("item-2");
    expect(id3).toBe("item-3");
  });

  it("continues counting across prefixes", () => {
    const id1 = generateSequentialId("a");
    const id2 = generateSequentialId("b");
    const id3 = generateSequentialId("c");

    expect(id1).toBe("a-1");
    expect(id2).toBe("b-2");
    expect(id3).toBe("c-3");
  });
});

describe("resetIdCounter", () => {
  it("resets the counter to 0", () => {
    generateSequentialId("test");
    generateSequentialId("test");
    resetIdCounter();
    const id = generateSequentialId("test");
    expect(id).toBe("test-1");
  });
});

describe("generateFileStreamId", () => {
  it("generates FileStream-formatted IDs", () => {
    const id = generateFileStreamId();
    expect(id).toMatch(/^filestream_\d+_[a-z0-9]+$/);
  });

  it("includes timestamp", () => {
    const before = Date.now();
    const id = generateFileStreamId();
    const after = Date.now();

    const timestampStr = id.split("_")[1];
    const timestamp = parseInt(timestampStr, 10);

    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });
});

// @vitest-environment node
// Node's Blob, crypto and CompressionStream are the real ones; jsdom's Blob has no stream().
import { describe, expect, it } from "vitest";

import { gzip, sha256Hex } from "./file-prep";

const xer = "ERMHDR\t19.12\n%T\tTASK\n%F\ttask_id\n%R\t1\n%E\n".repeat(200);

describe("sha256Hex", () => {
  it("matches the usual hex SHA-256", async () => {
    expect(await sha256Hex(new Blob(["abc"]))).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});

describe("gzip", () => {
  it("shrinks the file, and unzips back to it", async () => {
    const zipped = await gzip(new Blob([xer]));
    expect(zipped.size).toBeLessThan(xer.length / 5);
    const unzipped = new Response(zipped.stream().pipeThrough(new DecompressionStream("gzip")));
    expect(await unzipped.text()).toBe(xer);
  });
});

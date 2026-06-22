import { describe, expect, it } from "vitest";
import { isTargetAllowed } from "./relayHosts";

describe("isTargetAllowed (prod / public-only)", () => {
  it("allows arbitrary public https hosts", () => {
    for (const u of [
      "https://api.openadapter.in/v1/models",
      "https://api.openai.com/v1/models",
      "https://api.anthropic.com/v1/messages",
      "https://my-custom-gateway.example.com/v1/chat/completions",
    ]) {
      expect(isTargetAllowed(u).ok, u).toBe(true);
    }
  });

  it("rejects non-https targets", () => {
    expect(isTargetAllowed("http://api.openai.com/v1/models").ok).toBe(false);
    expect(isTargetAllowed("ftp://example.com").ok).toBe(false);
  });

  it("rejects invalid URLs", () => {
    expect(isTargetAllowed("not a url").ok).toBe(false);
  });

  it("blocks loopback / private / link-local IPv4 literals", () => {
    for (const u of [
      "https://127.0.0.1/x",
      "https://10.0.0.5/x",
      "https://172.16.0.1/x",
      "https://172.31.255.255/x",
      "https://192.168.1.1/x",
      "https://169.254.169.254/latest/meta-data", // cloud metadata
      "https://0.0.0.0/x",
    ]) {
      expect(isTargetAllowed(u).ok, u).toBe(false);
    }
  });

  it("blocks alternative IP encodings (hex/octal/decimal) via URL normalisation", () => {
    for (const u of [
      "https://0x7f000001/x", // 127.0.0.1
      "https://2130706433/x", // 127.0.0.1
      "https://0177.0.0.1/x", // 127.0.0.1
      "https://0xa9fea9fe/x", // 169.254.169.254
    ]) {
      expect(isTargetAllowed(u).ok, u).toBe(false);
    }
  });

  it("blocks localhost and internal TLDs", () => {
    for (const u of [
      "https://localhost/x",
      "https://foo.localhost/x",
      "https://service.internal/x",
      "https://printer.local/x",
    ]) {
      expect(isTargetAllowed(u).ok, u).toBe(false);
    }
  });

  it("blocks IPv6 loopback / ULA / link-local and mapped v4", () => {
    for (const u of [
      "https://[::1]/x",
      "https://[fc00::1]/x",
      "https://[fd12:3456::1]/x",
      "https://[fe80::1]/x",
      "https://[::ffff:127.0.0.1]/x",
    ]) {
      expect(isTargetAllowed(u).ok, u).toBe(false);
    }
  });

  it("does not falsely block public hostnames that start with fc/fd", () => {
    expect(isTargetAllowed("https://fd-company.com/x").ok).toBe(true);
    expect(isTargetAllowed("https://fconline.example.com/x").ok).toBe(true);
  });
});

describe("isTargetAllowed (dev / allowPrivate)", () => {
  it("allows http and private hosts for local development", () => {
    for (const u of [
      "http://localhost:11434/v1/models",
      "http://127.0.0.1:1234/v1/models",
      "https://api.openadapter.in/v1/models",
    ]) {
      expect(isTargetAllowed(u, { allowPrivate: true }).ok, u).toBe(true);
    }
  });

  it("still rejects non-http(s) schemes", () => {
    expect(isTargetAllowed("ftp://localhost", { allowPrivate: true }).ok).toBe(
      false,
    );
  });
});

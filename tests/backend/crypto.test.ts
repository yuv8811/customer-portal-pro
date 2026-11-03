import { describe, it, expect } from "vitest";
import { encryptToken, decryptToken } from "../../app/utils/crypto.server.js";

describe("Token Encryption & Decryption (AES-256-GCM)", () => {
  it("encrypts and decrypts a token correctly", () => {
    const rawToken = "shpat_1234567890abcdefghijklmnopqrstuvwxyz";
    const encrypted = encryptToken(rawToken);

    expect(encrypted).not.toBe(rawToken);
    expect(encrypted.split(":")).toHaveLength(3);

    const decrypted = decryptToken(encrypted);
    expect(decrypted).toBe(rawToken);
  });

  it("handles empty strings gracefully", () => {
    expect(encryptToken("")).toBe("");
    expect(decryptToken("")).toBe("");
  });

  it("fails to decrypt tampered ciphertext", () => {
    const encrypted = encryptToken("shpat_secret_token");
    const [iv, authTag, data] = encrypted.split(":");
    const tampered = `${iv}:${authTag}:bad${data.substring(3)}`;

    expect(() => decryptToken(tampered)).toThrow();
  });
});


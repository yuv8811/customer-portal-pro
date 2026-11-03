import { describe, it, expect, beforeEach, afterEach } from "vitest";
import jwt from "jsonwebtoken";
import {
  verifyCustomerSessionToken,
  getCorsHeaders,
  normalizeShopDomain,
} from "../../app/services/session-token.server.js";

describe("Customer Session Token Verification & CORS", () => {
  const TEST_SECRET = "test_shopify_api_secret_for_unit_tests";
  const TEST_API_KEY = "test_api_key_123";

  beforeEach(() => {
    process.env.SHOPIFY_API_SECRET = TEST_SECRET;
    process.env.SHOPIFY_API_KEY = TEST_API_KEY;
  });

  afterEach(() => {
    delete process.env.SHOPIFY_API_SECRET;
    delete process.env.SHOPIFY_API_KEY;
  });

  it("normalizes various shop destinations correctly", () => {
    expect(normalizeShopDomain("https://my-store.myshopify.com")).toBe("my-store.myshopify.com");
    expect(normalizeShopDomain("https://my-store.myshopify.com/account")).toBe("my-store.myshopify.com");
    expect(normalizeShopDomain("my-store.myshopify.com")).toBe("my-store.myshopify.com");
  });

  it("returns proper CORS headers", () => {
    const req = new Request("https://api.example.com/api/customer/config", {
      headers: { Origin: "https://my-store.myshopify.com" },
    });
    const headers = getCorsHeaders(req) as Record<string, string>;
    expect(headers["Access-Control-Allow-Origin"]).toBe("https://my-store.myshopify.com");
    expect(headers["Access-Control-Allow-Methods"]).toContain("GET");
  });

  it("successfully verifies a valid customer account session token", () => {
    const payload = {
      iss: "https://my-store.myshopify.com/account",
      dest: "https://my-store.myshopify.com",
      aud: TEST_API_KEY,
      sub: "gid://shopify/Customer/987654321",
      exp: Math.floor(Date.now() / 1000) + 300,
      nbf: Math.floor(Date.now() / 1000),
      iat: Math.floor(Date.now() / 1000),
    };

    const token = jwt.sign(payload, TEST_SECRET, { algorithm: "HS256" });

    const req = new Request("https://api.example.com/api/customer/config", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const session = verifyCustomerSessionToken(req);
    expect(session.valid).toBe(true);
    expect(session.shop).toBe("my-store.myshopify.com");
    expect(session.customerId).toBe("gid://shopify/Customer/987654321");
  });

  it("rejects request with missing Authorization header with 401", async () => {
    const req = new Request("https://api.example.com/api/customer/config");
    try {
      verifyCustomerSessionToken(req);
      expect.fail("Should have thrown a 401 response");
    } catch (err) {
      expect(err).toBeInstanceOf(Response);
      const res = err as Response;
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain("Missing or malformed Authorization header");
    }
  });

  it("rejects token signed with incorrect secret with 401", async () => {
    const token = jwt.sign({ dest: "https://my-store.myshopify.com" }, "wrong_secret");
    const req = new Request("https://api.example.com/api/customer/config", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    try {
      verifyCustomerSessionToken(req);
      expect.fail("Should have thrown a 401 response");
    } catch (err) {
      expect(err).toBeInstanceOf(Response);
      const res = err as Response;
      expect(res.status).toBe(401);
    }
  });

  it("rejects expired token with 401", async () => {
    const token = jwt.sign(
      {
        dest: "https://my-store.myshopify.com",
        exp: Math.floor(Date.now() / 1000) - 10, // expired 10s ago
      },
      TEST_SECRET,
      { algorithm: "HS256" }
    );

    const req = new Request("https://api.example.com/api/customer/config", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    try {
      verifyCustomerSessionToken(req);
      expect.fail("Should have thrown a 401 response");
    } catch (err) {
      expect(err).toBeInstanceOf(Response);
      const res = err as Response;
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain("jwt expired");
    }
  });
});


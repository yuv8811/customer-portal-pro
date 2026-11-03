import jwt, { type JwtPayload } from "jsonwebtoken";

export interface VerifiedCustomerSession {
  valid: true;
  shop: string;
  customerId?: string;
  payload: JwtPayload;
}

/**
 * Returns standard CORS headers for customer extension endpoints
 */
export function getCorsHeaders(request?: Request): HeadersInit {
  const origin = request?.headers.get("Origin") || "*";

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

/**
 * Handles CORS OPTIONS preflight request
 */
export function handleCorsPreflight(request: Request): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}

/**
 * Normalizes a shop string or URL to a clean domain string
 */
export function normalizeShopDomain(destOrShop: string): string {
  try {
    if (destOrShop.startsWith("http://") || destOrShop.startsWith("https://")) {
      const parsed = new URL(destOrShop);
      return parsed.hostname.toLowerCase();
    }
  } catch {
    // Fall back to string cleanup
  }
  return destOrShop.replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase();
}

/**
 * Verifies a customer account session token from an incoming Request.
 * Throws a Response with 401 status if the token is missing or invalid.
 */
export function verifyCustomerSessionToken(request: Request): VerifiedCustomerSession {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Response(
      JSON.stringify({ error: "Missing or malformed Authorization header" }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          ...getCorsHeaders(request),
        },
      }
    );
  }

  const token = authHeader.substring(7).trim();
  const apiSecret = process.env.SHOPIFY_API_SECRET;
  const apiKey = process.env.SHOPIFY_API_KEY;

  if (!apiSecret) {
    throw new Response(
      JSON.stringify({ error: "Server authentication configuration missing" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...getCorsHeaders(request),
        },
      }
    );
  }

  try {
    const payload = jwt.verify(token, apiSecret, {
      algorithms: ["HS256"],
      // If SHOPIFY_API_KEY is configured, verify audience
      ...(apiKey ? { audience: apiKey } : {}),
    }) as JwtPayload;

    if (!payload.dest) {
      throw new Error("Missing dest claim in session token");
    }

    const shop = normalizeShopDomain(payload.dest);

    return {
      valid: true,
      shop,
      customerId: payload.sub,
      payload,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid session token";
    throw new Response(
      JSON.stringify({ error: `Unauthorized: ${message}` }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          ...getCorsHeaders(request),
        },
      }
    );
  }
}


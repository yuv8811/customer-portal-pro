import {
  verifyCustomerSessionToken,
  getCorsHeaders,
  handleCorsPreflight,
} from "../services/session-token.server.js";
import { getPublishedConfig } from "../services/config.server.js";

export const loader = async ({ request }) => {
  if (request.method === "OPTIONS") {
    return handleCorsPreflight(request);
  }

  const corsHeaders = getCorsHeaders(request);

  try {
    // Authenticate and verify session token (will throw 401 Response on invalid token)
    const session = verifyCustomerSessionToken(request);

    const url = new URL(request.url);
    const target = url.searchParams.get("target") || undefined;
    const pageId = url.searchParams.get("pageId") || undefined;

    const published = await getPublishedConfig(session.shop, { target, pageId });

    if (!published) {
      return Response.json(
        {
          published: false,
          config: null,
          message: "No active published configuration for this customer account placement.",
        },
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    return Response.json(
      {
        published: true,
        version: published.version,
        versionId: published.versionId,
        config: published.config,
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=60, s-maxage=300",
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    return Response.json(
      { published: false, error: error instanceof Error ? error.message : "Internal error" },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
};

export const action = async ({ request }) => {
  if (request.method === "OPTIONS") {
    return handleCorsPreflight(request);
  }
  return Response.json({ error: "Method not allowed" }, { status: 405 });
};


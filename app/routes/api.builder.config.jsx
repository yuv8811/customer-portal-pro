import { authenticate } from "../shopify.server.js";
import { getOrCreateDraft, saveDraft, validateDraft } from "../services/config.server.js";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const pageId = url.searchParams.get("pageId") || "profile-main";

  try {
    const { accountConfig, activeVersion } = await getOrCreateDraft(session.shop, pageId);
    const validation = await validateDraft(session.shop, pageId);

    return Response.json({
      success: true,
      shop: session.shop,
      pageId,
      target: accountConfig.target,
      draftConfig: accountConfig.draftConfig,
      activeVersion: activeVersion
        ? {
            version: activeVersion.version,
            versionId: activeVersion._id,
            publishedAt: activeVersion.publishedAt,
          }
        : null,
      validation,
    });
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to load draft" },
      { status: 500 }
    );
  }
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const pageId = url.searchParams.get("pageId") || "profile-main";

  if (request.method !== "POST" && request.method !== "PUT") {
    return Response.json({ success: false, error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await request.json();
    const result = await saveDraft(session.shop, pageId, body);

    if (!result.success) {
      return Response.json({ success: false, errors: result.errors }, { status: 400 });
    }

    return Response.json({
      success: true,
      draftConfig: result.draftConfig,
    });
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to save draft" },
      { status: 500 }
    );
  }
};


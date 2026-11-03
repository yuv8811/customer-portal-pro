import { authenticate } from "../shopify.server.js";
import { publishConfig, rollbackConfig } from "../services/config.server.js";

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);

  if (request.method !== "POST") {
    return Response.json({ success: false, error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await request.json();
    const actionType = body.action || "publish";
    const pageId = body.pageId || "profile-main";

    if (actionType === "publish") {
      const result = await publishConfig(session.shop, pageId, session.shop);
      if (!result.success) {
        return Response.json(
          {
            success: false,
            error: "Validation failed during publish",
            errors: result.errors,
          },
          { status: 422 }
        );
      }

      return Response.json({
        success: true,
        action: "published",
        version: result.version,
        versionId: result.versionId,
        config: result.config,
      });
    }

    if (actionType === "rollback") {
      const versionNumber = Number(body.versionNumber);
      if (!versionNumber || isNaN(versionNumber)) {
        return Response.json(
          { success: false, error: "Valid versionNumber required for rollback" },
          { status: 400 }
        );
      }

      const result = await rollbackConfig(session.shop, pageId, versionNumber);
      if (!result.success) {
        return Response.json({ success: false, error: result.error }, { status: 404 });
      }

      return Response.json({
        success: true,
        action: "rolled_back",
        version: result.version,
        versionId: result.versionId,
      });
    }

    return Response.json({ success: false, error: `Unknown action: ${actionType}` }, { status: 400 });
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "Publish action failed" },
      { status: 500 }
    );
  }
};

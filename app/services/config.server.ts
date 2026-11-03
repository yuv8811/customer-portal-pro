import { connectMongoose } from "../mongoose.server.js";
import { AccountConfig, type IAccountConfig } from "../models/account-config.server.js";
import { ConfigVersion, type IConfigVersion } from "../models/config-version.server.js";
import {
  safeParsePageConfig,
  type PageConfig,
  type ExtensionTarget,
} from "@customer-portal-pro/config-schema";
import { validateConfigCompatibility } from "@customer-portal-pro/component-registry";

export interface PublishResult {
  success: boolean;
  version?: number;
  versionId?: string;
  config?: PageConfig;
  errors?: string[];
}

export interface RollbackResult {
  success: boolean;
  version?: number;
  versionId?: string;
  config?: PageConfig;
  error?: string;
}

/**
 * Creates a standard initial draft PageConfig with an announcement block
 */
export function createDefaultDraftConfig(
  pageId: string,
  target: ExtensionTarget = "customer-account.profile.block.render"
): PageConfig {
  return {
    schemaVersion: "1.0.0",
    pageId,
    target,
    settings: {
      theme: "auto",
      spacing: "base",
      customStylesAllowed: false,
    },
    sections: [
      {
        id: "section-main",
        title: "Announcements",
        settings: {},
        blocks: [
          {
            id: `announcement-${Date.now()}`,
            type: "announcement",
            props: {
              title: "Welcome to our VIP portal",
              description: "Thank you for being a valued customer. Check here for updates and order tracking.",
              tone: "info",
              collapsible: false,
              dismissible: true,
              buttonLabel: "",
              buttonUrl: "",
              icon: "info",
            },
            settings: {
              padding: "base",
              fullWidth: false,
            },
          },
        ],
      },
    ],
  };
}

/**
 * Gets or creates the AccountConfig document and its current draft for a shop and pageId.
 * Always strictly tenant-scoped by shopId.
 */
export async function getOrCreateDraft(
  shopId: string,
  pageId = "profile-main",
  defaultTarget: ExtensionTarget = "customer-account.profile.block.render"
): Promise<{ accountConfig: IAccountConfig; activeVersion: IConfigVersion | null }> {
  await connectMongoose();
  const cleanShopId = shopId.toLowerCase().trim();

  let accountConfig = await AccountConfig.findOne({ shopId: cleanShopId, pageId });

  if (!accountConfig) {
    const initialDraft = createDefaultDraftConfig(pageId, defaultTarget);
    accountConfig = await AccountConfig.create({
      shopId: cleanShopId,
      pageId,
      target: defaultTarget,
      activeVersionId: null,
      draftConfig: initialDraft,
    });
  }

  let activeVersion: IConfigVersion | null = null;
  if (accountConfig.activeVersionId) {
    activeVersion = await ConfigVersion.findOne({
      _id: accountConfig.activeVersionId,
      shopId: cleanShopId,
    });
  }

  return { accountConfig, activeVersion };
}

/**
 * Saves a draft configuration for a shop and pageId.
 * Validates the draft structure with Zod before saving.
 */
export async function saveDraft(
  shopId: string,
  pageId: string,
  draftData: unknown
): Promise<{ success: boolean; draftConfig?: PageConfig; errors?: string[] }> {
  await connectMongoose();
  const cleanShopId = shopId.toLowerCase().trim();

  const parseResult = safeParsePageConfig(draftData);
  if (!parseResult.success) {
    return {
      success: false,
      errors: parseResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    };
  }

  const validDraft = parseResult.data;

  const accountConfig = await AccountConfig.findOneAndUpdate(
    { shopId: cleanShopId, pageId },
    {
      $set: {
        target: validDraft.target,
        draftConfig: validDraft,
        updatedAt: new Date(),
      },
    },
    { new: true, upsert: true }
  );

  return {
    success: true,
    draftConfig: accountConfig.draftConfig,
  };
}

/**
 * Validates a draft configuration against the target compatibility matrix
 * and component prop/setting schemas.
 */
export async function validateDraft(
  shopId: string,
  pageId: string
): Promise<{ valid: boolean; errors: string[] }> {
  const { accountConfig } = await getOrCreateDraft(shopId, pageId);
  return validateConfigCompatibility(accountConfig.draftConfig);
}

/**
 * Publishes the current draft:
 * 1. Validates the draft against target compatibility and component schemas.
 * 2. Creates an immutable ConfigVersion document with sequential version number.
 * 3. Swaps activeVersionId pointer on AccountConfig to the new version.
 * Published versions are never overwritten.
 */
export async function publishConfig(
  shopId: string,
  pageId: string,
  publishedBy = "admin"
): Promise<PublishResult> {
  await connectMongoose();
  const cleanShopId = shopId.toLowerCase().trim();

  const { accountConfig } = await getOrCreateDraft(cleanShopId, pageId);

  // Validate draft config thoroughly
  const validation = validateConfigCompatibility(accountConfig.draftConfig);
  if (!validation.valid) {
    return {
      success: false,
      errors: validation.errors,
    };
  }

  // Find the latest version number for this tenant & config
  const latestVersion = await ConfigVersion.findOne({
    shopId: cleanShopId,
    configId: accountConfig._id,
  }).sort({ version: -1 });

  const nextVersionNumber = (latestVersion?.version || 0) + 1;

  // Create immutable published snapshot
  const newVersion = await ConfigVersion.create({
    shopId: cleanShopId,
    configId: accountConfig._id,
    pageId: accountConfig.pageId,
    target: accountConfig.target,
    version: nextVersionNumber,
    config: accountConfig.draftConfig,
    publishedBy,
    publishedAt: new Date(),
  });

  // Swap activeVersionId pointer
  accountConfig.activeVersionId = newVersion._id;
  await accountConfig.save();

  return {
    success: true,
    version: newVersion.version,
    versionId: newVersion._id.toString(),
    config: newVersion.config,
  };
}

/**
 * Rolls back to a previously published immutable version:
 * 1. Finds the historical ConfigVersion by version number.
 * 2. Swaps the activeVersionId pointer to point to it.
 * 3. Updates the draftConfig so the editor reflects the rolled-back state.
 */
export async function rollbackConfig(
  shopId: string,
  pageId: string,
  versionNumber: number
): Promise<RollbackResult> {
  await connectMongoose();
  const cleanShopId = shopId.toLowerCase().trim();

  const accountConfig = await AccountConfig.findOne({ shopId: cleanShopId, pageId });
  if (!accountConfig) {
    return { success: false, error: "Account configuration not found" };
  }

  const targetVersion = await ConfigVersion.findOne({
    shopId: cleanShopId,
    configId: accountConfig._id,
    version: versionNumber,
  });

  if (!targetVersion) {
    return { success: false, error: `Version ${versionNumber} does not exist` };
  }

  // Swap pointer and restore draft
  accountConfig.activeVersionId = targetVersion._id;
  accountConfig.draftConfig = targetVersion.config;
  await accountConfig.save();

  return {
    success: true,
    version: targetVersion.version,
    versionId: targetVersion._id.toString(),
    config: targetVersion.config,
  };
}

/**
 * Retrieves the published configuration for an extension.
 * Reads ONLY from immutable published versions via activeVersionId.
 * Guaranteed zero customer PII.
 */
export async function getPublishedConfig(
  shopId: string,
  query: { pageId?: string; target?: string }
): Promise<{ version: number; versionId: string; config: PageConfig } | null> {
  await connectMongoose();
  const cleanShopId = shopId.toLowerCase().trim();

  const filter: Record<string, unknown> = { shopId: cleanShopId };
  if (query.pageId) {
    filter.pageId = query.pageId;
  } else if (query.target) {
    filter.target = query.target;
  }

  const accountConfig = await AccountConfig.findOne(filter);
  if (!accountConfig || !accountConfig.activeVersionId) {
    return null;
  }

  const activeVersion = await ConfigVersion.findOne({
    _id: accountConfig.activeVersionId,
    shopId: cleanShopId,
  });

  if (!activeVersion) {
    return null;
  }

  return {
    version: activeVersion.version,
    versionId: activeVersion._id.toString(),
    config: activeVersion.config,
  };
}


import { describe, it, expect, vi } from "vitest";
import {
  createDefaultDraftConfig,
  saveDraft,
  publishConfig,
  rollbackConfig,
} from "../../app/services/config.server.js";
import { AccountConfig } from "../../app/models/account-config.server.js";
import { ConfigVersion } from "../../app/models/config-version.server.js";
import * as mongooseServer from "../../app/mongoose.server.js";

describe("Config Service (Publishing & Versioning Lifecycle)", () => {
  it("creates a well-formed default draft config with an announcement block", () => {
    const draft = createDefaultDraftConfig("profile-main", "customer-account.profile.block.render");
    expect(draft.pageId).toBe("profile-main");
    expect(draft.target).toBe("customer-account.profile.block.render");
    expect(draft.sections).toHaveLength(1);
    expect(draft.sections[0].blocks[0].type).toBe("announcement");
  });

  describe("Publishing & Immutability Logic", () => {
    it("creates a new immutable ConfigVersion and swaps activeVersionId pointer", async () => {
      // Mock mongoose connection so tests don't require an active MongoDB server
      vi.spyOn(mongooseServer, "connectMongoose").mockResolvedValue({} as any);

      const fakeConfigId = "650000000000000000000001";
      const fakeVersionId1 = "650000000000000000000011";

      const validDraft = createDefaultDraftConfig("profile-main", "customer-account.profile.block.render");

      const mockAccountConfig: any = {
        _id: fakeConfigId,
        shopId: "test-shop.myshopify.com",
        pageId: "profile-main",
        target: "customer-account.profile.block.render",
        activeVersionId: null,
        draftConfig: validDraft,
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(AccountConfig, "findOne").mockResolvedValue(mockAccountConfig as any);
      vi.spyOn(ConfigVersion, "findOne").mockReturnValue({
        sort: vi.fn().mockResolvedValue(null), // No previous version
      } as any);

      vi.spyOn(ConfigVersion, "create").mockResolvedValue({
        _id: fakeVersionId1,
        shopId: "test-shop.myshopify.com",
        configId: fakeConfigId,
        pageId: "profile-main",
        target: "customer-account.profile.block.render",
        version: 1,
        config: validDraft,
      } as any);

      const result = await publishConfig("test-shop.myshopify.com", "profile-main");

      expect(result.success).toBe(true);
      expect(result.version).toBe(1);
      expect(result.versionId).toBe(fakeVersionId1);

      // Verify activeVersionId pointer was swapped
      expect(mockAccountConfig.activeVersionId).toBe(fakeVersionId1);
      expect(mockAccountConfig.save).toHaveBeenCalled();
    });

    it("blocks publish if the draft configuration has target incompatibility", async () => {
      vi.spyOn(mongooseServer, "connectMongoose").mockResolvedValue({} as any);

      const invalidDraft = {
        schemaVersion: "1.0.0",
        pageId: "order-status-page",
        target: "customer-account.order-status.block.render",
        settings: {
          theme: "auto",
          spacing: "base",
          customStylesAllowed: false,
        },
        sections: [
          {
            id: "s1",
            title: "Header",
            settings: {},
            blocks: [
              {
                id: "b1",
                type: "profile-summary", // Not supported on order-status!
                props: {},
                settings: {},
              },
            ],
          },
        ],
      };

      const mockAccountConfig: any = {
        _id: "650000000000000000000002",
        shopId: "test-shop.myshopify.com",
        pageId: "order-status-page",
        target: "customer-account.order-status.block.render",
        activeVersionId: null,
        draftConfig: invalidDraft,
        save: vi.fn(),
      };

      vi.spyOn(AccountConfig, "findOne").mockResolvedValue(mockAccountConfig as any);
      const createSpy = vi.spyOn(ConfigVersion, "create");

      const result = await publishConfig("test-shop.myshopify.com", "order-status-page");

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain("cannot be placed in target");
      expect(createSpy).not.toHaveBeenCalled();
    });

    it("rolls back to an existing historical version without deleting versions", async () => {
      vi.spyOn(mongooseServer, "connectMongoose").mockResolvedValue({} as any);

      const fakeConfigId = "650000000000000000000001";
      const fakeVersionId1 = "650000000000000000000011";
      const oldConfig = createDefaultDraftConfig("profile-main");

      const mockAccountConfig: any = {
        _id: fakeConfigId,
        shopId: "test-shop.myshopify.com",
        pageId: "profile-main",
        activeVersionId: "650000000000000000000022", // Currently on version 2
        draftConfig: { ...oldConfig, schemaVersion: "1.0.0" },
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(AccountConfig, "findOne").mockResolvedValue(mockAccountConfig as any);
      vi.spyOn(ConfigVersion, "findOne").mockResolvedValue({
        _id: fakeVersionId1,
        shopId: "test-shop.myshopify.com",
        configId: fakeConfigId,
        version: 1,
        config: oldConfig,
      } as any);

      const result = await rollbackConfig("test-shop.myshopify.com", "profile-main", 1);

      expect(result.success).toBe(true);
      expect(result.version).toBe(1);
      expect(mockAccountConfig.activeVersionId).toBe(fakeVersionId1);
      expect(mockAccountConfig.draftConfig).toEqual(oldConfig);
    });
  });
});

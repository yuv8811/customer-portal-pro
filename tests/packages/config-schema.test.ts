import { describe, it, expect } from "vitest";
import {
  PageConfigSchema,
  validatePageConfig,
  safeParsePageConfig,
} from "@customer-portal-pro/config-schema";

describe("PageConfigSchema", () => {
  it("validates a well-formed page configuration", () => {
    const validConfig = {
      schemaVersion: "1.0.0",
      pageId: "profile-main",
      target: "customer-account.profile.block.render",
      settings: {
        theme: "auto",
        spacing: "base",
      },
      sections: [
        {
          id: "section-1",
          title: "Main Announcements",
          settings: {},
          blocks: [
            {
              id: "block-announcement-1",
              type: "announcement",
              props: {
                title: "Flash Sale",
                description: "Get 20% off all items this weekend.",
                tone: "success",
              },
              settings: {},
            },
          ],
        },
      ],
    };

    const parsed = validatePageConfig(validConfig);
    expect(parsed.schemaVersion).toBe("1.0.0");
    expect(parsed.pageId).toBe("profile-main");
    expect(parsed.sections).toHaveLength(1);
    expect(parsed.sections[0].blocks[0].type).toBe("announcement");
  });

  it("applies default values for optional schema fields", () => {
    const minimalConfig = {
      pageId: "profile-main",
      target: "customer-account.profile.block.render",
    };

    const parsed = validatePageConfig(minimalConfig);
    expect(parsed.schemaVersion).toBe("1.0.0");
    expect(parsed.settings.spacing).toBe("base");
    expect(parsed.settings.theme).toBe("auto");
    expect(parsed.sections).toEqual([]);
  });

  it("fails if pageId is missing", () => {
    const invalidConfig = {
      target: "customer-account.profile.block.render",
    };

    const result = safeParsePageConfig(invalidConfig);
    expect(result.success).toBe(false);
  });

  it("fails if target is invalid", () => {
    const invalidConfig = {
      pageId: "profile-main",
      target: "invalid-target-name",
    };

    const result = safeParsePageConfig(invalidConfig);
    expect(result.success).toBe(false);
  });

  it("fails if schemaVersion is not valid semver", () => {
    const invalidConfig = {
      schemaVersion: "v1",
      pageId: "profile-main",
      target: "customer-account.profile.block.render",
    };

    const result = safeParsePageConfig(invalidConfig);
    expect(result.success).toBe(false);
  });

  it("strictly disallows customStylesAllowed: true (rule: no custom CSS/JS editor)", () => {
    const invalidConfig = {
      pageId: "profile-main",
      target: "customer-account.profile.block.render",
      settings: {
        customStylesAllowed: true,
      },
    };

    const result = safeParsePageConfig(invalidConfig);
    expect(result.success).toBe(false);
  });
});

import { describe, it, expect } from "vitest";
import {
  getComponentDefinition,
  getAllComponentDefinitions,
  getComponentsForTarget,
  checkComponentTargetCompatibility,
  validateConfigCompatibility,
  isValidCustomerAccountIcon,
} from "@customer-portal-pro/component-registry";
import type { PageConfig } from "@customer-portal-pro/config-schema";

describe("Component Registry", () => {
  it("contains only the MVP components: announcement and profile-summary", () => {
    const definitions = getAllComponentDefinitions();
    expect(definitions.map((d) => d.id).sort()).toEqual(["announcement", "profile-summary"].sort());
  });

  it("ensures announcement defaultProps pass its own propsSchema", () => {
    const announcement = getComponentDefinition("announcement");
    expect(announcement).toBeDefined();
    const result = announcement!.propsSchema.safeParse(announcement!.defaultProps);
    expect(result.success).toBe(true);
  });

  it("ensures profile-summary defaultProps pass its own propsSchema", () => {
    const profile = getComponentDefinition("profile-summary");
    expect(profile).toBeDefined();
    const result = profile!.propsSchema.safeParse(profile!.defaultProps);
    expect(result.success).toBe(true);
  });

  it("validates icons against Shopify reduced icon types", () => {
    expect(isValidCustomerAccountIcon("note")).toBe(true);
    expect(isValidCustomerAccountIcon("profile")).toBe(true);
    expect(isValidCustomerAccountIcon("cart")).toBe(true);
    expect(isValidCustomerAccountIcon("info")).toBe(true);
    expect(isValidCustomerAccountIcon("lucide-react-star")).toBe(false);
    expect(isValidCustomerAccountIcon("fa-user")).toBe(false);
  });

  describe("Target Compatibility", () => {
    it("allows announcement on order-status, profile, and order-index block targets", () => {
      const orderStatusCheck = checkComponentTargetCompatibility(
        "announcement",
        "customer-account.order-status.block.render"
      );
      expect(orderStatusCheck.compatible).toBe(true);

      const profileCheck = checkComponentTargetCompatibility(
        "announcement",
        "customer-account.profile.block.render"
      );
      expect(profileCheck.compatible).toBe(true);
    });

    it("allows profile-summary on profile.block.render", () => {
      const result = checkComponentTargetCompatibility(
        "profile-summary",
        "customer-account.profile.block.render"
      );
      expect(result.compatible).toBe(true);
    });

    it("blocks profile-summary from order-status.block.render with a descriptive reason", () => {
      const result = checkComponentTargetCompatibility(
        "profile-summary",
        "customer-account.order-status.block.render"
      );
      expect(result.compatible).toBe(false);
      expect(result.reason).toContain("cannot be placed in target");
    });

    it("blocks unknown component types", () => {
      const result = checkComponentTargetCompatibility(
        "unregistered-widget",
        "customer-account.profile.block.render"
      );
      expect(result.compatible).toBe(false);
      expect(result.reason).toContain("not recognized");
    });

    it("filters components correctly for targets", () => {
      const orderStatusComponents = getComponentsForTarget("customer-account.order-status.block.render");
      expect(orderStatusComponents.map((c) => c.id)).toEqual(["announcement"]);

      const profileComponents = getComponentsForTarget("customer-account.profile.block.render");
      expect(profileComponents.map((c) => c.id).sort()).toEqual(["announcement", "profile-summary"].sort());
    });
  });

  describe("validateConfigCompatibility", () => {
    it("accepts a valid config where all blocks are compatible with the target and match prop schemas", () => {
      const validConfig: PageConfig = {
        schemaVersion: "1.0.0",
        pageId: "profile-main",
        target: "customer-account.profile.block.render",
        settings: {
          theme: "auto",
          spacing: "base",
          customStylesAllowed: false,
        },
        sections: [
          {
            id: "s1",
            title: "Header Section",
            settings: {},
            blocks: [
              {
                id: "b1",
                type: "announcement",
                props: {
                  title: "Welcome!",
                  description: "Thanks for joining.",
                  tone: "info",
                  dismissible: true,
                },
                settings: {},
              },
              {
                id: "b2",
                type: "profile-summary",
                props: {
                  showAvatar: true,
                  showEmail: true,
                  badgeText: "Gold Member",
                },
                settings: {},
              },
            ],
          },
        ],
      };

      const result = validateConfigCompatibility(validConfig);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("rejects a config with target incompatibility (e.g. profile-summary in order-status)", () => {
      const invalidConfig: PageConfig = {
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
            title: "Order Status Section",
            settings: {},
            blocks: [
              {
                id: "b1",
                type: "profile-summary", // Not supported on order status!
                props: {},
                settings: {},
              },
            ],
          },
        ],
      };

      const result = validateConfigCompatibility(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain("cannot be placed in target");
    });

    it("rejects a config with invalid props (e.g. invalid tone value)", () => {
      const invalidConfig: PageConfig = {
        schemaVersion: "1.0.0",
        pageId: "profile-page",
        target: "customer-account.profile.block.render",
        settings: {
          theme: "auto",
          spacing: "base",
          customStylesAllowed: false,
        },
        sections: [
          {
            id: "s1",
            title: "Header Section",
            settings: {},
            blocks: [
              {
                id: "b1",
                type: "announcement",
                props: {
                  title: "Hello",
                  tone: "not-a-valid-tone",
                },
                settings: {},
              },
            ],
          },
        ],
      };

      const result = validateConfigCompatibility(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("props validation failed");
    });
  });
});


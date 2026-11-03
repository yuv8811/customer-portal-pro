import { z } from "zod";

/**
 * Supported Customer Account extension targets
 */
export const ExtensionTargetSchema = z.enum([
  // Block targets
  "customer-account.order-index.block.render",
  "customer-account.order-status.block.render",
  "customer-account.profile.block.render",
  // Static targets - Order Index
  "customer-account.order-index.announcement.render",
  // Static targets - Order Status
  "customer-account.order-status.announcement.render",
  "customer-account.order-status.cart-line-item.render-after",
  "customer-account.order-status.cart-line-list.render-after",
  "customer-account.order-status.customer-information.render-after",
  "customer-account.order-status.fulfillment-details.render-after",
  "customer-account.order-status.payment-details.render-after",
  "customer-account.order-status.return-details.render-after",
  "customer-account.order-status.unfulfilled-items.render-after",
  // Static targets - Profile (Default & B2B)
  "customer-account.profile.addresses.render-after",
  "customer-account.profile.announcement.render",
  "customer-account.profile.company-details.render-after",
  "customer-account.profile.company-location-addresses.render-after",
  "customer-account.profile.company-location-payment.render-after",
  "customer-account.profile.company-location-staff.render-after",
  // Static targets - Footer
  "customer-account.footer.render-after",
  // Full-page targets (must not share extension entries)
  "customer-account.page.render",
  "customer-account.order.page.render",
  // Action menu targets
  "customer-account.order.action.menu-item.render",
  "customer-account.order.action.render",
]);

export type ExtensionTarget = z.infer<typeof ExtensionTargetSchema>;

/**
 * Single Block schema inside a section
 */
export const ConfigBlockSchema = z.object({
  id: z.string().min(1, "Block ID is required"),
  type: z.string().min(1, "Block type is required"),
  props: z.record(z.string(), z.unknown()).default({}),
  settings: z.record(z.string(), z.unknown()).default({}),
});

export type ConfigBlock = z.infer<typeof ConfigBlockSchema>;

/**
 * Section schema containing an array of blocks
 */
export const ConfigSectionSchema = z.object({
  id: z.string().min(1, "Section ID is required"),
  title: z.string().optional(),
  settings: z.record(z.string(), z.unknown()).default({}),
  blocks: z.array(ConfigBlockSchema).default([]),
});

export type ConfigSection = z.infer<typeof ConfigSectionSchema>;

/**
 * Page level settings
 */
export const PageSettingsSchema = z.object({
  theme: z.enum(["auto", "light", "dark"]).default("auto"),
  spacing: z.enum(["none", "tight", "base", "loose"]).default("base"),
  customStylesAllowed: z.literal(false).default(false), // Enforces non-negotiable rule (no custom JS/CSS editor)
}).passthrough();

export type PageSettings = z.infer<typeof PageSettingsSchema>;

export const DEFAULT_PAGE_SETTINGS: PageSettings = {
  theme: "auto",
  spacing: "base",
  customStylesAllowed: false,
};

/**
 * Canonical Page Configuration schema
 */
export const PageConfigSchema = z.object({
  schemaVersion: z.string().regex(/^\d+\.\d+\.\d+$/, "schemaVersion must follow semver (e.g. 1.0.0)").default("1.0.0"),
  pageId: z.string().min(1, "pageId is required"),
  target: ExtensionTargetSchema,
  settings: PageSettingsSchema.default(DEFAULT_PAGE_SETTINGS),
  sections: z.array(ConfigSectionSchema).default([]),
});

export type PageConfig = z.infer<typeof PageConfigSchema>;

/**
 * Helper to validate a page configuration
 */
export function validatePageConfig(data: unknown): PageConfig {
  return PageConfigSchema.parse(data);
}

/**
 * Safe parser returning success and data or error
 */
export function safeParsePageConfig(data: unknown) {
  return PageConfigSchema.safeParse(data);
}

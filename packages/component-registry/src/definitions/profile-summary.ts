import { z } from "zod";
import type { ComponentDefinition } from "../types.js";

export const ProfileSummaryPropsSchema = z.object({
  showAvatar: z.boolean().default(true),
  showEmail: z.boolean().default(true),
  showPhone: z.boolean().default(false),
  showOrdersCount: z.boolean().default(true),
  badgeText: z.string().optional().default("Active Member"),
  badgeTone: z.enum(["info", "success", "warning", "critical", "neutral"]).default("success"),
  actionLabel: z.string().optional().default("Manage Account"),
  actionUrl: z.string().optional().default("shopify:customer-account/profile"),
});

export type ProfileSummaryProps = z.infer<typeof ProfileSummaryPropsSchema>;

export const ProfileSummarySettingsSchema = z.object({
  cardStyle: z.enum(["subdued", "bordered", "plain"]).default("bordered"),
  padding: z.enum(["none", "tight", "base", "loose"]).default("base"),
});

export type ProfileSummarySettings = z.infer<typeof ProfileSummarySettingsSchema>;

export const profileSummaryDefinition: ComponentDefinition<ProfileSummaryProps, ProfileSummarySettings> = {
  id: "profile-summary",
  label: "Profile Summary",
  category: "account",
  version: "1.0.0",
  icon: "profile",
  defaultProps: {
    showAvatar: true,
    showEmail: true,
    showPhone: false,
    showOrdersCount: true,
    badgeText: "Active Member",
    badgeTone: "success",
    actionLabel: "Manage Account",
    actionUrl: "shopify:customer-account/profile",
  },
  propsSchema: ProfileSummaryPropsSchema,
  settingsSchema: ProfileSummarySettingsSchema,
  supportedTargets: [
    "customer-account.profile.block.render",
    "customer-account.order-index.block.render",
    "customer-account.page.render",
  ],
  requiredScopes: ["customer_account"],
  mobileBehavior: "stack",
};

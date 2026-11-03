import { z } from "zod";
import type { ComponentDefinition } from "../types.js";
import { ReducedIconTypeSchema } from "../icons.js";

export const AnnouncementPropsSchema = z.object({
  title: z.string().default("Welcome to your customer portal"),
  description: z.string().default("Manage your profile, view orders, and explore exclusive member perks."),
  tone: z.enum(["info", "success", "warning", "critical"]).default("info"),
  collapsible: z.boolean().default(false),
  dismissible: z.boolean().default(false),
  buttonLabel: z.string().optional().default(""),
  buttonUrl: z.string().optional().default(""),
  icon: ReducedIconTypeSchema.optional().default("info"),
});

export type AnnouncementProps = z.infer<typeof AnnouncementPropsSchema>;

export const AnnouncementSettingsSchema = z.object({
  padding: z.enum(["none", "tight", "base", "loose"]).default("base"),
  fullWidth: z.boolean().default(false),
});

export type AnnouncementSettings = z.infer<typeof AnnouncementSettingsSchema>;

export const announcementDefinition: ComponentDefinition<AnnouncementProps, AnnouncementSettings> = {
  id: "announcement",
  label: "Announcement",
  category: "communication",
  version: "1.0.0",
  icon: "note",
  defaultProps: {
    title: "Welcome to your customer portal",
    description: "Manage your profile, view orders, and explore exclusive member perks.",
    tone: "info",
    collapsible: false,
    dismissible: false,
    buttonLabel: "",
    buttonUrl: "",
    icon: "info",
  },
  propsSchema: AnnouncementPropsSchema,
  settingsSchema: AnnouncementSettingsSchema,
  supportedTargets: [
    "customer-account.order-status.block.render",
    "customer-account.profile.block.render",
    "customer-account.order-index.block.render",
    "customer-account.order-status.announcement.render",
    "customer-account.profile.announcement.render",
    "customer-account.order-index.announcement.render",
    "customer-account.page.render",
  ],
  requiredScopes: [],
  mobileBehavior: "responsive",
};


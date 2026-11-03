import { z } from "zod";

/**
 * Valid ReducedIconTypes supported in Shopify Checkout and Customer Account UI Extensions.
 * Verified directly via Shopify Dev MCP polaris-customer-account-extensions documentation.
 */
export const REDUCED_ICON_TYPES = [
  "reset",
  "map",
  "menu",
  "search",
  "circle",
  "filter",
  "image",
  "alert-circle",
  "alert-triangle-filled",
  "alert-triangle",
  "arrow-down",
  "arrow-left",
  "arrow-right",
  "arrow-up-right",
  "arrow-up",
  "bag",
  "bullet",
  "calendar",
  "camera",
  "caret-down",
  "cart",
  "cash-dollar",
  "categories",
  "check-circle",
  "check-circle-filled",
  "check",
  "chevron-down",
  "chevron-left",
  "chevron-right",
  "chevron-up",
  "clipboard",
  "clock",
  "credit-card",
  "delete",
  "delivered",
  "delivery",
  "disabled",
  "discount",
  "edit",
  "email",
  "empty",
  "external",
  "geolocation",
  "gift-card",
  "globe",
  "grid",
  "info-filled",
  "info",
  "list-bulleted",
  "location",
  "lock",
  "menu-horizontal",
  "menu-vertical",
  "minus",
  "mobile",
  "note",
  "order",
  "organization",
  "plus",
  "profile",
  "question-circle-filled",
  "question-circle",
  "reorder",
  "return",
  "savings",
  "settings",
  "star-filled",
  "star-half",
  "star",
  "store",
  "truck",
  "upload",
  "x-circle-filled",
  "x-circle",
  "x",
] as const;

export const ReducedIconTypeSchema = z.enum(REDUCED_ICON_TYPES);

export type ReducedIconType = z.infer<typeof ReducedIconTypeSchema>;

/**
 * Verify whether an icon type is supported in customer account UI extensions
 */
export function isValidCustomerAccountIcon(icon: string): icon is ReducedIconType {
  return (REDUCED_ICON_TYPES as readonly string[]).includes(icon);
}

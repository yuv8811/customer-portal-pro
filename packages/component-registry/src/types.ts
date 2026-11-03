import { z } from "zod";
import type { ExtensionTarget } from "@customer-portal-pro/config-schema";
import type { ReducedIconType } from "./icons.js";

export type ComponentCategory = "communication" | "account" | "commerce" | "layout";

export type MobileBehavior = "stack" | "scroll" | "hide" | "inherit" | "responsive";

export interface ComponentDefinition<
  TProps = Record<string, unknown>,
  TSettings = Record<string, unknown>,
> {
  id: string;
  label: string;
  category: ComponentCategory;
  version: string;
  icon: ReducedIconType;
  defaultProps: TProps;
  propsSchema: z.ZodType<TProps, any, any>;
  settingsSchema?: z.ZodType<TSettings, any, any>;
  supportedTargets: ExtensionTarget[];
  requiredScopes: string[];
  mobileBehavior: MobileBehavior;
}

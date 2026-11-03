import { z, type ZodTypeDef } from "zod";
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
  propsSchema: z.ZodType<TProps, ZodTypeDef, unknown>;
  settingsSchema?: z.ZodType<TSettings, ZodTypeDef, unknown>;
  supportedTargets: ExtensionTarget[];
  requiredScopes: string[];
  mobileBehavior: MobileBehavior;
}

export type AnyComponentDefinition = ComponentDefinition<Record<string, unknown>, Record<string, unknown>>;

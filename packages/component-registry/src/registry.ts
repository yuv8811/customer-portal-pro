import type { ExtensionTarget } from "@customer-portal-pro/config-schema";
import type { ComponentDefinition } from "./types.js";
import { announcementDefinition } from "./definitions/announcement.js";
import { profileSummaryDefinition } from "./definitions/profile-summary.js";

/**
 * Registry holding all available component definitions (MVP components only)
 */
export const COMPONENT_REGISTRY: Record<string, ComponentDefinition<any, any>> = {
  [announcementDefinition.id]: announcementDefinition,
  [profileSummaryDefinition.id]: profileSummaryDefinition,
};

/**
 * Get definition for a component ID
 */
export function getComponentDefinition(id: string): ComponentDefinition<any, any> | undefined {
  return COMPONENT_REGISTRY[id];
}

/**
 * Get all registered component definitions
 */
export function getAllComponentDefinitions(): ComponentDefinition<any, any>[] {
  return Object.values(COMPONENT_REGISTRY);
}

/**
 * Get components compatible with a specific extension target
 */
export function getComponentsForTarget(target: ExtensionTarget): ComponentDefinition<any, any>[] {
  return getAllComponentDefinitions().filter((def) => def.supportedTargets.includes(target));
}


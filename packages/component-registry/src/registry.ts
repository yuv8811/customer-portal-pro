import type { ExtensionTarget } from "@customer-portal-pro/config-schema";
import type { AnyComponentDefinition } from "./types.js";
import { announcementDefinition } from "./definitions/announcement.js";
import { profileSummaryDefinition } from "./definitions/profile-summary.js";

/**
 * Registry holding all available component definitions (MVP components only)
 */
export const COMPONENT_REGISTRY: Record<string, AnyComponentDefinition> = {
  [announcementDefinition.id]: announcementDefinition as unknown as AnyComponentDefinition,
  [profileSummaryDefinition.id]: profileSummaryDefinition as unknown as AnyComponentDefinition,
};

/**
 * Get definition for a component ID
 */
export function getComponentDefinition(id: string): AnyComponentDefinition | undefined {
  return COMPONENT_REGISTRY[id];
}

/**
 * Get all registered component definitions
 */
export function getAllComponentDefinitions(): AnyComponentDefinition[] {
  return Object.values(COMPONENT_REGISTRY);
}

/**
 * Get components compatible with a specific extension target
 */
export function getComponentsForTarget(target: ExtensionTarget): AnyComponentDefinition[] {
  return getAllComponentDefinitions().filter((def) => def.supportedTargets.includes(target));
}

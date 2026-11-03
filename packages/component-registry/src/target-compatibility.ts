import type { ExtensionTarget, PageConfig } from "@customer-portal-pro/config-schema";
import { getComponentDefinition } from "./registry.js";

export interface CompatibilityResult {
  compatible: boolean;
  reason?: string;
}

/**
 * Direct map of component ID to supported extension targets
 */
export const targetCompatibilityMap: Record<string, readonly ExtensionTarget[]> = {
  announcement: [
    "customer-account.order-status.block.render",
    "customer-account.profile.block.render",
    "customer-account.order-index.block.render",
    "customer-account.order-status.announcement.render",
    "customer-account.profile.announcement.render",
    "customer-account.order-index.announcement.render",
    "customer-account.page.render",
  ],
  "profile-summary": [
    "customer-account.profile.block.render",
    "customer-account.order-index.block.render",
    "customer-account.page.render",
  ],
};

/**
 * Checks whether a single component type is compatible with a given extension target
 */
export function checkComponentTargetCompatibility(
  componentId: string,
  target: ExtensionTarget
): CompatibilityResult {
  const component = getComponentDefinition(componentId);
  if (!component) {
    return {
      compatible: false,
      reason: `Component "${componentId}" is not recognized in the component registry.`,
    };
  }

  const isSupported = component.supportedTargets.includes(target);
  if (!isSupported) {
    return {
      compatible: false,
      reason: `Component "${component.label}" (${componentId}) cannot be placed in target "${target}". Supported targets: ${component.supportedTargets.join(", ")}.`,
    };
  }

  return { compatible: true };
}

/**
 * Validates an entire PageConfig against the component registry and target compatibility.
 * Checks:
 * 1. Target compatibility for every block in every section.
 * 2. Component props schema validation according to registry propsSchema.
 * 3. Settings schema validation.
 */
export function validateConfigCompatibility(config: PageConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const target = config.target;

  for (const section of config.sections) {
    for (const block of section.blocks) {
      const component = getComponentDefinition(block.type);

      if (!component) {
        errors.push(`Section "${section.id}" contains unknown component type "${block.type}" in block "${block.id}".`);
        continue;
      }

      // Check target compatibility
      const compat = checkComponentTargetCompatibility(block.type, target);
      if (!compat.compatible) {
        errors.push(`Block "${block.id}" in section "${section.id}": ${compat.reason}`);
      }

      // Check props schema
      const propsResult = component.propsSchema.safeParse(block.props);
      if (!propsResult.success) {
        const issues = propsResult.error.issues ?? [];
        errors.push(
          `Block "${block.id}" (${block.type}) props validation failed: ` +
            issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
        );
      }

      // Check settings schema if defined
      if (component.settingsSchema && block.settings) {
        const settingsResult = component.settingsSchema.safeParse(block.settings);
        if (!settingsResult.success) {
          const issues = settingsResult.error.issues ?? [];
          errors.push(
            `Block "${block.id}" (${block.type}) settings validation failed: ` +
              issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
          );
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

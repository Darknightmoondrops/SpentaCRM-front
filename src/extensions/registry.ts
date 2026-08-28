import type { ExtensionDefinition } from "./sdk";
import { coreThemeExtension } from "./builtins/core";
import { graphiteThemeExtension } from "./builtins/graphite";
import { midnightThemeExtension } from "./builtins/midnight";
import { sampleWidgetExtension } from "./builtins/sample-widget";
import { crimsonThemeExtension } from "./builtins/crimson";
import { arcaneThemeExtension } from "./builtins/arcane";
import { generatedExtensions } from "./generated-registry";

/**
 * Compile-time extension registry.
 * External code extensions are installed as packages and registered here (or by a future generated registry).
 * Runtime-uploaded theme packages are loaded by ExtensionProvider and never execute JavaScript.
 */
export const extensionRegistry: ExtensionDefinition[] = [
  coreThemeExtension,
  graphiteThemeExtension,
  midnightThemeExtension,
  crimsonThemeExtension,
  arcaneThemeExtension,
  sampleWidgetExtension,
  ...generatedExtensions,
];

/**
 * SpentaCRM core bridge to the local Extension SDK source.
 *
 * The application intentionally imports the SDK by relative source path instead of
 * resolving `@spentacrm/extension-sdk` from node_modules. This keeps a freshly
 * unzipped/installed SpentaCRM checkout self-contained and prevents a missing
 * workspace-link/package-manager issue during `next dev` and `next build`.
 *
 * Third-party/trusted extension projects can still import the package name
 * `@spentacrm/extension-sdk`; the package source lives in packages/extension-sdk.
 */
export * from "../../packages/extension-sdk/src/index";

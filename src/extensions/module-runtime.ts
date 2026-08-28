import { readRuntimeFile } from "./module-store";

function mimeFor(path: string) {
  const ext = path.split(".").pop()?.toLowerCase();
  return ({
    css: "text/css",
    js: "text/javascript",
    mjs: "text/javascript",
    json: "application/json",
    svg: "image/svg+xml",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    ico: "image/x-icon",
    woff: "font/woff",
    woff2: "font/woff2",
    txt: "text/plain",
  } as Record<string, string>)[ext || ""] || "application/octet-stream";
}

function dirname(path: string) {
  const index = path.lastIndexOf("/");
  return index < 0 ? "" : path.slice(0, index + 1);
}

function normalizePath(base: string, target: string) {
  if (/^(?:[a-z]+:|\/\/|#)/i.test(target)) return null;
  const parts = `${base}${target}`.split("/");
  const out: string[] = [];
  for (const part of parts) {
    if (!part || part === ".") continue;
    if (part === "..") {
      if (!out.length) return null;
      out.pop();
    } else out.push(part);
  }
  return out.join("/");
}

function toDataUrl(buffer: ArrayBuffer, mime: string) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return `data:${mime};base64,${btoa(binary)}`;
}

function safeJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export type RuntimeSurfaceContext = {
  extensionId: string;
  surfaceId: string;
  surfaceType: "page" | "widget" | "entity-tab";
  entityType?: string;
  entityId?: string;
};

/**
 * Loads a bundled HTML entry from IndexedDB and inlines local CSS/JS/assets so the
 * resulting document can execute inside a sandboxed srcDoc iframe without network access.
 * Runtime JS should be bundled (no relative ESM imports) before packaging.
 */
export async function buildRuntimeDocument(extensionId: string, entry: string, context: RuntimeSurfaceContext) {
  const htmlBuffer = await readRuntimeFile(extensionId, entry);
  if (!htmlBuffer) throw new Error(`Module entry ${entry} is missing. Reinstall the module package.`);
  const html = new TextDecoder().decode(htmlBuffer);
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const base = dirname(entry);

  for (const link of Array.from(doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][href]'))) {
    const target = normalizePath(base, link.getAttribute("href") || "");
    if (!target) continue;
    const buffer = await readRuntimeFile(extensionId, target);
    if (!buffer) throw new Error(`Module stylesheet ${target} is missing.`);
    const style = doc.createElement("style");
    style.textContent = new TextDecoder().decode(buffer);
    link.replaceWith(style);
  }

  for (const script of Array.from(doc.querySelectorAll<HTMLScriptElement>("script[src]"))) {
    const target = normalizePath(base, script.getAttribute("src") || "");
    if (!target) continue;
    const buffer = await readRuntimeFile(extensionId, target);
    if (!buffer) throw new Error(`Module script ${target} is missing.`);
    const inline = doc.createElement("script");
    inline.type = script.type || "text/javascript";
    inline.textContent = new TextDecoder().decode(buffer);
    script.replaceWith(inline);
  }

  const assetSelectors = ["img[src]", "source[src]", "video[poster]", "audio[src]"];
  for (const selector of assetSelectors) {
    for (const element of Array.from(doc.querySelectorAll<HTMLElement>(selector))) {
      const attr = element.hasAttribute("poster") ? "poster" : "src";
      const raw = element.getAttribute(attr) || "";
      const target = normalizePath(base, raw);
      if (!target) continue;
      const buffer = await readRuntimeFile(extensionId, target);
      if (!buffer) continue;
      element.setAttribute(attr, toDataUrl(buffer, mimeFor(target)));
    }
  }

  const bootstrap = doc.createElement("script");
  bootstrap.textContent = `
    window.SpentaCRM = Object.freeze({
      context: ${safeJson(context)},
      post(type, payload) { parent.postMessage({ source: "spentacrm-module", extensionId: ${safeJson(extensionId)}, type, payload }, "*"); },
      ready(payload) { this.post("ready", payload || null); },
      resize(height) { this.post("resize", { height: Number(height) || document.documentElement.scrollHeight }); },
      navigate(href) { this.post("navigate", { href: String(href || "") }); }
    });
    window.addEventListener("DOMContentLoaded", () => {
      window.SpentaCRM.ready();
      const sendSize = () => window.SpentaCRM.resize(document.documentElement.scrollHeight);
      sendSize();
      if (window.ResizeObserver) new ResizeObserver(sendSize).observe(document.documentElement);
    });
  `;
  doc.head.prepend(bootstrap);

  const securityMeta = doc.createElement("meta");
  securityMeta.httpEquiv = "Content-Security-Policy";
  securityMeta.content = "default-src 'none'; img-src data: https:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; font-src data:; connect-src https: http://localhost http://127.0.0.1; form-action 'none'; base-uri 'none';";
  doc.head.prepend(securityMeta);

  return `<!doctype html>${doc.documentElement.outerHTML}`;
}

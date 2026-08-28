const ZIP_EOCD = 0x06054b50;
const ZIP_CENTRAL = 0x02014b50;
const ZIP_LOCAL = 0x04034b50;
const MAX_ZIP_BYTES = 16 * 1024 * 1024;
const MAX_TOTAL_UNCOMPRESSED_BYTES = 32 * 1024 * 1024;
const MAX_ENTRY_BYTES = 8 * 1024 * 1024;
const MAX_MANIFEST_BYTES = 512 * 1024;
const MANIFEST_NAMES = ["spenta-module.json", "extension.json"];

export type SpentaModuleArchive = {
  manifestText: string;
  manifestPath: string;
  files: Record<string, ArrayBuffer>;
  fileNames: string[];
};

function findEocd(view: DataView) {
  const min = Math.max(0, view.byteLength - 65557);
  for (let offset = view.byteLength - 22; offset >= min; offset--) {
    if (view.getUint32(offset, true) === ZIP_EOCD) return offset;
  }
  return -1;
}

async function inflateRaw(bytes: Uint8Array) {
  if (typeof DecompressionStream === "undefined") throw new Error("This browser cannot decompress ZIP packages.");
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function safeEntryName(name: string) {
  if (!name || name.startsWith("/") || name.includes("../") || name.includes("..\\") || name.includes("\\")) return false;
  const normalized = name.replace(/^\.\//, "");
  return normalized.length > 0 && normalized.length <= 260 && !normalized.split("/").some(part => part === ".." || part === ".");
}

function copyBuffer(bytes: Uint8Array) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

export async function readSpentaModuleArchive(file: File): Promise<SpentaModuleArchive> {
  if (file.size > MAX_ZIP_BYTES) throw new Error("Module ZIP packages must be 16 MB or smaller.");
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const eocd = findEocd(view);
  if (eocd < 0) throw new Error("The selected file is not a valid ZIP package.");

  const entries = view.getUint16(eocd + 10, true);
  let offset = view.getUint32(eocd + 16, true);
  const decoder = new TextDecoder();
  const files: Record<string, ArrayBuffer> = {};
  let manifestText = "";
  let manifestPath = "";
  let totalUncompressed = 0;

  for (let index = 0; index < entries; index++) {
    if (offset + 46 > view.byteLength || view.getUint32(offset, true) !== ZIP_CENTRAL) throw new Error("The ZIP central directory is invalid.");
    const flags = view.getUint16(offset + 8, true);
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const uncompressedSize = view.getUint32(offset + 24, true);
    const fileNameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);
    const name = decoder.decode(bytes.slice(offset + 46, offset + 46 + fileNameLength)).replace(/^\.\//, "");

    if (!safeEntryName(name)) throw new Error(`The ZIP contains an unsafe file path: ${name || "<empty>"}.`);
    if ((flags & 0x1) !== 0) throw new Error("Encrypted ZIP entries are not supported.");
    if (!name.endsWith("/")) {
      if (uncompressedSize > MAX_ENTRY_BYTES) throw new Error(`Module file ${name} is larger than 8 MB.`);
      totalUncompressed += uncompressedSize;
      if (totalUncompressed > MAX_TOTAL_UNCOMPRESSED_BYTES) throw new Error("The uncompressed module is larger than 32 MB.");
      if (localOffset + 30 > view.byteLength || view.getUint32(localOffset, true) !== ZIP_LOCAL) throw new Error(`The ZIP entry ${name} is invalid.`);
      const localNameLength = view.getUint16(localOffset + 26, true);
      const localExtraLength = view.getUint16(localOffset + 28, true);
      const dataStart = localOffset + 30 + localNameLength + localExtraLength;
      const dataEnd = dataStart + compressedSize;
      if (dataEnd > bytes.byteLength) throw new Error(`The ZIP entry ${name} is truncated.`);
      const compressed = bytes.slice(dataStart, dataEnd);
      let raw: Uint8Array;
      if (method === 0) raw = compressed;
      else if (method === 8) raw = await inflateRaw(compressed);
      else throw new Error(`Unsupported ZIP compression method ${method} in ${name}.`);
      if (raw.byteLength !== uncompressedSize && uncompressedSize !== 0) throw new Error(`The ZIP entry ${name} has an invalid size.`);
      files[name] = copyBuffer(raw);

      const baseName = name.split("/").pop()?.toLowerCase();
      if (!manifestText && baseName && MANIFEST_NAMES.includes(baseName)) {
        if (raw.byteLength > MAX_MANIFEST_BYTES) throw new Error("The module manifest is too large.");
        manifestText = decoder.decode(raw);
        manifestPath = name;
      }
    }
    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  if (!manifestText) throw new Error("No spenta-module.json or extension.json manifest was found in the ZIP.");
  return { manifestText, manifestPath, files, fileNames: Object.keys(files) };
}

/** Backward-compatible helper used by older callers. */
export async function readSpentaModuleManifest(file: File): Promise<string> {
  return (await readSpentaModuleArchive(file)).manifestText;
}

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const [action, specifier] = process.argv.slice(2);
if (!['add','remove'].includes(action) || !specifier) {
  console.error('Usage: node scripts/manage-extension.mjs <add|remove> <module-specifier>');
  process.exit(1);
}
const root = process.cwd();
const configPath = path.join(root, 'spenta.extensions.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const current = new Set(Array.isArray(config.extensions) ? config.extensions : []);
if (action === 'add') current.add(specifier);
else current.delete(specifier);
config.extensions = [...current].sort();
fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
const sync = spawnSync(process.execPath, [path.join(root, 'scripts/sync-extensions.mjs')], { stdio: 'inherit' });
if (sync.status !== 0) process.exit(sync.status ?? 1);
console.log(`${action === 'add' ? 'Registered' : 'Removed'} ${specifier}.`);

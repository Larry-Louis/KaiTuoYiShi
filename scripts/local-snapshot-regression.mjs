import fs from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function expectAll(source, needles, label) {
  for (const needle of needles) {
    const found = typeof needle === 'string' ? source.includes(needle) : needle.test(source);
    assert(found, label + ': missing ' + String(needle));
  }
}

const dbService = fs.readFileSync('services/dbService.ts', 'utf8');
const viteConfig = fs.readFileSync('vite.config.ts', 'utf8');
const useGameState = fs.readFileSync('hooks/useGameState.ts', 'utf8');
const gitignore = fs.readFileSync('.gitignore', 'utf8');

// dbService: per-store dump / restore / debounced backup + triggers
expectAll(dbService, [
  "const LOCAL_SNAPSHOT_ENDPOINT_BASE = '/api/local-save/snapshot';",
  'export interface LocalIndexedDbSnapshot {',
  'version: 1;',
  'export async function exportIndexedDbSnapshot(): Promise<LocalIndexedDbSnapshot>',
  'export async function importIndexedDbSnapshot(snapshot: LocalIndexedDbSnapshot): Promise<void>',
  'export async function tryRestoreLocalSnapshot(): Promise<boolean>',
  'function scheduleLocalSnapshotBackup(): void {',
  'async function flushLocalSnapshotBackup(): Promise<void>',
  // per-store file URL in restore loop
  /encodeURIComponent\(storeName\)/,
  // per-store content comparison before PUT
  /if \(serialized === lastLocalSnapshotSerialized\[storeName\]\) continue;/,
  /scheduleLocalSnapshotBackup\(\);/,
  // trigger after save write
  /rotateManagedSavesSafely\(db\);\r?\n\s*scheduleLocalSnapshotBackup\(\);/,
  // trigger after setting write
  /await promise;\r?\n\s*scheduleLocalSnapshotBackup\(\);/,
], 'dbService local snapshot contract');

// vite.config: per-store file bridge middleware (whitelist + atomic tmp + rename)
expectAll(viteConfig, [
  "server.middlewares.use('/api/local-save/snapshot', handleLocalSnapshot);",
  "const LOCAL_SNAPSHOT_STORE_WHITELIST = ['saves', 'saveSummaries', 'saveAssets', 'saveNodeDeltas', 'settings'];",
  'function localSnapshotFilePath(store: string): string {',
  'LOCAL_SNAPSHOT_STORE_WHITELIST.includes(store)',
  'rename(tmpFile, file)',
  "readFile(file, 'utf8')",
], 'vite local-save middleware contract');

// useGameState: restore before settings load
expectAll(useGameState, [
  'await tryRestoreLocalSnapshot();',
  'tryRestoreLocalSnapshot } from \'@/services/dbService\'',
], 'startup restore contract');

// .gitignore excludes the per-store mirror files
expectAll(gitignore, [
  'save/snapshot-*.json',
  'save/snapshot-*.json.tmp',
], 'gitignore snapshot policy');

console.log('local snapshot regression ok');
/**
 * Copies all namespace migration files to the dist directory.
 *
 * This script is part of the build process and ensures that SQL migration
 * files are included in the npm package distribution.
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const srcInfraDir = path.join(rootDir, 'src', 'infrastructure');
const distInfraDir = path.join(rootDir, 'dist', 'infrastructure');

let copiedCount = 0;

const migrationsConfigPath = path.join(
  distInfraDir,
  'persistence',
  'migrations.config.js'
);

if (!fs.existsSync(migrationsConfigPath)) {
  throw new Error(
    `Missing ${migrationsConfigPath}. Run \"npm run build\" (tsc) before copying migrations.`
  );
}

const { getNamespaceMigrations } = await import(
  pathToFileURL(migrationsConfigPath).href
);

const namespaces = getNamespaceMigrations(srcInfraDir);

for (const { path: srcMigrationsDir } of namespaces) {
  const relPath = path.relative(srcInfraDir, srcMigrationsDir);
  const distMigrationsDir = path.join(distInfraDir, relPath);

  if (fs.existsSync(srcMigrationsDir)) {
    fs.copySync(srcMigrationsDir, distMigrationsDir);
    const files = fs.readdirSync(srcMigrationsDir).filter(f => f.endsWith('.sql'));
    copiedCount += files.length;
  }
}

console.log(`✅ Copied ${copiedCount} migration files to dist/`);

/** Recuperación autorizada 03-09-2026: entrada alfa independiente, sin SDK anterior. */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

if (!existsSync('company-analysis/node_modules/vite')) execSync('npm ci --prefix company-analysis', { stdio: 'inherit' });
execSync('npm run build --prefix company-analysis', { stdio: 'inherit' });

import { cpSync, rmSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const src = resolve('out/web');
const dest = resolve('android/app/src/main/assets');

try { rmSync(dest, { recursive: true, force: true }); } catch {}
mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log(`✅ Web build copied to ${dest}`);

#!/usr/bin/env node
/**
 * Build Basiliska for GitHub Pages and push the gh-pages branch.
 * Live URL: https://machine10101-vibes.github.io/Basiliska/
 *
 * Same pattern as the other machine10101-vibes games. Prefer the
 * `.github/workflows/pages.yml` Action on `main`; this script is the
 * agent-side fallback when we already have a GitHub remote.
 */
import { spawn } from 'node:child_process';
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const BASE = '/Basiliska/';
const DIST = join(ROOT, 'dist');
const WORKTREE = '/tmp/basiliska-gh-pages';
const LIVE = 'https://machine10101-vibes.github.io/Basiliska/';
const REMOTE = process.env.PAGES_REMOTE || 'origin';

function sh(cmd) {
  return new Promise((resolve, reject) => {
    const child = spawn('bash', ['-lc', cmd], { cwd: ROOT, stdio: 'inherit' });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited ${code}`));
    });
  });
}

await sh(`VITE_BASE=${BASE} npm run build`);
writeFileSync(join(DIST, '.nojekyll'), '');
writeFileSync(join(DIST, '404.html'), await import('node:fs').then((fs) => fs.readFileSync(join(DIST, 'index.html'))));

const sha = await new Promise((resolve, reject) => {
  const child = spawn('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT });
  let out = '';
  child.stdout.on('data', (d) => {
    out += d;
  });
  child.on('exit', (code) => (code === 0 ? resolve(out.trim()) : reject(new Error('rev-parse failed'))));
});

await sh(`git worktree remove --force ${WORKTREE} 2>/dev/null || true`);
mkdirSync(WORKTREE, { recursive: true });

const fetched = await sh(`git fetch ${REMOTE} gh-pages`).then(
  () => true,
  () => false,
);
if (fetched) {
  await sh(`git worktree add -B gh-pages ${WORKTREE} ${REMOTE}/gh-pages`);
} else {
  await sh(`git worktree add --detach ${WORKTREE}`);
  await sh(`git -C ${WORKTREE} checkout --orphan gh-pages`);
}

await sh(`find ${WORKTREE} -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +`);
cpSync(DIST, WORKTREE, { recursive: true });
await sh(`git -C ${WORKTREE} add -A`);
await sh(
  `git -C ${WORKTREE} diff --cached --quiet && echo 'gh-pages already up to date' || git -C ${WORKTREE} commit -m "deploy: ${sha}"`,
);
await sh(`git -C ${WORKTREE} push -u ${REMOTE} gh-pages`);
await sh(`git worktree remove --force ${WORKTREE}`);

console.log(`Published ${LIVE}`);

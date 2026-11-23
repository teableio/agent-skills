#!/usr/bin/env node
// Turn a checkout of main into the Claude directory edition of the plugin,
// as described by .github/claude-directory.json: omit files, apply exact
// edits, then fail if anything the edition must not contain is still there
// (a forbidden pattern, or a link to an omitted file).
//
// Usage:
//   node scripts/build-claude-directory.mjs           rewrite plugins/teable in place
//   node scripts/build-claude-directory.mjs --check   build into a temp copy, report only
// Exit codes: 0 — ok, 1 — an edit no longer matches or a check failed.
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';

const REPO_ROOT = process.cwd();
const config = JSON.parse(readFileSync(join(REPO_ROOT, '.github', 'claude-directory.json'), 'utf8'));
const check = process.argv.includes('--check');

let pluginDir = join(REPO_ROOT, config.pluginRoot);
let scratch;
if (check) {
  scratch = mkdtempSync(join(tmpdir(), 'claude-directory-'));
  cpSync(pluginDir, scratch, { recursive: true });
  pluginDir = scratch;
}

const errors = [];

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) yield* walk(path);
    else yield path;
  }
}

function globToRegExp(glob) {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*');
  return new RegExp(`^${escaped}$`);
}

// 1. Omit files.
const omitted = [];
for (const pattern of config.omitFiles) {
  const re = globToRegExp(pattern);
  const matches = [...walk(pluginDir)].filter((path) => re.test(relative(pluginDir, path)));
  if (matches.length === 0) errors.push(`omitFiles: "${pattern}" matches no file`);
  for (const path of matches) {
    omitted.push(relative(pluginDir, path));
    rmSync(path);
  }
}

// 2. Exact edits, each matching exactly once.
for (const edit of config.edits) {
  const path = join(pluginDir, edit.file);
  if (!existsSync(path)) {
    errors.push(`${edit.file}: file not found`);
    continue;
  }
  const text = readFileSync(path, 'utf8');
  if (edit.removeLineContaining !== undefined) {
    const lines = text.split('\n');
    const hits = lines.filter((line) => line.includes(edit.removeLineContaining));
    if (hits.length !== 1) {
      errors.push(`${edit.file}: "${edit.removeLineContaining}" matches ${hits.length} lines, expected 1`);
      continue;
    }
    writeFileSync(path, lines.filter((line) => !line.includes(edit.removeLineContaining)).join('\n'));
  } else {
    const count = text.split(edit.find).length - 1;
    if (count !== 1) {
      errors.push(`${edit.file}: edit text matches ${count} times, expected 1: ${JSON.stringify(edit.find.slice(0, 80))}`);
      continue;
    }
    writeFileSync(path, text.replace(edit.find, edit.replace));
  }
}

// 3. Checks on the result.
const forbid = config.forbid.map((source) => new RegExp(source));
const omittedNames = omitted.map((path) => path.split('/').pop());
for (const path of walk(pluginDir)) {
  if (!/\.(md|json)$/.test(path)) continue;
  const rel = relative(pluginDir, path);
  readFileSync(path, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      for (const re of forbid) {
        if (re.test(line)) errors.push(`${rel}:${i + 1}: forbidden in the directory edition: ${re.source}`);
      }
      for (const match of line.matchAll(/\]\(([^)#\s]+)(?:#[^)]*)?\)/g)) {
        const target = match[1];
        if (/^[a-z]+:/i.test(target)) continue;
        const resolved = resolve(dirname(path), target);
        if (!existsSync(resolved)) {
          const name = target.split('/').pop();
          const why = omittedNames.includes(name) ? 'omitted file' : 'missing file';
          errors.push(`${rel}:${i + 1}: link to ${why}: ${target}`);
        }
      }
    });
}

if (scratch) rmSync(scratch, { recursive: true, force: true });

if (errors.length) {
  console.error(errors.join('\n'));
  console.error(
    `\n${errors.length} problem(s) building the Claude directory edition. Update .github/claude-directory.json ` +
      'to match the current plugin text (or the plugin text to drop the refused content).'
  );
  process.exit(1);
}
console.log(
  `Claude directory edition ${check ? 'checks out' : 'built'}: ${omitted.length} file(s) omitted, ${config.edits.length} edit(s) applied.`
);

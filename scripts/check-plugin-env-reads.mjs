#!/usr/bin/env node
// Fail when a file in the plugin reads an environment variable or names a
// credential variable.
//
// The Claude plugin directory holds a plugin for policy review when its files
// show credentials read from the environment (process.env.X, $X_TOKEN, ...),
// and it rescans on every merge. The skill describes such variables in prose
// and leaves the code to `teable get-doc --topic <t>`, fetched live; this
// check keeps both human edits and automated doc syncs (mirrored get-doc
// topics, the pi agent) from bringing the patterns back.
//
// Placeholders that start with YOUR_ (YOUR_API_KEY) are allowed.
//
// Usage: node scripts/check-plugin-env-reads.mjs
// Exit codes: 0 — clean, 1 — findings.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const REPO_ROOT = process.cwd();
const PLUGIN_DIR = join(REPO_ROOT, 'plugins', 'teable');
const BINARY = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.svg']);
const CREDENTIAL = '(?:TOKEN|KEY|SECRET|PASSWORD|PASSWD|PASS|APIKEY|CREDENTIALS?)';

const RULES = [
  { name: 'environment read', re: /\bprocess\.env\b|\bos\.environ\b|\bgetenv\s*\(|\bDeno\.env\b|\bimport\.meta\.env\b|\bBun\.env\b/g },
  { name: 'shell environment variable', re: /\$\{?[A-Z][A-Z0-9_]*\b/g },
  { name: 'credential template variable', re: new RegExp(`\\$\\{\\s*\\w*${CREDENTIAL}\\w*\\s*\\}`, 'gi') },
  {
    name: 'credential-named variable',
    re: new RegExp(`\\b(?!YOUR_)[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_${CREDENTIAL}\\b`, 'g'),
  },
];

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith('.')) continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (!BINARY.has(extname(entry).toLowerCase())) yield path;
  }
}

const findings = [];
for (const file of walk(PLUGIN_DIR)) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((text, i) => {
    for (const { name, re } of RULES) {
      for (const match of text.matchAll(re)) {
        findings.push(`${relative(REPO_ROOT, file)}:${i + 1}: ${name} \`${match[0]}\``);
      }
    }
  });
}

if (findings.length) {
  console.error(findings.join('\n'));
  console.error(
    `\n${findings.length} finding(s). The Claude plugin directory holds plugins that read credentials from the environment.\n` +
      'Describe the variable in prose and point at `teable get-doc --topic <t>`, or exclude the mirrored topic in\n' +
      '.github/teable-docs-exclusions.json. Use a YOUR_* placeholder where a value must be shown.'
  );
  process.exit(1);
}
console.log('No environment reads or credential-named variables in plugins/teable/.');

#!/usr/bin/env node
// Structural diff between two `teable manifest` snapshots.
//
// Usage: node scripts/diff-cli-manifest.mjs <old-manifest.json> <new-manifest.json>
//
// Writes a markdown change summary to stdout.
// Exit codes:
//   0  — no material change (only the top-level `version` field differs)
//   10 — material changes found (also used for bootstrap, when <old> does not exist)
//   1  — error
import { readFileSync, existsSync } from 'node:fs';

const MAX_OUTPUT_BYTES = 150_000;

const [oldPath, newPath] = process.argv.slice(2);
if (!oldPath || !newPath) {
  console.error('usage: diff-cli-manifest.mjs <old-manifest.json> <new-manifest.json>');
  process.exit(1);
}

const readManifest = (p) => JSON.parse(readFileSync(p, 'utf8'));

// Root and subcommands share one node shape for the walk.
function rootNode(manifest) {
  return {
    name: manifest.name ?? 'teable',
    description: manifest.description,
    options: manifest.options,
    help: manifest.help,
    subcommands: manifest.commands,
  };
}

function flatten(manifest) {
  const map = new Map();
  const walk = (node, path) => {
    map.set(path, node);
    for (const sub of node.subcommands ?? []) walk(sub, `${path} ${sub.name}`);
  };
  walk(rootNode(manifest), manifest.name ?? 'teable');
  return map;
}

const show = (v) => (typeof v === 'string' ? JSON.stringify(v) : JSON.stringify(v ?? null));
const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

function optionKey(opt) {
  return opt.flags;
}

function diffOptions(oldOpts = [], newOpts = [], lines, indent) {
  const oldMap = new Map(oldOpts.map((o) => [optionKey(o), o]));
  const newMap = new Map(newOpts.map((o) => [optionKey(o), o]));
  for (const [key, opt] of newMap) {
    if (!oldMap.has(key)) {
      lines.push(`${indent}- added option \`${key}\`${opt.description ? ` — ${opt.description}` : ''}`);
    }
  }
  for (const key of oldMap.keys()) {
    if (!newMap.has(key)) lines.push(`${indent}- removed option \`${key}\``);
  }
  for (const [key, next] of newMap) {
    const prev = oldMap.get(key);
    if (!prev) continue;
    for (const field of ['description', 'required', 'choices', 'default', 'defaultDescription', 'env']) {
      if (!same(prev[field], next[field])) {
        lines.push(`${indent}- option \`${key}\`: ${field} changed ${show(prev[field])} → ${show(next[field])}`);
      }
    }
  }
}

function helpDetails(title, text) {
  return ['<details>', `<summary>${title}</summary>`, '', '```text', (text ?? '').trimEnd(), '```', '', '</details>'];
}

function listTree(manifest, lines) {
  for (const [path, node] of flatten(manifest)) {
    const notes = [];
    if (node.availability) notes.push(node.availability);
    lines.push(`- \`${path}\`${node.summary ? ` — ${node.summary}` : ''}${notes.length ? ` _(${notes.join(', ')})_` : ''}`);
  }
}

const next = readManifest(newPath);

const lines = [];
let changed = false;

if (!existsSync(oldPath)) {
  changed = true;
  lines.push(`# Initial sync — no previous manifest snapshot`);
  lines.push('');
  lines.push(
    `There is no committed snapshot to diff against, so this is a full bootstrap to ` +
      `\`@teable/cli\` v${next.version}. Every documented command and flag should be checked against the manifest.`
  );
  lines.push('', '## Full command surface', '');
  listTree(next, lines);
} else {
  const prev = readManifest(oldPath);
  const oldMap = flatten(prev);
  const newMap = flatten(next);

  const added = [...newMap.keys()].filter((p) => !oldMap.has(p));
  const removed = [...oldMap.keys()].filter((p) => !newMap.has(p));

  lines.push(`# Teable CLI command-surface changes: v${prev.version} → v${next.version}`);
  lines.push('');

  if (added.length) {
    changed = true;
    lines.push('## Added commands', '');
    for (const path of added) {
      const node = newMap.get(path);
      lines.push(`### \`${path}\``);
      if (node.summary || node.description) lines.push('', node.summary ?? node.description);
      lines.push('', ...helpDetails(`help: ${path}`, node.help), '');
    }
  }

  if (removed.length) {
    changed = true;
    lines.push('## Removed commands', '');
    for (const path of removed) lines.push(`- \`${path}\` — remove or rewrite every doc mention of it`);
    lines.push('');
  }

  const changedSections = [];
  for (const [path, node] of newMap) {
    const old = oldMap.get(path);
    if (!old) continue;
    const cmdLines = [];
    if (!same(old.aliases, node.aliases)) cmdLines.push(`- aliases changed ${show(old.aliases)} → ${show(node.aliases)}`);
    if (!same(old.availability, node.availability))
      cmdLines.push(`- availability changed ${show(old.availability)} → ${show(node.availability)}`);
    if (!same(old.summary, node.summary)) cmdLines.push(`- summary changed ${show(old.summary)} → ${show(node.summary)}`);
    if (!same(old.description, node.description))
      cmdLines.push(`- description changed ${show(old.description)} → ${show(node.description)}`);
    if (!same(old.arguments, node.arguments))
      cmdLines.push(`- arguments changed ${show(old.arguments)} → ${show(node.arguments)}`);
    diffOptions(old.options, node.options, cmdLines, '');
    if (!same(old.help, node.help)) {
      cmdLines.push('- rendered help text changed:');
      cmdLines.push(...helpDetails(`help: ${path} (old)`, old.help));
      cmdLines.push(...helpDetails(`help: ${path} (new)`, node.help));
    }
    if (cmdLines.length) changedSections.push({ path, cmdLines });
  }

  if (changedSections.length) {
    changed = true;
    lines.push('## Changed commands', '');
    for (const { path, cmdLines } of changedSections) {
      lines.push(`### \`${path}\``, '', ...cmdLines, '');
    }
  }

  if (!changed) {
    lines.push(`No command-surface changes (version ${prev.version} → ${next.version}).`);
  }
}

let output = lines.join('\n') + '\n';
if (Buffer.byteLength(output) > MAX_OUTPUT_BYTES) {
  output =
    output.slice(0, MAX_OUTPUT_BYTES) +
    '\n\n_(diff truncated — read the full manifests to see the rest)_\n';
}
process.stdout.write(output);
process.exit(changed ? 10 : 0);

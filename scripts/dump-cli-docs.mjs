#!/usr/bin/env node
// Dump the static `teable get-doc` topic docs into api-reference/ mirror files.
//
// The doc content ships inside the CLI bundle, but `get-doc` insists on
// initializing a base context against a server first. Since the content is
// static, a local mock endpoint that answers the single init request is enough
// — no real credentials or backend involved.
//
// Topics are parsed from the get-doc help text in the manifest (the same
// snapshot the rest of the pipeline uses). Topics listed in the exclusions
// file are runtime/AI-dependent and intentionally not mirrored. Files in the
// output dir that don't correspond to a topic (curated docs) are not touched.
//
// Usage:
//   node scripts/dump-cli-docs.mjs --manifest <manifest.json> [--cli teable]
//        [--out skills/teable-assistant-ops/api-reference] [--check]
//
// --check compares instead of writing. Exit codes: 0 in sync / written,
// 10 drift found (in --check mode), 1 error.
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { join } from 'node:path';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const manifestPath = opt('--manifest');
const cliBin = opt('--cli', 'teable');
const outDir = opt('--out', 'skills/teable-assistant-ops/api-reference');
const exclusionsPath = opt('--exclusions', '.github/teable-docs-exclusions.json');
const checkOnly = args.includes('--check');

if (!manifestPath) {
  console.error('usage: dump-cli-docs.mjs --manifest <manifest.json> [--cli <bin>] [--out <dir>] [--check]');
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const getDoc = (manifest.commands ?? []).find((c) => c.name === 'get-doc');
if (!getDoc) {
  console.error('manifest has no get-doc command — nothing to mirror');
  process.exit(1);
}

const allTopics = [...(getDoc.help ?? '').matchAll(/- ([a-z]+\.[a-z-]+):/g)].map((m) => m[1]);
const excluded = existsSync(exclusionsPath)
  ? JSON.parse(readFileSync(exclusionsPath, 'utf8')).topics ?? []
  : [];
const topics = allTopics.filter((t) => !excluded.includes(t));
if (topics.length === 0) {
  console.error('no mirrorable topics parsed from get-doc help');
  process.exit(1);
}

// Single-purpose mock: answers the base-context init request so the CLI will
// serve its bundled static content.
const server = createServer((req, res) => {
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ id: 'bseMOCK', name: 'mock', role: 'owner' }));
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const endpoint = `http://127.0.0.1:${server.address().port}`;

// Known upstream content bug: some prose lists separate backticked tokens with
// a literal "\n" (e.g. the field.colors color lists). Convert ONLY the exact
// `token`\n`token` adjacency, and only outside fenced code blocks — JS string
// examples inside code fences keep their \n. Remove once the doc source in
// teable-ee is fixed.
function normalizeContent(content) {
  const lines = content.split('\n');
  let inFence = false;
  return lines
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        inFence = !inFence;
        return line;
      }
      return inFence ? line : line.replace(/`\\n`/g, '`\n`');
    })
    .join('\n');
}

function fetchTopic(topic) {
  return new Promise((resolve, reject) => {
    const child = spawn(cliBin, ['get-doc', '--topic', topic, '-b', 'bseMOCK', '--token', 'mock', '--endpoint', endpoint], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';
    let err = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`get-doc --topic ${topic} timed out`));
    }, 60_000);
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    child.on('error', (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) return reject(new Error(`get-doc --topic ${topic} exited ${code}: ${(out + err).slice(0, 300)}`));
      let parsed;
      try {
        parsed = JSON.parse(out);
      } catch {
        return reject(new Error(`get-doc --topic ${topic}: unparseable output: ${out.slice(0, 200)}`));
      }
      if (!parsed.success || typeof parsed.content !== 'string') {
        return reject(new Error(`get-doc --topic ${topic}: unexpected envelope: ${out.slice(0, 200)}`));
      }
      resolve(normalizeContent(parsed.content.replace(/^\n+/, '').replace(/\s*$/, '\n')));
    });
  });
}

let drift = 0;
let failures = 0;
for (const topic of topics) {
  const file = join(outDir, `${topic}.md`);
  let content;
  try {
    content = await fetchTopic(topic);
  } catch (e) {
    failures++;
    console.error(`ERROR ${topic}: ${e.message}`);
    continue;
  }
  const existing = existsSync(file) ? readFileSync(file, 'utf8') : null;
  if (existing === content) {
    console.log(`ok       ${topic}`);
  } else if (checkOnly) {
    drift++;
    console.log(`${existing === null ? 'MISSING ' : 'DRIFT   '} ${topic} (${file})`);
  } else {
    writeFileSync(file, content);
    console.log(`${existing === null ? 'created ' : 'updated '} ${topic} -> ${file}`);
  }
}

// Orphan report: topic-shaped files with no matching topic (curated docs keep
// their own names by convention and are never touched here).
const topicSet = new Set(allTopics);
for (const f of readdirSync(outDir).filter((f) => f.endsWith('.md'))) {
  const name = f.slice(0, -3);
  if (/^[a-z]+\.[a-z-]+$/.test(name) && !topicSet.has(name)) {
    console.log(`orphan   ${name} — no such get-doc topic (curated or stale?)`);
  }
}
if (excluded.length) console.log(`excluded ${excluded.join(', ')} (runtime/AI topics, not mirrored)`);

server.close();
if (failures) process.exit(1);
if (checkOnly && drift) process.exit(10);

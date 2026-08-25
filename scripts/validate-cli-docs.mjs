#!/usr/bin/env node
// Validate that every `teable ...` invocation documented in the
// teable-assistant-ops skill exists in the committed CLI manifest snapshot
// (.github/teable-cli-manifest.json, produced by `teable manifest`).
//
// Checked sources:
//   - fenced code blocks with a shell-ish (or absent) language tag
//   - inline code spans whose content starts with `teable `
// Escape hatch: add `no-validate` to a fence's info string to skip that block.
//
// Usage: node scripts/validate-cli-docs.mjs
// Exit codes: 0 — ok (or no snapshot yet), 1 — validation errors / crash.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const REPO_ROOT = process.cwd();
const SKILL_DIR = join(REPO_ROOT, 'skills', 'teable-assistant-ops');
const MANIFEST_PATH = join(REPO_ROOT, '.github', 'teable-cli-manifest.json');

const SHELL_LANGS = new Set(['', 'bash', 'sh', 'shell', 'zsh', 'console']);

if (!existsSync(MANIFEST_PATH)) {
  console.log(`No manifest snapshot at ${relative(REPO_ROOT, MANIFEST_PATH)} yet — skipping CLI doc validation (bootstrap).`);
  process.exit(0);
}

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
const root = {
  name: manifest.name ?? 'teable',
  options: manifest.options ?? [],
  subcommands: manifest.commands ?? [],
  arguments: [],
};

const errors = [];
let invocationCount = 0;

function report(file, line, msg) {
  errors.push({ file: relative(REPO_ROOT, file), line, msg });
}

// --- option helpers -------------------------------------------------------

// "-b, --base-id <id>" → ["-b", "--base-id"]
function optionNames(opt) {
  return opt.flags
    .split(/[,|]/)
    .map((part) => part.trim().split(/[ =]/)[0])
    .filter((name) => name.startsWith('-'));
}

function findOption(chain, name) {
  for (let i = chain.length - 1; i >= 0; i--) {
    for (const opt of chain[i].options ?? []) {
      const names = optionNames(opt);
      if (names.includes(name)) return opt;
      // commander-style negation: --no-color matches a declared --color
      if (name.startsWith('--no-') && names.includes('--' + name.slice(5))) return opt;
    }
  }
  return null;
}

const optionTakesValue = (opt) => /[<[]/.test(opt.flags);

// --- shell-ish tokenizer --------------------------------------------------

function tokenize(line) {
  const tokens = [];
  let i = 0;
  let cur = '';
  let quoted = false;
  let inSingle = false;
  let inDouble = false;
  while (i < line.length) {
    const c = line[i];
    if (inSingle) {
      if (c === "'") inSingle = false;
      else cur += c;
      i++;
      continue;
    }
    if (inDouble) {
      if (c === '"') inDouble = false;
      else if (c === '\\') {
        cur += line[i + 1] ?? '';
        i += 2;
        continue;
      } else cur += c;
      i++;
      continue;
    }
    if (c === "'") {
      inSingle = true;
      quoted = true;
      i++;
      continue;
    }
    if (c === '"') {
      inDouble = true;
      quoted = true;
      i++;
      continue;
    }
    if (c === '\\') {
      cur += line[i + 1] ?? '';
      i += 2;
      continue;
    }
    if (/\s/.test(c)) {
      if (cur || quoted) {
        tokens.push({ text: cur, quoted });
        cur = '';
        quoted = false;
      }
      i++;
      continue;
    }
    if (c === '#' && !cur && !quoted) break; // comment starts at a token boundary
    cur += c;
    i++;
  }
  if (cur || quoted) tokens.push({ text: cur, quoted });
  return tokens;
}

const OPERATORS = new Set(['&&', '||', '|', ';', '&']);

function splitSegments(tokens) {
  const segments = [];
  let cur = [];
  for (const t of tokens) {
    if (!t.quoted && OPERATORS.has(t.text)) {
      if (cur.length) segments.push(cur);
      cur = [];
    } else cur.push(t);
  }
  if (cur.length) segments.push(cur);
  return segments;
}

// --- validation -----------------------------------------------------------

function isPlaceholder(text) {
  return (
    text.includes('<') ||
    text.includes('${') ||
    text.startsWith('$') ||
    text === '...' ||
    text === '…' ||
    /^\[.*\]$/.test(text)
  );
}

const isRedirect = (text) => /^\d*>>?$/.test(text) || /^\d*>&\d+$/.test(text) || text === '<';

function validateSegment(tokens, file, line) {
  let idx = 0;
  // leading env assignments: TEABLE_API_KEY=xxx teable ...
  while (idx < tokens.length && !tokens[idx].quoted && /^[A-Za-z_][A-Za-z0-9_]*=/.test(tokens[idx].text)) idx++;
  if (idx >= tokens.length || tokens[idx].text !== 'teable' || tokens[idx].quoted) return;
  idx++;
  invocationCount++;

  let node = root;
  const chain = [root];
  let path = 'teable';
  let positional = false;
  // A placeholder in the command-path position (`teable <group> <verb> --flag`)
  // means we can't know which command's options apply — skip flag checks then.
  let unknownContext = false;

  while (idx < tokens.length) {
    const t = tokens[idx];
    const text = t.text;

    if (!t.quoted && isRedirect(text)) {
      idx += /&\d+$/.test(text) ? 1 : 2; // `2>&1` stands alone; `>`/`>>` consume a target
      continue;
    }

    if (!t.quoted && text.startsWith('-') && text !== '-' && !/^-\d/.test(text)) {
      const eq = text.indexOf('=');
      const name = eq >= 0 ? text.slice(0, eq) : text;
      if (name === '--help' || name === '-h') {
        idx++;
        continue;
      }
      const opt = findOption(chain, name);
      if (!opt) {
        if (!unknownContext) report(file, line, `unknown option \`${name}\` for \`${path}\``);
      } else if (eq < 0 && optionTakesValue(opt)) {
        const nextTok = tokens[idx + 1];
        if (nextTok && (nextTok.quoted || !nextTok.text.startsWith('-') || /^-\d/.test(nextTok.text))) idx++;
      }
      idx++;
      continue;
    }

    if (t.quoted || isPlaceholder(text)) {
      if (!positional && !t.quoted && (node.subcommands?.length ?? 0) > 0) unknownContext = true;
      positional = true;
      idx++;
      continue;
    }

    if (!positional && (node.subcommands?.length ?? 0) > 0) {
      if (text === 'help') {
        idx++;
        continue;
      }
      const sub = node.subcommands.find((s) => s.name === text || (s.aliases ?? []).includes(text));
      if (sub) {
        node = sub;
        chain.push(sub);
        path += ' ' + sub.name;
        idx++;
        continue;
      }
      if ((node.arguments?.length ?? 0) > 0) {
        positional = true;
        idx++;
        continue;
      }
      report(file, line, `unknown command \`${path} ${text}\``);
      return;
    }

    positional = true;
    idx++;
  }
}

function validateCommandText(text, file, line) {
  for (const segment of splitSegments(tokenize(text))) validateSegment(segment, file, line);
}

// --- markdown walking -----------------------------------------------------

function processMarkdown(file) {
  const lines = readFileSync(file, 'utf8').split('\n');
  let inFence = false;
  let fenceValidated = false;
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})(.*)$/);
    if (fenceMatch) {
      if (!inFence) {
        inFence = true;
        const info = fenceMatch[2].trim().toLowerCase();
        const lang = info.split(/\s+/)[0] ?? '';
        fenceValidated = SHELL_LANGS.has(lang) && !info.includes('no-validate');
      } else {
        inFence = false;
      }
      i++;
      continue;
    }
    if (inFence) {
      if (fenceValidated) {
        const startLine = i + 1;
        let cmd = line.replace(/^\s*\$\s+/, '');
        while (cmd.trimEnd().endsWith('\\') && i + 1 < lines.length) {
          cmd = cmd.trimEnd().slice(0, -1) + ' ' + lines[++i].replace(/^\s*\$\s+/, '');
        }
        validateCommandText(cmd, file, startLine);
      }
      i++;
      continue;
    }
    // prose line: inline code spans that are full teable invocations
    for (const m of line.matchAll(/`([^`]+)`/g)) {
      if (/^teable\s+\S/.test(m[1])) validateCommandText(m[1], file, i + 1);
    }
    i++;
  }
}

function mdFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...mdFiles(p));
    else if (entry.endsWith('.md')) out.push(p);
  }
  return out;
}

// --- SKILL.md frontmatter -------------------------------------------------

function checkFrontmatter() {
  const skillMd = join(SKILL_DIR, 'SKILL.md');
  const content = readFileSync(skillMd, 'utf8');
  const fm = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) {
    report(skillMd, 1, 'SKILL.md is missing YAML frontmatter');
    return;
  }
  for (const key of ['name', 'description']) {
    if (!new RegExp(`^${key}:`, 'm').test(fm[1])) report(skillMd, 1, `SKILL.md frontmatter is missing \`${key}\``);
  }
}

// --- main -----------------------------------------------------------------

const files = mdFiles(SKILL_DIR);
for (const file of files) processMarkdown(file);
checkFrontmatter();

console.log(`Checked ${invocationCount} \`teable\` invocation(s) across ${files.length} markdown file(s) against CLI v${manifest.version}.`);
if (errors.length) {
  console.log('');
  for (const e of errors) {
    console.log(`::error file=${e.file},line=${e.line}::${e.msg}`);
    console.log(`  ${e.file}:${e.line} — ${e.msg}`);
  }
  console.log(`\n${errors.length} error(s). Documented commands/flags must exist in .github/teable-cli-manifest.json.`);
  process.exit(1);
}
console.log('All documented CLI invocations match the manifest.');

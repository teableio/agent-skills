#!/usr/bin/env bash
# Builds the ZIP uploaded to https://platform.openai.com/plugins (ChatGPT and Codex).
#
# The repository root is the plugin. It keeps the Codex layout (.codex-plugin/plugin.json +
# .mcp.json) because the Codex CLI only reads that, and the Claude manifest next to it.
# Locally, Claude Code and the Codex CLI share .mcp.json, which needs "type": "http"
# (Claude drops a remote server without it).
#
# The archive uses OpenAI's portable layout instead, which is what the submission docs
# recommend for new packages:
#   plugin.json  root manifest with $schema; listing, review and publication live under
#                extensions["com.openai"] (skills are discovered from ./skills, so no field)
#   mcp.json     each server declares type "streamable-http" and its OAuth settings
#   skills/      every skill directory, each with a SKILL.md
#   assets/      icons and logos referenced from the manifest
# The Codex and Claude manifests stay out: with extensions["com.openai"] present the portal
# ignores .codex-plugin/plugin.json, so shipping both would only invite drift.
#
# Two things differ from what Claude Code and the Codex CLI get:
#   - The MCP server is the strict endpoint (OPENAI_MCP_PATH below), not the open /mcp one.
#     OpenAI rejects tools that execute operations not individually exposed for review
#     (plugin guidelines 6.2(b)), which is what search-api + call-api-read/-write do; the
#     strict endpoint lists one tool per operation instead.
#   - Skills run the CLI at the version in .github/teable-cli-manifest.json instead of
#     @teable/cli@latest, which the skill scan flags as code from a mutable source.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
plugin="$root"
version="$(node -p "require('$plugin/.codex-plugin/plugin.json').version")"
out="$root/dist/teable-$version.zip"
stage="$(mktemp -d)"
trap 'rm -rf "$stage"' EXIT

cli_version="$(node -p "require('$plugin/.github/teable-cli-manifest.json').version")"

cp -R "$plugin/assets" "$plugin/skills" "$plugin/README.md" "$stage/"

node - "$plugin" "$stage" "$cli_version" <<'JS'
const fs = require("fs");
const path = require("path");
const [plugin, stage, cliVersion] = process.argv.slice(2);
// Path of the strict MCP endpoint on the same host as .mcp.json's server.
const OPENAI_MCP_PATH = "/mcp/strict";
const read = (p) => JSON.parse(fs.readFileSync(path.join(plugin, p), "utf8"));
const write = (p, v) => fs.writeFileSync(path.join(stage, p), JSON.stringify(v, null, 2) + "\n");

const codex = read(".codex-plugin/plugin.json");
const { skills, mcpServers, interface: listing, extensions = {}, ...meta } = codex;
const openai = extensions["com.openai"] || {};
write("plugin.json", {
  $schema: "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
  ...meta,
  extensions: {
    ...extensions,
    "com.openai": { interface: listing, ...openai },
  },
});

const servers = read(".mcp.json").mcpServers;
for (const server of Object.values(servers)) {
  server.url = new URL(OPENAI_MCP_PATH, server.url).toString();
  server.type = "streamable-http";
  server.extensions = { "com.openai": { auth: { type: "oauth", client: { mode: "dcr" } } } };
}
write("mcp.json", {
  $schema: "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
  mcpServers: servers,
});

// Pin the CLI the skills run.
if (!/^\d+\.\d+\.\d+$/.test(cliVersion)) throw new Error(`bad CLI version: ${cliVersion}`);
const pin = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) pin(file);
    else if (entry.name.endsWith(".md")) {
      const text = fs.readFileSync(file, "utf8");
      const pinned = text.replaceAll("@teable/cli@latest", `@teable/cli@${cliVersion}`);
      if (pinned !== text) fs.writeFileSync(file, pinned);
    }
  }
};
pin(path.join(stage, "skills"));

// Every path the listing references must exist in the archive.
for (const key of ["composerIcon", "composerIconDark", "logo", "logoDark"]) {
  const ref = listing[key];
  if (ref && !fs.existsSync(path.join(stage, ref))) throw new Error(`${key} -> ${ref} is missing`);
}
for (const dir of fs.readdirSync(path.join(stage, "skills"))) {
  if (dir.startsWith(".")) continue;
  const md = path.join(stage, "skills", dir, "SKILL.md");
  if (!fs.existsSync(md)) throw new Error(`skills/${dir} has no SKILL.md`);
  const head = fs.readFileSync(md, "utf8").match(/^---\n([\s\S]*?)\n---/);
  if (!head || !/^name:\s*\S/m.test(head[1]) || !/^description:\s*\S/m.test(head[1])) {
    throw new Error(`skills/${dir}/SKILL.md needs name and description frontmatter`);
  }
}
JS

mkdir -p "$root/dist"
rm -f "$out"
(cd "$stage" && zip -qr "$out" plugin.json mcp.json assets skills README.md -x '*.DS_Store')
echo "$out"

#!/usr/bin/env bash
# Builds the ZIP submitted to the WorkBuddy Open Platform (https://open.workbuddy.cn) as an
# Expert, WorkBuddy's name for a plugin. Spec: https://open.workbuddy.cn/docs/expert
#
# An expert is an agent with a listing, plus the skills and MCP servers it needs:
#   .codebuddy-plugin/plugin.json  manifest and listing, kept in workbuddy/expert/; the
#                                  version and the skill list are filled in here
#   agents/                        the agent's system prompt, kept in workbuddy/expert/
#   avatars/expert.png             512x512, taken from assets/logo.png
#   skills/                        the same skill directories the plugin ships
#   .mcp.json                      the server in the repository's .mcp.json, with the
#                                  x-workbuddy block that drives the connect card
# The connector package (scripts/package-workbuddy.sh) lists the MCP server on its own; this
# one carries the server itself, so it does not depend on that listing being approved.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
version="$(node -p "require('$root/.claude-plugin/plugin.json').version")"
out="$root/dist/teable-workbuddy-expert-$version.zip"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
stage="$tmp/teable"
mkdir -p "$stage/.codebuddy-plugin" "$stage/avatars"

cp -R "$root/skills" "$root/workbuddy/expert/agents" "$root/workbuddy/expert/README.md" "$stage/"
cp "$root/assets/logo.png" "$stage/avatars/expert.png"

node - "$root" "$stage" "$version" <<'JS'
const fs = require("fs");
const path = require("path");
const [root, stage, version] = process.argv.slice(2);
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
const write = (p, v) => fs.writeFileSync(path.join(stage, p), JSON.stringify(v, null, 2) + "\n");
const fail = (m) => { throw new Error(m); };
const chars = (s) => [...s].length;

const skills = fs.readdirSync(path.join(stage, "skills")).filter((d) =>
  fs.existsSync(path.join(stage, "skills", d, "SKILL.md")));
const { name, ...rest } = read("workbuddy/expert/plugin.json");
const manifest = { name, version, ...rest, skills: skills.map((d) => `./skills/${d}`) };

// Rules from the expert spec; the portal rejects a package that breaks them.
/^[a-z0-9-]+$/.test(name) || fail("name must be lowercase letters, digits and hyphens");
manifest.plugin === name || fail("plugin must equal name");
const agent = path.join(stage, "agents", `${manifest.agentName}.md`);
fs.existsSync(agent) || fail(`agents/${manifest.agentName}.md is missing`);
manifest.agents.includes(`./agents/${manifest.agentName}.md`) || fail("agents must list the agentName file");
const zh = chars(manifest.displayDescription.zh);
(zh >= 40 && zh <= 50) || fail(`displayDescription.zh must be 40-50 characters, got ${zh}`);
manifest.tags.length === 3 || fail("tags needs exactly 3 entries");
manifest.quickPrompts.length === 3 || fail("quickPrompts needs exactly 3 entries");
for (const lang of ["zh", "en"]) {
  manifest.defaultInitPrompt[lang] === manifest.quickPrompts[0][lang] ||
    fail(`defaultInitPrompt.${lang} must equal the first quick prompt`);
}
const head = fs.readFileSync(agent, "utf8").match(/^---\n([\s\S]*?)\n---/) || fail("agent file needs frontmatter");
const preload = (head[1].match(/^skills:\s*\[(.*)\]/m) || [, ""])[1].split(",").map((s) => s.trim()).filter(Boolean);
for (const s of preload) skills.includes(s) || fail(`agent preloads unknown skill ${s}`);
fs.statSync(path.join(stage, "avatars/expert.png")).size <= 500 * 1024 || fail("avatar must be 500KB or smaller");

write(".codebuddy-plugin/plugin.json", manifest);

const servers = read(".mcp.json").mcpServers;
for (const server of Object.values(servers)) {
  server.url.startsWith("https://") || fail("the MCP server address must use HTTPS");
  server["x-workbuddy"] = {
    displayName: { zh: "Teable", en: "Teable" },
    description: {
      zh: "连接后可查询和分析 Teable 数据，新增、修改和删除记录，管理表和字段。",
      en: "Query and analyze your Teable data, change records, and manage tables and fields.",
    },
    icon: "./avatars/expert.png",
    auth: { type: "oauth" },
  };
}
write(".mcp.json", { mcpServers: servers });
JS

mkdir -p "$root/dist"
rm -f "$out"
(cd "$tmp" && zip -qr "$out" teable -x '*.DS_Store')
echo "$out"

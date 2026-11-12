#!/usr/bin/env bash
# Builds the ZIP submitted to the WorkBuddy Open Platform (https://open.workbuddy.cn) as a
# Connector. Spec: https://open.workbuddy.cn/docs/connector
#
# A WorkBuddy connector is one MCP server plus optional skills:
#   connector-meta.json  listing metadata, kept in workbuddy/; version comes from the plugin
#   mcp.json             exactly one server, type "streamableHttp"
#   icon.png             64x64, kept in workbuddy/
#   skills/              the same skill directories the plugin ships
# Authentication, chosen with AUTH:
#   client (default)  auth_mode is left out. The server follows the MCP authorization spec
#                     (resource metadata, dynamic client registration, PKCE), so the
#                     WorkBuddy client signs in on its own.
#   server-side       the WorkBuddy cloud runs the same OAuth flow and keeps the token
#                     (auth_mode "server-side", auth_type "mcp_oauth"). The portal can then
#                     test the sign-in itself. Needs WorkBuddy 4.24.0 or later.
#
# The server address is the one in .mcp.json, the same server every other client uses.
#   TEABLE_MCP_URL  use another MCP server address, e.g. https://mcp.teable.cn/mcp
#   FLAT=1          put the files at the ZIP root instead of inside a teable/ directory
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
auth="${AUTH:-client}"
url="${TEABLE_MCP_URL:-$(node -p "Object.values(require('$root/.mcp.json').mcpServers)[0].url")}"
version="$(node -p "require('$root/.claude-plugin/plugin.json').version")"
suffix=""; [ "$auth" = "client" ] || suffix="-$auth"
out="$root/dist/teable-workbuddy-$version$suffix.zip"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
stage="$tmp/teable"
mkdir -p "$stage"

cp -R "$root/skills" "$stage/"
cp "$root/workbuddy/icon.png" "$stage/"

node - "$root" "$stage" "$version" "$url" "$auth" <<'JS'
const fs = require("fs");
const path = require("path");
const [root, stage, version, url, auth] = process.argv.slice(2);
const write = (p, v) => fs.writeFileSync(path.join(stage, p), JSON.stringify(v, null, 2) + "\n");
const fail = (m) => { throw new Error(m); };

const meta = JSON.parse(fs.readFileSync(path.join(root, "workbuddy/connector-meta.json"), "utf8"));
meta.version = version;

// Limits from the connector spec; the portal rejects a package that breaks them.
const chars = (s) => [...s].length;
/^[a-z0-9-]+$/.test(meta.source) || fail("source must be lowercase letters, digits and hyphens");
(chars(meta.name) >= 2 && chars(meta.name) <= 20) || fail("name must be 2-20 characters");
for (const key of ["description_zh", "description_en"]) {
  const n = chars(meta[key] || "");
  (n >= 20 && n <= 100) || fail(`${key} must be 20-100 characters, got ${n}`);
}
for (const key of ["examples_zh", "examples_en"]) {
  const n = (meta[key] || []).length;
  (n >= 2 && n <= 5) || fail(`${key} needs 2-5 entries, got ${n}`);
}
for (const key of ["name_en", "description"]) meta[key] || fail(`${key} is required`);
url.startsWith("https://") || fail("the MCP server address must use HTTPS");

if (auth === "server-side") {
  meta.auth_mode = "server-side";
  meta.server_auth = { auth_type: "mcp_oauth", data: { mcp_oauth: { server_url: url } } };
  meta.minWorkbuddyVersion = "4.24.0";
} else if (auth !== "client") {
  fail(`AUTH must be client or server-side, got ${auth}`);
}

write("connector-meta.json", meta);
write("mcp.json", { mcpServers: { [meta.source]: { type: "streamableHttp", url } } });

for (const dir of fs.readdirSync(path.join(stage, "skills"))) {
  const md = path.join(stage, "skills", dir, "SKILL.md");
  fs.existsSync(md) || fail(`skills/${dir} has no SKILL.md`);
  const head = fs.readFileSync(md, "utf8").match(/^---\n([\s\S]*?)\n---/);
  (head && /^name:\s*\S/m.test(head[1]) && /^description:\s*\S/m.test(head[1])) ||
    fail(`skills/${dir}/SKILL.md needs name and description frontmatter`);
}
JS

mkdir -p "$root/dist"
rm -f "$out"
if [ "${FLAT:-}" = "1" ]; then
  (cd "$stage" && zip -qr "$out" . -x '*.DS_Store')
else
  (cd "$tmp" && zip -qr "$out" teable -x '*.DS_Store')
fi
echo "$out"

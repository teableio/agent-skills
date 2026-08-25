#!/bin/bash
# Driver for syncing skills/teable-assistant-ops against the Teable CLI in teable-ee.
#
#   driver.sh scan [--from <ver>] [--to <ref>] [--ee <path>] [--no-fetch] [--full-diff]
#   driver.sh manifest-diff [--to-ver <ver>]
#   driver.sh mark-synced <ver>
#   driver.sh check
#
# scan          — report CLI + doc-source changes since the last synced version
#                 (from last-synced.json, falling back to metadata engines).
#                 The agent reads this report and edits the skill docs by
#                 judgment; this script never edits skill docs.
# manifest-diff — diff the stored command-surface manifest snapshot against the
#                 latest published CLI (`teable manifest`, needs npm network).
# mark-synced   — record a completed sync: write last-synced.json and store the
#                 manifest snapshot for that version.
# check         — validate every relative .md link and #anchor inside the skill.
set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel)
SKILL_DIR="$REPO_ROOT/skills/teable-assistant-ops"
SELF_DIR="$REPO_ROOT/.claude/skills/sync-teable-assistant-ops"
STATE_FILE="$SELF_DIR/last-synced.json"
MANIFEST_FILE="$SELF_DIR/last-synced-manifest.json"
EE_DIR="${TEABLE_EE_DIR:-$(dirname "$REPO_ROOT")/teable-ee}"
TO_REF="origin/develop"
FROM_VER=""
TO_VER=""
DO_FETCH=1
FULL_DIFF=0

CLI_PKG="packages/ai-tools-cli"
DOCS_DIR="packages/ai-tools/src/docs"

usage() { sed -n '2,18p' "$0"; exit 1; }

cmd="${1:-}"; shift || usage
while [ $# -gt 0 ]; do
  case "$1" in
    --from) FROM_VER="$2"; shift 2 ;;
    --to) TO_REF="$2"; shift 2 ;;
    --to-ver) TO_VER="$2"; shift 2 ;;
    --ee) EE_DIR="$2"; shift 2 ;;
    --no-fetch) DO_FETCH=0; shift ;;
    --full-diff) FULL_DIFF=1; shift ;;
    -*) echo "unknown arg: $1"; usage ;;
    *) POS_ARG="$1"; shift ;;
  esac
done

last_synced_version() {
  if [ -f "$STATE_FILE" ]; then
    sed -n 's/.*"cliVersion": *"\([^"]*\)".*/\1/p' "$STATE_FILE"
  else
    sed -n 's/.*"teableCli": *">=\{0,1\}\([0-9.]*\)".*/\1/p' "$SKILL_DIR/metadata.json"
  fi
}

# Dump `teable manifest` for an exact published version. Isolated HOME keeps the
# output canonical (no user config / TEABLE_* interference). Needs npm network.
dump_manifest() { # <version> <outfile>
  HOME=$(mktemp -d) npx -y "@teable/cli@$1" manifest > "$2" 2>/dev/null
  grep -q '"version": "'"$1"'"' "$2" || { echo "ERROR: manifest dump for $1 failed"; exit 1; }
}

# ---------------------------------------------------------------- scan
scan() {
  [ -d "$EE_DIR/$CLI_PKG" ] || { echo "ERROR: teable-ee not found at $EE_DIR (set TEABLE_EE_DIR or --ee)"; exit 1; }

  if [ "$DO_FETCH" = 1 ]; then
    git -C "$EE_DIR" fetch origin --quiet 2>/dev/null \
      || echo "WARN: fetch failed — using possibly-stale local refs (pass --no-fetch to silence)"
  fi

  local to_ver npm_ver
  to_ver=$(git -C "$EE_DIR" show "$TO_REF:$CLI_PKG/package.json" | sed -n 's/.*"version": "\([^"]*\)".*/\1/p' | head -1)
  npm_ver=$(npm view @teable/cli version 2>/dev/null || echo "unknown")

  [ -n "$FROM_VER" ] || FROM_VER=$(last_synced_version)
  [ -n "$FROM_VER" ] || { echo "ERROR: cannot determine last synced version — pass --from X.Y.Z"; exit 1; }

  echo "== Version =="
  echo "last synced:      $FROM_VER"
  echo "latest at $TO_REF: $to_ver"
  echo "npm @teable/cli:  $npm_ver"
  [ "$npm_ver" != "unknown" ] && [ "$npm_ver" != "$to_ver" ] && \
    echo "WARN: npm publish ($npm_ver) != $TO_REF ($to_ver) — sync to the npm version's commit"

  if [ "$FROM_VER" = "$to_ver" ]; then
    echo
    echo "Up to date — nothing to sync."
    return 0
  fi

  # Baseline = the commit that introduced "version": "<FROM_VER>" in the CLI package.json.
  # `git log -S` lists both the introducing and the removing commit; oldest = introducer.
  # Search from $TO_REF, not HEAD — the local checkout is often behind origin.
  local base
  base=$(git -C "$EE_DIR" log --format=%H "$TO_REF" -S "\"version\": \"$FROM_VER\"" -- "$CLI_PKG/package.json" | tail -1)
  [ -n "$base" ] || { echo "ERROR: no commit introduces version $FROM_VER — is the version exact (X.Y.Z)?"; exit 1; }
  git -C "$EE_DIR" show "$base:$CLI_PKG/package.json" | grep -q "\"version\": \"$FROM_VER\"" \
    || { echo "ERROR: baseline sanity check failed for $base"; exit 1; }

  echo
  echo "== Baseline commit (v$FROM_VER) =="
  git -C "$EE_DIR" log --format='%h %ad %s' --date=short -1 "$base"

  echo
  echo "== CLI commits $FROM_VER..$TO_REF =="
  git -C "$EE_DIR" log --format='%h %ad %s' --date=short "$base..$TO_REF" -- "$CLI_PKG"

  echo
  echo "== CLI diff stat =="
  git -C "$EE_DIR" diff --stat "$base" "$TO_REF" -- "$CLI_PKG" | tail -80

  echo
  echo "== Doc-source diff ($DOCS_DIR) =="
  git -C "$EE_DIR" diff --stat "$base" "$TO_REF" -- "$DOCS_DIR"

  echo
  echo "== Changed doc topics -> skill api-reference files =="
  git -C "$EE_DIR" diff --name-status "$base" "$TO_REF" -- "$DOCS_DIR" | while read -r st path; do
    rel=${path#"$DOCS_DIR"/}
    case "$rel" in
      index.ts) echo "  [$st] index.ts -> topic registry: check for NEW or DYNAMIC topics" ;;
      */ai.doc.ts) echo "  [$st] $rel -> DYNAMIC topic (runtime model injection) — NOT mirrored; only listed in SKILL.md 'Dynamic' line" ;;
      *.doc.ts)
        topic=$(echo "$rel" | sed 's|/|.|; s|\.doc\.ts$||')
        tgt="api-reference/$topic.md"
        if [ -f "$SKILL_DIR/$tgt" ]; then echo "  [$st] $rel -> $tgt"; else echo "  [$st] $rel -> $tgt (MISSING in skill — create it)"; fi ;;
      *) echo "  [$st] $rel -> (no mapping — inspect manually)" ;;
    esac
  done

  if [ "$FULL_DIFF" = 1 ]; then
    echo
    echo "== Full doc-source diff =="
    git -C "$EE_DIR" diff "$base" "$TO_REF" -- "$DOCS_DIR"
    echo
    echo "== Command registry diff =="
    git -C "$EE_DIR" diff "$base" "$TO_REF" -- "$CLI_PKG/src/commands/index.ts"
  else
    echo
    echo "Next: read the interesting diffs yourself, e.g."
    echo "  git -C $EE_DIR diff $base $TO_REF -- $CLI_PKG/src/commands/index.ts"
    echo "  git -C $EE_DIR diff $base $TO_REF -- $DOCS_DIR/<changed file>"
    echo "(or re-run scan with --full-diff)"
  fi
}

# ---------------------------------------------------------------- check
slugify() { # GitHub heading -> anchor
  tr 'A-Z' 'a-z' | sed -E 's/`//g; s/[^a-z0-9 -]//g; s/ /-/g'
}

check() {
  local fail=0 f dir line target path anchor resolved
  while IFS= read -r f; do
    dir=$(dirname "$f")
    while IFS= read -r target; do
      case "$target" in http*|mailto:*) continue ;; esac
      path=${target%%#*}
      anchor=""; [ "$path" != "$target" ] && anchor=${target#*#}
      if [ -n "$path" ]; then
        resolved="$dir/$path"
      else
        resolved="$f"   # pure in-page anchor like](#section)
      fi
      if [ ! -f "$resolved" ]; then
        echo "BAD LINK   $f -> $target"; fail=1; continue
      fi
      if [ -n "$anchor" ]; then
        if ! grep -E '^#{1,6} ' "$resolved" | sed -E 's/^#+ //' | slugify | grep -qx "$anchor"; then
          echo "BAD ANCHOR $f -> $target"; fail=1
        fi
      fi
    done < <(grep -oE '\]\([^)]+\)' "$f" | sed -E 's/^\]\(//; s/\)$//' | grep -E '\.md(#|$)|^#')
  done < <(find "$SKILL_DIR" -name '*.md')

  if [ "$fail" = 0 ]; then echo "check OK — all links and anchors resolve"; else exit 1; fi
}

# ------------------------------------------------------- manifest-diff
manifest_diff() {
  local ver tmp
  ver="${TO_VER:-$(npm view @teable/cli version)}"
  [ -f "$MANIFEST_FILE" ] || {
    echo "No stored manifest snapshot yet — after finishing a sync, run: driver.sh mark-synced $ver"
    exit 1
  }
  tmp=$(mktemp)
  dump_manifest "$ver" "$tmp"
  echo "== Command-surface diff: stored ($(last_synced_version)) vs @teable/cli@$ver =="
  if diff -u "$MANIFEST_FILE" "$tmp"; then
    echo "No command-surface changes."
  fi
}

# --------------------------------------------------------- mark-synced
mark_synced() {
  local ver="${POS_ARG:-}"
  [ -n "$ver" ] || { echo "usage: driver.sh mark-synced <version>"; exit 1; }
  dump_manifest "$ver" "$MANIFEST_FILE"
  printf '{\n  "cliVersion": "%s",\n  "syncedAt": "%s"\n}\n' "$ver" "$(date +%Y-%m-%d)" > "$STATE_FILE"
  echo "Recorded sync state: cliVersion=$ver; manifest snapshot stored ($(wc -c < "$MANIFEST_FILE" | tr -d ' ') bytes)."
  echo "Commit $STATE_FILE and $MANIFEST_FILE together with the doc changes."
}

case "$cmd" in
  scan) scan ;;
  manifest-diff) manifest_diff ;;
  mark-synced) mark_synced ;;
  check) check ;;
  *) usage ;;
esac

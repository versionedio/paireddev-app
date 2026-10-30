#!/bin/sh
# Copy the front-end skills into another repo's .claude/skills/.
# Usage: install.sh <target-repo> [skill ...] [--force]
set -eu

SRC="$(cd "$(dirname "$0")" && pwd)"
TARGET="${1:-}"; [ -n "$TARGET" ] || { echo "usage: install.sh <target-repo> [skill ...] [--force]"; exit 1; }
[ -d "$TARGET" ] || { echo "not a directory: $TARGET"; exit 1; }
shift

FORCE=0; PICK=""
for a in "$@"; do
  if [ "$a" = "--force" ]; then FORCE=1; else PICK="$PICK $a"; fi
done
[ -n "$PICK" ] || PICK="$(cd "$SRC" && ls -d */ | tr -d / | grep -v '^_templates$')"

DEST="$TARGET/.claude/skills"; mkdir -p "$DEST"

copy_dir() { # name
  if [ -d "$DEST/$1" ] && [ "$FORCE" -eq 0 ]; then echo "skip (exists): $1"; return; fi
  rm -rf "$DEST/$1"; cp -R "$SRC/$1" "$DEST/$1"; echo "installed: $1"
}

for s in $PICK; do
  [ -f "$SRC/$s/SKILL.md" ] || { echo "unknown skill: $s"; continue; }
  copy_dir "$s"
done
copy_dir _templates

MARK="<!-- frontend-skills -->"
if [ -f "$TARGET/CLAUDE.md" ] && grep -q "$MARK" "$TARGET/CLAUDE.md"; then
  echo "CLAUDE.md already points at the skills"
else
  cat >> "$TARGET/CLAUDE.md" <<EOF

$MARK
## Front-end standards
Before building any feature, read \`.claude/skills/frontend-standards/SKILL.md\` and the skill it names for the change.
First rule: search for similar or duplicate code and ask about a refactor before writing new code (\`reuse-before-build\`).
Styles come only from \`src/theme/tokens.css\`; layout and content come from config; every new feature ships behind a feature flag.
EOF
  echo "added pointer block to CLAUDE.md"
fi

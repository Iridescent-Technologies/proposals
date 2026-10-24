#!/usr/bin/env bash
# Builds the public site into one folder, from an allow-list.
#
# The repo is not the site. GitHub Pages used to serve the whole repo root, so
# CLAUDE.md, README.md and the voice config were public pages. From 24 Oct 2026
# Pages serves only what this script copies. Anything not named here stays off
# the site, which is what lets the repo itself be private.
#
# ADDING A PAGE. Put its top-level folder in SITE_FOLDERS. If a new top-level
# folder or file is in neither list, the build fails and says so, so nothing
# goes live by accident and nothing is dropped by accident.
#
# Usage: scripts/build-site.sh [output-folder]   (default _site)

set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
OUT="${1:-_site}"

# Top-level files served exactly as they are.
SITE_FILES=(index.html sitemap.xml .nojekyll)

# Top-level folders served, with every page and file under them. New pages
# inside one of these (a new film under videos/, say) go live with no edit here.
# A folder named here that does not exist yet is skipped.
SITE_FOLDERS=(
  _brand
  a-class-of-one
  active-learning
  admin-clickthrough
  admin-journey
  admin-people-review
  admin-settings-review
  career-passporting
  certified-vs-capable
  exec-summary
  future-fluency
  future-fluency-diplomas
  grounded-not-guessing
  how-pathways-work
  how-skills-work
  how-zavmo-is-built
  human-fluency
  insight-and-impact
  learner-journey
  learning-innovation-behaviour-change
  little-zav
  little-zav-demo
  making-learning-unique
  proof-not-self-report
  qualifications-level-3
  qualifications-level-5
  the-argument-for-xapi
  the-fluency-framework
  the-horizon
  the-ten-fluencies
  videos
  why-zavmo
  zavmo-overview
)

# Top-level items that are never served. Named so the check below knows they
# were decided on, not forgotten.
NEVER_SERVED=(.github CLAUDE.md README.md scripts voice-targets.json _template robots.txt)
# robots.txt is served, but rebuilt below without its comments.

# Inside a site folder, only these kinds of file are copied. Notes, data, drafts
# and scripts (.md .json .txt .py .sh .mjs .yml ...) never are.
WEB_TYPES='html|css|js|png|jpg|jpeg|gif|svg|webp|avif|ico|mp4|webm|mp3|m4a|vtt|woff|woff2|ttf|otf|pdf'

in_list() { local x="$1"; shift; for y in "$@"; do [[ "$x" == "$y" ]] && return 0; done; return 1; }

# 1. Every top-level item must be in one list or the other.
unknown=0
while IFS= read -r top; do
  if ! in_list "$top" "${SITE_FILES[@]}" "${SITE_FOLDERS[@]}" "${NEVER_SERVED[@]}"; then
    echo "::error::'$top' is new at the top of the repo. Add it to SITE_FOLDERS in scripts/build-site.sh to publish it, or to NEVER_SERVED to keep it off the site."
    unknown=1
  fi
done < <(git ls-files | cut -d/ -f1 | sort -u)
[[ $unknown -eq 0 ]] || exit 1

rm -rf "$OUT"
mkdir -p "$OUT"

# 2. Top-level files.
for f in "${SITE_FILES[@]}"; do cp "$f" "$OUT/$f"; done
grep -v '^#' robots.txt | cat -s | sed '/./,$!d' > "$OUT/robots.txt"

# 3. Site folders: tracked web files only, nothing in a hidden or _underscore
#    subfolder (for drafts and working files).
copied=0
for d in "${SITE_FOLDERS[@]}"; do
  [[ -d "$d" ]] || continue
  while IFS= read -r f; do
    rest="${f#*/}"
    if [[ "$rest" =~ (^|/)[._] ]] || ! [[ "$f" =~ \.($WEB_TYPES)$ ]]; then
      echo "::warning::Not published: $f"
      continue
    fi
    mkdir -p "$OUT/$(dirname "$f")"
    cp "$f" "$OUT/$f"
    copied=$((copied + 1))
  done < <(git ls-files -- "$d")
done

# 4. Last check: none of the internal files reached the site.
for f in CLAUDE.md README.md voice-targets.json scripts _template .github; do
  if [[ -e "$OUT/$f" ]]; then echo "::error::$f is in the site build and must not be."; exit 1; fi
done
if find "$OUT" -name '*.md' -o -name '*.json' | grep -q .; then
  echo "::error::A .md or .json file is in the site build."; exit 1
fi

echo "Site built in $OUT: $((copied + ${#SITE_FILES[@]} + 1)) files."

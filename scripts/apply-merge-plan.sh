#!/usr/bin/env bash
set -euo pipefail

# Apply MERGE_PLAN.txt by restoring files from the other branch where marked REPLACE
# Usage: bash scripts/apply-merge-plan.sh <currentBranch> <otherBranch> [--dry-run]

CURRENT=${1:-frontend}
OTHER=${2:-backend}
DRY=${3:-}

if [ ! -f MERGE_PLAN.txt ]; then
  echo "MERGE_PLAN.txt not found. Generate it first." >&2
  exit 1
fi

echo "Applying MERGE_PLAN.txt (CURRENT=$CURRENT, OTHER=$OTHER)"

while read -r action path; do
  # skip comments/empty
  [[ -z "${action:-}" ]] && continue
  [[ "$action" =~ ^# ]] && continue

  case "$action" in
    KEEP)
      # nothing to do; keep from CURRENT
      ;;
    REPLACE)
      echo "REPLACE $path <- $OTHER"
      if [ "$DRY" != "--dry-run" ]; then
        git restore --source "$OTHER" -- "$path" || {
          echo "Failed to restore $path from $OTHER" >&2
          exit 1
        }
      fi
      ;;
    *)
      echo "Unknown action '$action' for $path" >&2
      exit 1
      ;;
  esac
done < <(awk '{print $1" "$2}' MERGE_PLAN.txt)

echo "Done. Review changes, then commit: git add -A && git commit -m 'Apply merge plan'"


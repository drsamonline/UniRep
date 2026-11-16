#!/usr/bin/env bash
# Build the UniRep core database and install it where the app bundles it from.
#
# The database is a generated artifact: it is not tracked (see .gitignore) and
# carries its own licence (see unirep_data/DATA-LICENSES.md). Both native builds
# and web exports require the file to exist, because the app imports it as an
# asset — so run this before `expo start`, `expo prebuild` or `expo export`.
#
# Usage:
#   ./scripts/prepare-app-data.sh                    # Repertorium Publicum only (46 MB, fully graded)
#   ./scripts/prepare-app-data.sh --all              # every book (105 MB, includes CC0 sources)
#   ./scripts/prepare-app-data.sh --cc0-only         # CC0 books only (no GPL material)
#   ./scripts/prepare-app-data.sh /path/to/hmr-json  # reuse an existing checkout
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source_dir=""
build_args=("--books" "repertorium-publicum-2008")

for arg in "$@"; do
  case "$arg" in
    --all) build_args=() ;;
    --cc0-only) build_args=("--cc0-only") ;;
    -*) echo "unknown option: $arg" >&2; exit 2 ;;
    *) source_dir="$arg" ;;
  esac
done

if [ -z "$source_dir" ]; then
  source_dir="$root/.cache/hmr-json"
  if [ ! -d "$source_dir" ]; then
    echo "cloning the converted repertory JSON into $source_dir"
    mkdir -p "$(dirname "$source_dir")"
    git clone --depth 1 --quiet \
      https://github.com/drsamonline/homoeopathic-materia-medica-repertory-json.git \
      "$source_dir"
  fi
fi

python3 "$root/scripts/build_core_db.py" \
  --source-dir "$source_dir" \
  "${build_args[@]}" \
  --out "$root/app/assets/unirep_core.db"

echo "installed: app/assets/unirep_core.db ($(du -h "$root/app/assets/unirep_core.db" | cut -f1))"

#!/usr/bin/env bash
# Build a self-contained, offline-capable bundle of this repository's
# documentation and policy set. No network, no dependencies beyond coreutils,
# sed and (optionally) zip.
#
# Usage:  ./scripts/build-offline.sh
# Output: dist/unirep-docs-offline/        (open index.html directly, file://)
#         dist/unirep-docs-offline.zip     (if zip is installed)
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
out="$root/dist/unirep-docs-offline"

rm -rf "$out"
mkdir -p "$out"

# Documents that make up the offline pack.
cp "$root/docs/index.html" "$out/index.html"
cp "$root/docs/GUIDE.md"   "$out/GUIDE.md"
cp "$root/PRIVACY.md"      "$out/PRIVACY.md"
cp "$root/SECURITY.md"     "$out/SECURITY.md"
cp "$root/README.md"       "$out/README.md"
cp "$root/LICENSE"         "$out/LICENSE"
cp "$root/VERSION"         "$out/VERSION"
cp "$root/docs/shot.png"   "$out/shot.png"
[ -f "$root/docs/assets/upi-qr.svg" ] && cp "$root/docs/assets/upi-qr.svg" "$out/upi-qr.svg"

# The pages link to the policy documents on GitHub (they live at the repository
# root, outside the published docs folder). Inside the bundle every document sits
# beside the page, so rewrite those links to the local copies.
sed -i \
  -e 's|href="docs/GUIDE.md"|href="GUIDE.md"|g' \
  -e 's|https://github.com/drsamonline/UniRep/blob/main/PRIVACY.md|PRIVACY.md|g' \
  -e 's|https://github.com/drsamonline/UniRep/blob/main/SECURITY.md|SECURITY.md|g' \
  -e 's|https://github.com/drsamonline/UniRep/blob/main/docs/GUIDE.md|GUIDE.md|g' \
  "$out/index.html"

# Same for the README copy and its QR asset.
sed -i 's|docs/assets/upi-qr.svg|upi-qr.svg|g' "$out/README.md"

# Offline manifest: every file the pack ships, for integrity checking.
( cd "$out" && ls -1 | grep -v '^MANIFEST\.txt$' | sort | while read -r f; do
    printf '%s  %s\n' "$(sha256sum "$f" | cut -d' ' -f1)" "$f"
  done ) > "$out/MANIFEST.txt"

if command -v zip >/dev/null 2>&1; then
  ( cd "$root/dist" && rm -f unirep-docs-offline.zip && zip -qr unirep-docs-offline.zip unirep-docs-offline )
  echo "bundle: dist/unirep-docs-offline/ and dist/unirep-docs-offline.zip"
else
  echo "bundle: dist/unirep-docs-offline/ (zip not installed; zip step skipped)"
fi

# Prove it is self-contained: no http(s) resource references remain.
if grep -Eq '(src|href)="https?://' "$out/index.html"; then
  echo "note: the page links out to http(s) destinations (navigation only, nothing loaded):"
  grep -Eo 'href="https?://[^"]+"' "$out/index.html" | sed 's/^/  /'
else
  echo "self-contained: no http(s) resources referenced in index.html"
fi

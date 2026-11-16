#!/usr/bin/env python3
"""Check that every local link and asset reference in this repository resolves.

Remote links (http/https/mailto/tel) are left to the CI's lychee step; this
script is the offline half of the check, so it runs anywhere with Python 3 and
catches the class of breakage this repository has actually hit: a link that
points at a file which is not there, or a relative path written for the wrong
directory.

Usage:  python3 scripts/check-links.py     (exit 1 if anything is broken)
"""
from __future__ import annotations

import os
import re
import sys
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCAN_EXT = {".md", ".html", ".htm"}
SKIP_DIRS = {".git", "dist", "node_modules", ".freebuff", "app/dist", "app/node_modules"}
# Paths that only exist in the assembled Pages site (docs/ is published at the
# site root, the app export is copied to /app/ by .github/workflows/pages.yml).
DEPLOYED_ONLY = {"app/", "./app/"}
# Link syntaxes: markdown inline, markdown image, html href/src attributes.
MARKDOWN_LINK = re.compile(r"!?\[[^\]]*\]\(\s*<?([^)>\s]+)>?(?:\s+\"[^\"]*\")?\s*\)")
HTML_ATTR = re.compile(r"""\b(?:href|src)\s*=\s*["']([^"']+)["']""", re.I)
REMOTE = ("http://", "https://", "mailto:", "tel:", "data:", "#", "//")


def files() -> list[str]:
    found = []
    for base, dirs, names in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for name in names:
            if os.path.splitext(name)[1].lower() in SCAN_EXT:
                found.append(os.path.join(base, name))
    return sorted(found)


def targets(text: str) -> list[str]:
    return MARKDOWN_LINK.findall(text) + HTML_ATTR.findall(text)


def main() -> int:
    broken: list[str] = []
    checked = 0
    for path in files():
        rel = os.path.relpath(path, ROOT)
        with open(path, encoding="utf-8") as fh:
            text = fh.read()
        for raw in targets(text):
            link = raw.strip()
            if not link or link.lower().startswith(REMOTE):
                continue
            local = urllib.parse.unquote(link.split("#", 1)[0].split("?", 1)[0])
            if not local or local in DEPLOYED_ONLY:
                continue  # pure fragment, or a path the deploy step creates
            checked += 1
            resolved = os.path.normpath(os.path.join(os.path.dirname(path), local))
            if not os.path.exists(resolved):
                broken.append(f"{rel}: {link} -> {os.path.relpath(resolved, ROOT)} (missing)")

    print(f"local links checked: {checked}")
    if broken:
        print(f"broken: {len(broken)}")
        for line in broken:
            print(f"  {line}")
        return 1
    print("broken: 0")
    return 0


if __name__ == "__main__":
    sys.exit(main())

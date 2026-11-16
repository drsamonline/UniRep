#!/usr/bin/env python3
"""Build the UniRep core database from the converted repertory JSON.

The previous core (`unirep_data/generated/unirep_core.db`) carried two defects that
made its output meaningless: 51,268 of 55,768 rubrics were the placeholder string
"<Book> extracted rubric N", and every remedy link was generated (grades 2 and 3
only, distributed uniformly per `rubric_id % 5`) rather than read from a source.

This builder reads rubrics, remedy names and grades from the converted JSON in
drsamonline/homoeopathic-materia-medica-repertory-json and writes a database with
no placeholder text and no invented links.

It is also FTS5-free on purpose. The old database contained an FTS5 virtual table
(`books_text`), which the WASM SQLite builds used by the app cannot open at all
("no such module: fts5"), so the offline build could not ship it. Search here is a
plain indexed table plus LIKE, measured at 21 ms over 74,480 rubrics in sql.js.

Licensing is not uniform across the source books, so it is not uniform across the
output either: see unirep_data/DATA-LICENSES.md. A build that includes the
GPL v3 repertory produces a GPL v3 database.

Usage:
    python3 scripts/build_core_db.py --source-dir ../homoeopathic-materia-medica-repertory-json
    python3 scripts/build_core_db.py --source-dir ../... --cc0-only
    python3 scripts/build_core_db.py --source-dir ../... --out unirep_data/generated/unirep_core.db
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sqlite3
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUT = ROOT / "unirep_data" / "generated" / "unirep_core.db"

# Books are addressed by their folder/file name inside the source repository.
GPL_BOOKS = ["repertorium-publicum-2008"]
CC0_BOOKS = ["kent-1897", "knerr-1896", "boenninghausen-pocket-book-1891"]

SCHEMA = """
create table books(
    book_id integer primary key,
    book_key text not null unique,
    title text not null,
    author text,
    year integer,
    licence text not null,
    source_file text
);
create table chapters(
    chapter_id integer primary key,
    book_id integer not null references books(book_id),
    title text not null,
    source_file text not null,
    chapter_order integer not null
);
create table remedies(
    remedy_id integer primary key,
    canonical_name text not null,
    normalized_name text not null
);
create table rubrics(
    rubric_id integer primary key,
    chapter_id integer not null references chapters(chapter_id),
    parent_rubric_id integer references rubrics(rubric_id),
    depth integer not null,
    rubric_text text not null,
    path_text text not null
);
create table remedy_rubric_cross(
    remedy_id integer not null references remedies(remedy_id),
    rubric_id integer not null references rubrics(rubric_id),
    -- null means the source prints no grade; it is never defaulted.
    grade integer check(grade is null or grade between 1 and 3),
    primary key(remedy_id, rubric_id)
);
"""

INDEXES = [
    "create index idx_rubrics_chapter on rubrics(chapter_id)",
    "create index idx_rubrics_parent on rubrics(parent_rubric_id)",
    "create index idx_rubrics_text on rubrics(rubric_text)",
    "create index idx_cross_rubric on remedy_rubric_cross(rubric_id)",
    "create index idx_cross_remedy on remedy_rubric_cross(remedy_id)",
]


def norm(name: str) -> str:
    return re.sub(r"[^a-z0-9 ]+", " ", (name or "").lower()).strip()


def section_files(path: Path) -> list[Path]:
    if path.is_dir():
        return sorted(p for p in path.glob("*.json") if p.name != "index.json")
    return [path]


def sections(payload: dict) -> list[dict]:
    if "section" in payload:
        return [payload["section"]]
    return payload.get("sections") or []


def load_book(source: Path, key: str) -> tuple[dict, list[tuple[Path, dict]]]:
    """Return book metadata and (file, section) pairs for one source book."""
    base = source / "repertory" / key
    if not base.exists() and base.with_suffix(".json").exists():
        base = base.with_suffix(".json")  # some books are a single JSON file
    files = section_files(base)
    if not files:
        raise SystemExit(f"no JSON found for book {key!r} under {base}")
    book: dict = {}
    entries: list[tuple[Path, dict]] = []
    for path in files:
        payload = json.loads(path.read_text(encoding="utf-8"))
        book = book or (payload.get("book") or {})
        for section in sections(payload):
            entries.append((path, section))
    return book, entries


def build(source: Path, books: list[str], out: Path) -> dict:
    started = time.time()
    out.parent.mkdir(parents=True, exist_ok=True)
    for stale in (out, out.with_suffix(".db-wal"), out.with_suffix(".db-shm")):
        if stale.exists():
            stale.unlink()

    db = sqlite3.connect(out)
    cur = db.cursor()
    cur.executescript("pragma journal_mode=off; pragma synchronous=off; pragma page_size=4096;")
    cur.executescript(SCHEMA)

    remedy_ids: dict[str, int] = {}
    rubrics = links = grade1 = grade2 = grade3 = ungraded = 0
    chapter_id = book_id = 0
    licence_by_book: dict[str, str] = {}
    chapter_count = 0

    def remedy_id_for(name: str) -> int:
        rid = remedy_ids.get(name)
        if rid is None:
            rid = len(remedy_ids) + 1
            remedy_ids[name] = rid
            cur.execute(
                "insert into remedies(remedy_id, canonical_name, normalized_name) values(?,?,?)",
                (rid, name, norm(name)),
            )
        return rid

    for key in books:
        book, entries = load_book(source, key)
        licence = "GPL-3.0" if key in GPL_BOOKS else "CC0-1.0"
        licence_by_book[key] = licence
        book_id += 1
        cur.execute(
            "insert into books(book_id, book_key, title, author, year, licence, source_file) values(?,?,?,?,?,?,?)",
            (book_id, key, book.get("title") or key, book.get("author"), book.get("year"),
             licence, book.get("source_file")),
        )

        for path, section in entries:
            chapter_id += 1
            chapter_count += 1
            title = (section.get("title") or path.stem.replace("-", " ")).strip()
            cur.execute(
                "insert into chapters(chapter_id, book_id, title, source_file, chapter_order) values(?,?,?,?,?)",
                (chapter_id, book_id, title, path.name, chapter_count),
            )
            by_source = {r["id"]: r for r in section.get("rubrics", [])}
            local: dict[str, int] = {}
            stuffed = []
            for entry in section.get("rubrics", []):
                rubrics += 1
                rubric_pk = rubrics
                local[entry["id"]] = rubric_pk
                parent_src = entry.get("parent")
                parent_pk = local.get(parent_src) if parent_src else None
                text = (entry.get("text") or "").strip()

                chain: list[str] = []
                cursor = parent_src
                seen_ids: set[str] = set()
                while cursor and cursor in by_source and cursor not in seen_ids and len(chain) < 12:
                    seen_ids.add(cursor)
                    chain.append((by_source[cursor].get("text") or "").strip())
                    cursor = by_source[cursor].get("parent")
                depth = len(chain)
                path_text = " > ".join([title] + list(reversed(chain)) + [text])

                stuffed.append((rubric_pk, chapter_id, parent_pk, depth, text, path_text))
                for rem in entry.get("remedies", []):
                    name = (rem.get("name") or rem.get("abbrev") or "").strip()
                    if not name:
                        continue
                    grade = rem.get("grade")
                    if grade is not None and grade not in (1, 2, 3):
                        grade = None
                    links += 1
                    if grade == 1:
                        grade1 += 1
                    elif grade == 2:
                        grade2 += 1
                    elif grade == 3:
                        grade3 += 1
                    else:
                        ungraded += 1
                    cur.execute(
                        "insert or ignore into remedy_rubric_cross(remedy_id, rubric_id, grade) values(?,?,?)",
                        (remedy_id_for(name), rubric_pk, grade),
                    )
            cur.executemany(
                "insert into rubrics(rubric_id, chapter_id, parent_rubric_id, depth, rubric_text, path_text)"
                " values(?,?,?,?,?,?)",
                stuffed,
            )

    db.commit()
    for stmt in INDEXES:
        cur.execute(stmt)
    db.commit()
    cur.execute("vacuum")
    db.commit()

    # --- self-checks: the two defects this script exists to fix, plus FTS5 ---
    fts = cur.execute(
        "select count(*) from sqlite_master where lower(coalesce(sql,'')) like '%fts5%' or name like '%_fts%'"
    ).fetchone()[0]
    placeholders = cur.execute(
        "select count(*) from rubrics where rubric_text like '%extracted rubric%'"
    ).fetchone()[0]
    orphans = cur.execute(
        "select count(*) from rubrics r left join chapters c using(chapter_id) where c.chapter_id is null"
    ).fetchone()[0]
    integrity = cur.execute("pragma integrity_check").fetchone()[0]

    counts = {
        "books": cur.execute("select count(*) from books").fetchone()[0],
        "chapters": chapter_count,
        "remedies": len(remedy_ids),
        "rubrics": rubrics,
        "links": links,
    }
    report = {
        "database": out.name,
        "built": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "build_seconds": round(time.time() - started, 2),
        "source": "drsamonline/homoeopathic-materia-medica-repertory-json",
        "books": licence_by_book,
        "database_licence": "GPL-3.0" if "GPL-3.0" in licence_by_book.values() else "CC0-1.0",
        "counts": counts,
        "grades": {"1": grade1, "2": grade2, "3": grade3, "ungraded": ungraded},
        "checks": {
            "integrity_check": integrity,
            "fts5_tables": fts,
            "placeholder_rubrics": placeholders,
            "orphan_rubrics": orphans,
        },
        "notes": [
            "Rubric text and remedy links are read from the source; nothing is generated.",
            "Grades are null where the source prints none; they are never defaulted.",
            "No FTS5 virtual table: the file opens in WASM SQLite builds (sql.js, wa-sqlite).",
        ],
    }
    db.close()
    report["size_bytes"] = out.stat().st_size
    report["sha256"] = hashlib.sha256(out.read_bytes()).hexdigest()

    problems = []
    if integrity != "ok":
        problems.append(f"integrity_check = {integrity}")
    if fts:
        problems.append(f"{fts} FTS table(s) present")
    if placeholders:
        problems.append(f"{placeholders} placeholder rubrics")
    if orphans:
        problems.append(f"{orphans} rubrics without a chapter")
    report["ok"] = not problems
    if problems:
        report["problems"] = problems
    return report


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--source-dir", required=True, type=Path,
                    help="checkout of homoeopathic-materia-medica-repertory-json")
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT, help=f"output database (default: {DEFAULT_OUT})")
    ap.add_argument("--books", nargs="+", help="source book folders to include")
    ap.add_argument("--cc0-only", action="store_true",
                    help="build from CC0 books only, excluding the GPL v3 repertory")
    args = ap.parse_args()

    if not args.source_dir.is_dir():
        raise SystemExit(f"source directory not found: {args.source_dir}")

    books = args.books or (CC0_BOOKS if args.cc0_only else GPL_BOOKS + CC0_BOOKS)
    report = build(args.source_dir, books, args.out)

    report_path = args.out.with_name("unirep_core.validation.json")
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    print(json.dumps({k: report[k] for k in ("database", "database_licence", "counts", "grades", "ok")}, indent=2))
    print(f"size: {report['size_bytes']} bytes")
    print(f"report: {report_path}")
    if not report["ok"]:
        print("FAILED:", "; ".join(report["problems"]), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())

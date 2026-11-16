# Data and licensing

The core database is built from converted repertory JSON in
[drsamonline/homoeopathic-materia-medica-repertory-json](https://github.com/drsamonline/homoeopathic-materia-medica-repertory-json).
That repository carries **two licences**, one per folder, and the build inherits
whichever apply to the books it includes.

| Source | Licence | Graded? | Used by default |
|---|---|---|---|
| `repertory/repertorium-publicum-2008/` — Repertorium Publicum, Vladimir Polony (2008) | **GNU GPL v3** (part of the OpenRep source) | yes, every link 1–3 | yes |
| `repertory/kent-1897/` — Kent, *Repertory* (1897) | CC0 1.0 | no, all links ungraded | yes |
| `repertory/knerr-1896/` — Knerr, *Repertory to Hering's Guiding Symptoms* (1896) | CC0 1.0 | partial (16,447 of 203,661) | yes |
| `repertory/boenninghausen-pocket-book-1891.json` | CC0 1.0 | no | yes |
| everything else in that repository | CC0 1.0 | varies | no |

## The decision

- **Data and code are licensed separately.** The application and this repository
  remain **PolyForm Noncommercial 1.0.0**. A database generated with the GPL v3
  repertory included is **GPL-3.0**, ships as its own file, carries this notice,
  and its source is the JSON repository above plus `scripts/build_core_db.py`.
- **Generated databases are not tracked in Git.** They are written to
  `materia_ai_data/generated/`, which is ignored, so a GPL-licensed binary never
  sits inside the PolyForm-licensed tree.
- **A CC0-only build exists** for anyone who needs it:
  `python3 scripts/build_core_db.py --source-dir <checkout> --cc0-only`.
  It contains no GPL material, so it can be redistributed under CC0. The cost is
  real and is not hidden: Kent's conversion in the source repository is roughly
  78% OCR debris with its *Extremities* chapter truncated, Knerr is about 48%
  debris, and only Knerr prints any grades (and only 8% of its links).
- **Repertorium Publicum is the only source that supports the three-tier grading
  the engine assumes.** Kent 1897 in the source repository is entirely ungraded,
  so a CC0-only core can offer remedy presence but not grades.

This is a licensing summary, not legal advice. If the GPL data is distributed,
the GPL v3 text and a source offer must travel with it.

## Why the previous database was rebuilt

the database shipped inside `materia_ai_core_bundle.zip` had:

- **51,268 of 55,768 rubrics** that were literally `"<Book> extracted rubric N"`;
- **36,646 remedy links, all generated** — grades 2 and 3 only, distributed
  uniformly per `rubric_id % 5` (1,385–1,515 per bucket), averaging 0.657 links
  per rubric where a real repertory carries tens;
- an **FTS5 virtual table**, which the WASM SQLite used by the app cannot open at
  all (`no such module: fts5`) — so the offline build could not ship it.

The rebuild removes all three: text and links are read from the source, grades are
`null` when the source prints none, and no virtual table is created.

## Rebuilding

```sh
git clone --depth 1 https://github.com/drsamonline/homoeopathic-materia-medica-repertory-json ../hmr-json
python3 scripts/build_core_db.py --source-dir ../hmr-json            # GPL-3.0 output
python3 scripts/build_core_db.py --source-dir ../hmr-json --cc0-only # CC0 output
```

The script writes the database plus `materia_ai_core.validation.json` (counts,
grade distribution, licence per book, sha256, self-check results) and exits
non-zero if it finds FTS5 tables, placeholder rubrics or orphan rows.

## Measured builds

| Build | Books | Rubrics | Links | Graded links | Size |
|---|---|---|---|---|---|
| default (all four) | 4 | 266,602 | 1,330,435 | 754,656 | 105 MB |
| `--cc0-only` | 3 | 192,122 | 594,975 | 19,196 (of which Knerr prints 16,447) | 58 MB |
| `--books repertorium-publicum-2008` | 1 | 74,480 | 735,460 | 735,460 (all) | 46 MB |

All three pass the self-checks (`integrity_check: ok`, 0 placeholder rubrics, 0 FTS
objects) and open in WASM SQLite: 167 ms to open the 105 MB build, 41 ms for counts,
21 ms for a `LIKE` scan, 241 ms for a grade-weighted ranking.

## Known limitations

- **Remedy identity is not unified across books.** Repertorium Publicum prints
  canonical names; Kent, Knerr and Boenninghausen often print only abbreviations, so
  the all-books build holds 10,365 remedy tokens against 669 in the single-book build.
  Unify before ranking across sources.
- **Kent's conversion in the source repository is roughly 78% OCR debris** and its
  *Extremities* chapter is truncated; Knerr is about 48% debris. Both are CC0 and
  included for completeness, not because they are clean.
- **Only Repertorium Publicum is fully graded.** Ungraded links are stored as `null`
  and are never defaulted, so the engine must decide how to weigh them.
- The default 105 MB build is larger than is comfortable to download on a phone;
  the single-book build (46 MB) or the CC0 build (58 MB) are the lighter options.

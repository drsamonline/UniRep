# UniRep — project guide

**PolyForm Noncommercial 1.0.0**

A **universal index** over the classical homoeopathic repertories: one search surface across several
books, so a rubric can be found by what it says rather than by remembering which volume printed it.

## What this repository is

It holds the application itself, under [`app/`](../app), together with the project's **policy
documents** — the privacy policy and the security policy.

The app runs on your own device. It has no server component, no account and no network calls;
the repertory database is bundled with it and built from `scripts/build_core_db.py`.

That is a deliberate split, and worth stating plainly: the code lives where it runs, and the promises
live where they can be read without running anything. A privacy policy buried in an application
bundle is one nobody reads.

## What it is for

Classical repertories are large and separately printed, and the same rubric appears in several of them
with different wording and different remedy sets. UniRep lets you search across them at once, so the
question "where does this rubric live" stops being a memory exercise.

## Licence

PolyForm Noncommercial 1.0.0. See [LICENSE](../LICENSE).

# Privacy

Version: 1.3
Effective: 16 November 2026
Owner: Dr Sohil Momin — sohilmomin2000@gmail.com
Changes: v1.3 states accurately what the app keeps on the device (cases you choose to save, encrypted)
and describes the encryption. v1.2 removed the hosted page: the app is built from this repository and
runs entirely on your own device (Android, iOS, desktop or a locally served web build).

What it collects is unchanged: nothing.

## What this app is

Universal Index Repertory

The app is installed from this repository — as an app on your device, or as a web build you serve
yourself. It has no server, no account and no sign-in, and nothing you type, search or store is
sent anywhere: there is no code in it that reaches a host outside your device.

## What it collects

**Nothing.** No analytics, no telemetry, no crash reporting, no fingerprinting, no advertising identifier, no
email capture.

The app makes no request that carries anything you type or store: searching and reading happen on your
device, and no search term, rubric or case note leaves it.

## What is stored on your device

Only what you choose to save, and only on that device:

- cases you store, with their rubrics and results;
- patients you add to a case;
- saved repertorisations;
- your theme choice.

Those records are written as **AES-256-GCM encrypted envelopes**. The data key is
wrapped with PBKDF2-SHA256 (150,000 iterations) when you set a PIN; with no PIN it
is kept next to the data, which protects the file but not the key store. The design
and its limits are documented in [docs/Vault-Encryption.md](docs/Vault-Encryption.md).

Nothing is uploaded, synced or backed up by the app. No search term, rubric or case
note is ever sent anywhere, because there is no code that makes such a request.
Removing a case in the app removes it from the device; clearing the app's data
removes everything.

## Links that leave the app

Documentation, the project index and the support page contain ordinary links. Opening one takes you to that
site, with its own privacy policy; the app loads nothing from it.

## Erasing

Clear the app's stored data, or delete the app itself. Nothing is held anywhere else, so there is no other
copy to ask us to remove.

## Changes

If a future version ever adds a request that carries your data, this file changes in the same commit.

Contact: Dr Sohil Momin — sohilmomin2000@gmail.com

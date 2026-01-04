# Independence Branch — V1 (Civic Foundations)

Independence Branch V1 is a **non-partisan civic self-reflection website** built for clarity, transparency, and privacy by default.

This version is intentionally limited in scope.

## What V1 Is
- A short **10-question** civic questionnaire (1–10 scale)
- Deterministic scoring and descriptive civic profile output
- Results are generated **client-side**
- Optional export of a **Private Result Image** (PNG) containing embedded data for consistency verification
- A verification page that checks **internal consistency** against official V1 logic

## What V1 Is Not
V1 does **not**:
- verify identity, citizenship, or taxpayer status
- enforce one-person participation
- claim representation of public opinion
- provide endorsements or voting guidance
- store individual answers on a server (by design)

## Privacy Notes
V1 is designed so questionnaire responses are processed locally in the browser.
No accounts are required.

## Consistency Verification (Important)
Verification confirms whether a submitted Private Result Image matches the official V1 logic.
It does **not** certify identity or origin.

Note: Some social platforms strip PNG metadata. Private Result Images are best treated as personal vault files.
Share Cards are separate images intended for posting.

## Tech
- Plain HTML/CSS/JS (static site)
- No backend required for V1

## Local Development
Use any static server, e.g.:

```bash
python -m http.server 8080

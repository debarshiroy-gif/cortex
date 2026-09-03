# PRD Merge — fold a completed gap into the master

You're given two documents: the **Master PRD** (the current, settled source of truth for a
project — it may already follow this app's 8-section PRD structure, or it may be an arbitrary
document uploaded from outside the system, in whatever format it was originally written) and a
**Gap PRD** (a just-completed enhancement describing what was added or changed on top of that
master). The enhancement described in the Gap PRD has now been delivered — your job is to fold
it into the Master so the Master becomes the single up-to-date description of the project,
reflecting what changed.

## Rules

- Preserve everything in the Master that the Gap didn't touch.
- Incorporate the Gap's new or changed scope so the result reads as one coherent document — not
  two documents stapled together.
- If the Master already follows the 8-section structure (Document Information, Executive
  Summary, Business/Functional Objective, Background and Context, Phases, In-Scope Work,
  Out-of-Scope Work, Acceptance Criteria), keep using it and merge into the corresponding
  sections.
- If the Master is a differently-structured or externally-authored document, use your judgment
  to weave the new content in wherever it fits best — but adopt the 8-section structure for the
  merged result if the Master's own structure has no obvious place for the new content, so
  future merges have a consistent target to build on.
- Where the Gap describes something that replaces or supersedes what the Master said, the Gap's
  version wins — describe the current, post-enhancement reality, not the history of how it got
  there.
- Do not include a JIRA story breakdown in the merged output — stories are specific to one gap's
  delivery, not an ongoing master description.
- Mark anything you had to infer while reconciling the two documents with "ASSUMPTION:" so the
  PM can review it.

## Response format

Plain markdown only — the merged document, in full, ready to become the project's new master
PRD content as-is. No JSON, no story block, nothing before or after the document itself.

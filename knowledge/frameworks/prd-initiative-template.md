# PRD (Initiative-level) — the pipeline's final, evidence-grounded document

You are drafting the Product Requirements Document for a Product Manager, at the end of
Cortex's full pipeline: Strategy Gate → BRD → Prototype → Validation. You are given the BRD,
the completed research and validation findings (which may include A/B test results comparing
prototype versions), and a summary of the prototype(s) actually built. Synthesize all of it —
this is not a rewrite of the BRD. Ground every claim you can in the specific evidence you were
given, and mark anything you had to infer with "ASSUMPTION:" so the PM can find and correct it.

## Document structure — produce exactly these 8 sections, in this order

1. **Document Information** — initiative name, product, status, draft date, version (start at
   v1.0), author ("Cortex AI — draft"), owner ("Product Manager").
2. **Executive Summary** — 3-5 sentences: what this is, why now, and the expected outcome.
3. **Business/Functional Objective** — organized by the functional team(s) that benefit
   (Compliance, Operations, Finance, Business, Risk, Data Science, Product Manager — whichever
   the BRD actually shows asked for something), stating each team's specific ask plainly. If the
   BRD didn't capture input from a team, don't invent an ask for it — omit that team rather than
   padding.
4. **Background and Context** — the problem statement, the hypothesis, the strategy-gate
   decision that got this initiative here, and the strongest 2-3 pieces of validation evidence
   (cite method and result plainly, e.g. "A/B test: Version 1 outperformed on completion rate
   and time-to-complete").
5. **Phases at Functional Level** — break delivery into named phases only if the scope
   genuinely warrants more than one — a small, single-team feature can be one phase; don't force
   artificial phasing. For each phase: name, functional scope, and a one-line rationale for why
   it's sequenced where it is.
6. **In-Scope Work** — the actual granular task list, grouped by phase if phases exist. Every
   task must be concrete enough to become a JIRA story. For each meaningful area of work, be
   explicit about:
   - **Data points** — what data fields/entities are read, written, or displayed.
   - **Logic** — business rules, validation, calculations involved.
   - **Mapping** — data mapping or integration points between systems, named even generically
     when that's what the BRD/prototype implies.
   - **Screens** — if the prototype demonstrated a UI, name the actual screen(s)/flow it built
     (pull this from the prototype summary you were given) and describe what's on it.
   If a task genuinely has no data/logic/mapping/screen dimension, say so rather than padding.
7. **Out-of-Scope Work** — explicitly excluded work, especially anything a stakeholder asked for
   that isn't included in this release, and why.
8. **Acceptance Criteria** — specific, testable, document-level conditions for the whole
   initiative to be considered done (Given/When/Then works well). This is the top-level bar, not
   the same thing as each story's own acceptance criteria below.

## Grounding rules

- **Never cite a prototype's own displayed numbers as real evidence.** Prototypes are instructed
  to show plausible-looking fabricated stats (timings, counts, percentages) for visual realism —
  those numbers are sample content, not measurements of anything that actually happened. Only
  cite numbers that came from an actual completed experiment or validation result you were given
  separately. It's fine to describe what a prototype's screen displays (e.g. "the mockup shows a
  progress indicator with a completion badge"), but never treat what it displays as a real
  benchmark, timing, or outcome.
- Preserve the BRD's stakeholder-team attribution — never blend different teams' asks together.
- Cite validation evidence specifically (method + result) — a PRD that doesn't reference what
  was actually learned during validation isn't doing its job.
- If a section has nothing to draw on (no BRD yet, no validation run yet, no prototype), say so
  plainly in that section instead of inventing content to fill it.
- Keep every section tight and scannable — this is a working document the PM edits, not an
  essay-length report. Favor short paragraphs and bullet lists over prose, and stop once a
  section has said what it needs to — don't pad length for its own sake.

## JIRA story breakdown

After the 8 sections, break the In-Scope work into a JIRA-ready set of stories a PM can paste
directly into JIRA under one Epic (the PRD document itself is the Epic). Append this as a fenced
JSON block, in exactly this shape:

```json
{
  "stories": [
    {
      "title": "<short, JIRA-summary-style title>",
      "description": "<what this story delivers, 2-4 sentences, JIRA-description style>",
      "acceptanceCriteria": ["<testable condition>", "..."],
      "phase": "<the phase name this belongs to, if phases exist — omit this key otherwise>"
    }
  ]
}
```

Every story must be independently workable — small enough for one sprint, specific enough that
a PM doesn't have to re-derive scope from the prose above. Do not create a story for
out-of-scope work.

## Response format

Write the 8 sections as normal markdown (`##` headings, numbered 1-8), then the fenced JSON
block last. Nothing before section 1 and nothing after the JSON block.

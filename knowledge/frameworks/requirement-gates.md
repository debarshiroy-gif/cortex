# Three-Gate Requirement Workflow

Every Requirement moves through three gates: **draft → verify → release**. Each gate
splits the work between what AI does and what a human must own — AI never
completes a gate transition on its own; a human always makes the call.

| Gate | AI does | Human owns |
|---|---|---|
| **Draft** | Turns expert interview/source text into atomic requirements; generates edge cases; flags vague or untestable acceptance criteria | Chooses which sources are authoritative; supplies the actual rules |
| **Verify** | Flags unverified, inconsistent, or stale requirements; checks internal traceability | Checks each requirement against the real regulation; signs the row (name + date) |
| **Release** | Final consistency/traceability pass | Certification, accountability, approval |

## Atomicity

A requirement is atomic when it expresses exactly one testable rule. "The system shall
validate and log all login attempts" is two requirements, not one — split it.

## Vague or untestable acceptance criteria

Flag criteria that can't be checked by a specific test: words like "fast", "intuitive",
"appropriate", "as needed", or "user-friendly" without a measurable threshold. A good
criterion reads like a test case: "Given X, when Y, then Z."

## Unverified / inconsistent / stale (Verify gate)

- **Unverified**: no source_provenance, or no human has recorded a verification yet.
- **Inconsistent**: the acceptance criteria or edge cases contradict the requirement
  text, or contradict each other.
- **Stale**: the requirement text changed after it was last verified, or it hasn't been
  re-checked in a long time relative to its regime's risk.

## Traceability

A requirement is traceable when an auditor could follow it back to evidence: a cited
source_provenance, a linked_insight_id, or a linked_prototype_area. A requirement with
none of these has no paper trail.

## What AI must never do

AI drafts, flags, and checks. AI never signs off, never certifies, and never
marks a requirement verified on a human's behalf. Every gate advance is a human action;
AI's checks only inform that decision.

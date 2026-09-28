# BRD Template

## Structure
1. **Executive Summary** — what this initiative is and why it matters, in 3-4 sentences.
2. **Business Objective** — the problem statement and hypothesis, and the strategy-gate
   decision that got this initiative here (proceed/pivot rationale).
3. **Research & Evidence** — the strategy-gate experiment findings, cited by method, plus
   anything relevant from the approved meeting notes you're given. This is what earns the
   objective the right to be believed, not just asserted.
4. **Stakeholder Requirements** — organized under one heading per functional team
   (Compliance, Operations, Finance, Business, Risk, Data Science, Product Manager).
   Every requirement stays attributed to the team that raised it — never blend requirements
   from different teams into one anonymous list. If a team has no approved input yet, say
   so under its heading rather than omitting the section.
5. **Assumptions & Constraints** — anything the draft had to infer.
6. **Open Questions** — unresolved items, with which team should answer each one.
7. **Risks** — what could go wrong, and which stakeholder input or evidence gap it traces to.

## How AI should use this
Given an Initiative's context, its strategy-gate experiment findings, and its approved
stakeholder inputs (each tagged with the team it came from), draft a full BRD in this
structure. Preserve source attribution explicitly — a reader should be able to tell which
team asked for what without cross-referencing anything else. Mark anything not backed by a
cited experiment or a specific stakeholder input with "ASSUMPTION:" so the PM can find and
correct it. If a whole section has nothing to draw on (no experiments yet, or no approved
input from any team), say that plainly instead of inventing content to fill the section.

## Prompt pattern
```
Draft a BRD for this initiative using the standard template. Organize stakeholder
requirements by functional team, cite the research findings, and mark any assumptions
with "ASSUMPTION:" so the PM can review and correct them.
```

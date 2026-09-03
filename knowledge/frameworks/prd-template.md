# PRD Template

## Structure
1. **Problem** — what user/business problem are we solving? Cite evidence (insights, metrics).
2. **Goals** — what does success look like? Tie to a Metric/KR where possible.
3. **Non-goals** — explicitly out of scope, to prevent scope creep.
4. **Users/Personas** — who is this for?
5. **User stories** — "As a [persona], I want to [action], so that [benefit]."
6. **Acceptance criteria** — specific, testable conditions for each story (Given/When/Then works well).
7. **Open questions** — unresolved decisions, flagged for review, with an owner and due date.
8. **Risks & edge cases**
9. **Launch plan** — tier, rollout strategy, success metrics to watch post-launch.

## How Claude should use this
Given a one-line feature idea plus context from the Initiative/Persona/Insight it's tied to, draft a full PRD in this structure. Be explicit about what's inferred vs. what needs the PM to confirm — mark inferred sections with "ASSUMPTION:" so they're easy to find and correct. Keep acceptance criteria testable, not vague ("works well" is not testable; "loads in under 2s for 95th percentile" is).

## Prompt pattern
```
Draft a PRD for this feature idea using the standard template. Pull context
from the linked initiative and persona. Mark any assumptions you make with
"ASSUMPTION:" so I can quickly review and correct them.
```

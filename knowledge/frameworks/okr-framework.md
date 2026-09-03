# OKRs (Objectives & Key Results)

- **Objective**: qualitative, inspiring, time-bound (usually quarterly).
- **Key Results**: 2-4 quantitative, measurable outcomes that prove the objective was achieved. Outcomes, not outputs — "increase 7-day retention from 32% to 40%," not "ship feature X."

Good KR test: could you achieve it without actually improving the product (e.g., by gaming a metric)? If yes, it's a bad KR.

## How Claude should use this
When a user drafts an OKR, check whether key results are outcomes (user/business impact) vs. outputs (shipped features) and push back on output-framed KRs. Tie each KR to a Metric entity so progress can be tracked automatically.

## Prompt pattern
```
Review this objective and key results. Flag any KR that's actually an output
(a shipped feature) rather than an outcome (a measurable change in user or
business behavior), and suggest a rewrite.
```

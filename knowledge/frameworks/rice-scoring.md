# RICE Scoring Framework

Used to prioritize initiatives/features objectively.

**Score = (Reach × Impact × Confidence) / Effort**

- **Reach**: number of people/events affected per time period (e.g., users/quarter). Estimate from data, not gut feel.
- **Impact**: how much it moves the needle per person. Scale: 3 = massive, 2 = high, 1 = medium, 0.5 = low, 0.25 = minimal.
- **Confidence**: how sure you are about Reach/Impact estimates. 100% = high confidence, 80% = medium, 50% = low. Use as a decimal (1.0, 0.8, 0.5).
- **Effort**: person-months to build, rounded to nearest 0.5.

## How AI should use this
When scoring an initiative, ask the user (or infer from context) for the four inputs, show the math, and output a ranked table across all initiatives being compared. Flag when Confidence is below 50% — that's a signal to validate before committing engineering time, not a reason to discard the idea.

## Prompt pattern
```
Given these initiatives with their reach/impact/confidence/effort estimates,
calculate RICE scores and rank them. Flag any where confidence < 50% as
"needs validation" rather than "ready to build."
```

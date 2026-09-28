# Kano Model

Classifies features by how they affect satisfaction:

- **Must-be**: expected baseline. Absence causes dissatisfaction; presence doesn't add delight (e.g., app doesn't crash).
- **Performance**: satisfaction scales linearly with how well it's done (e.g., faster load times).
- **Delighter**: unexpected, disproportionate positive impact (e.g., a surprising personalization touch).
- **Indifferent**: users don't care either way.
- **Reverse**: some users are actively annoyed by it.

## How AI should use this
When reviewing a backlog, tag each feature with a Kano category based on the problem statement and user context, and flag if the roadmap is too skewed toward one category (e.g., all must-be = safe but boring; all delighters = risky, may be missing basics).

## Prompt pattern
```
Classify each feature in this backlog into a Kano category with a one-line
justification. Then flag if the overall mix looks unbalanced.
```

# Opportunity Solution Tree (Teresa Torres)

Connects a desired outcome to the opportunities (pain points/needs) that could drive it, and the solutions/experiments that address each opportunity.

```
Outcome (e.g., increase activation rate)
├── Opportunity 1 (a user need/pain point, from research)
│   ├── Solution A
│   ├── Solution B
│   └── Experiment to test A vs B
├── Opportunity 2
│   ├── Solution C
└── Opportunity 3
    ├── Solution D
    └── Solution E
```

Rules:
- Opportunities come from evidence (interviews, insights), not brainstorming.
- Each opportunity can have multiple candidate solutions — don't jump to the first idea.
- Solutions should be tied to a small experiment/test before big investment.

## How Claude should use this
Given a target outcome and a list of insights (from the Interview/Insight entities), cluster insights into opportunities, then propose 2-3 candidate solutions per opportunity with a suggested cheap experiment to validate each. Render as a tree, not a flat list.

## Prompt pattern
```
Given this outcome and these insights, build an opportunity solution tree:
group insights into opportunities, propose solutions per opportunity, and
suggest one lightweight experiment to test the riskiest assumption in each.
```

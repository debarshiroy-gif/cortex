# Data Analysis — read the data, don't guess at it

You're given a CSV file and the hypothesis a Product Manager wants to check against it.
Read the actual rows provided — every number and conclusion in your answer must be
traceable to the data you were given, not a plausible-sounding guess.

Report:
1. **What the data shows** — the specific numbers relevant to the hypothesis (counts,
   rates, distributions — whatever the columns actually support).
2. **Whether it supports or undercuts the hypothesis**, and how confidently — say so
   plainly rather than hedging.
3. **Caveats** — sample size, data quality issues, missing columns you'd have wanted,
   anything that limits how much weight this finding should carry.

If the CSV doesn't actually contain what's needed to evaluate the hypothesis, say that
directly instead of stretching an unrelated column into an answer.

Respond as plain prose (no JSON) — this becomes the experiment's recorded result as-is.

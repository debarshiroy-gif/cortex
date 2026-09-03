# North Star Metric (NSM)

A single metric that best captures the core value your product delivers to customers, and predicts long-term business success.

Good NSM properties:
- Reflects customer value received, not just company revenue (revenue is a lagging output, not a NSM)
- Leading indicator of long-term business success
- Understandable and actionable by every team

Examples: Airbnb — nights booked. Spotify — time spent listening. Slack — messages sent between teammates within first N days.

NSM is usually supported by 2-4 **input metrics** (things teams can directly influence that drive the NSM) and **guardrail metrics** (things that shouldn't regress, e.g., churn, latency).

## How Claude should use this
When helping define a NSM, ask what value the product delivers to the user (not the business), propose 2-3 candidate NSMs, and stress-test each against the "customer value + leading indicator" criteria. Then propose input metrics that ladder up to it.

## Prompt pattern
```
Given this product description, propose 2-3 candidate North Star Metrics.
For each, explain how it reflects customer value (not just revenue) and
what 2-3 input metrics would ladder up to it.
```

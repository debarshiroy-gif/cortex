# Jobs-to-be-Done (JTBD)

People don't buy products, they "hire" them to do a job. A job statement has three parts:

**When** [situation], **I want to** [motivation], **so I can** [expected outcome].

Example: "When I'm prioritizing next quarter's roadmap, I want to see which initiatives tie to real user pain, so I can defend my choices to leadership."

## Job types
- **Functional** — the practical task
- **Emotional** — how they want to feel (confident, in control, unburdened)
- **Social** — how they want to be perceived by others

## How AI should use this
When synthesizing interview notes or insights, extract job statements in the format above rather than feature requests. If a user says "I wish there was a button to export to PDF," the underlying job might be "when I share progress with my exec, I want a clean artifact, so I can look credible" — surface the job, not just the ask.

## Prompt pattern
```
Read these interview notes. Extract 3-5 job statements in JTBD format
(When/I want to/So I can). Separate functional, emotional, and social jobs.
Don't just restate feature requests — infer the underlying job.
```

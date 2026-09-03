# Launch / GTM Checklist

## Launch tiers
- **Tier 1 (major)**: press, exec review, full GTM plan, cross-functional launch team
- **Tier 2 (minor)**: in-app announcement, changelog, support team briefed
- **Tier 3 (patch)**: changelog only

## Standard checklist items (adjust by tier)
- [ ] Success metrics defined and dashboard ready
- [ ] Support/CS briefed with FAQ
- [ ] Sales/marketing briefed (if customer-facing)
- [ ] Rollout plan (all at once / phased / feature-flagged)
- [ ] Rollback plan defined
- [ ] Internal announcement drafted
- [ ] External announcement drafted (blog/email/in-app)
- [ ] Post-launch review scheduled (usually 2 weeks out)

## How Claude should use this
Given a feature and its tier, generate a checklist scoped to that tier — don't generate a Tier 1 checklist for a Tier 3 patch. Pull in the actual feature name, metrics, and audience from the Feature/Release entities rather than leaving placeholders.

## Prompt pattern
```
Generate a launch checklist for this release at [tier]. Populate it with
the actual feature names and success metrics from the release record,
not generic placeholders.
```

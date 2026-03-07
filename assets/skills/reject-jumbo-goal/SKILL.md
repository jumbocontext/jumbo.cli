---
name: reject-jumbo-goal
description: Use when a Jumbo goal fails QA review and needs to be returned for rework. Records review issues and routes the goal back to the implementing agent with actionable feedback.
---

# Reject Jumbo Goal

**Prompt:** Reject a Jumbo goal that failed QA review, recording the specific issues found so the implementing agent can address them and restart.

## Why Rejection Quality Matters

When a goal is rejected, the implementing agent receives the review issues as its primary guidance for rework. Vague or incomplete rejection feedback causes wasted rework cycles — the agent guesses at what's wrong, fixes the wrong things, and resubmits with the same issues. Precise, actionable rejection feedback is the fastest path to a passing review.

## Protocol

### 1. Document Review Issues

Before rejecting, ensure you have a clear, specific list of every issue found during QA review. Each issue must be:

- **Specific**: Reference exact files, functions, or behaviors that are wrong.
- **Actionable**: Describe what needs to change, not just what's wrong.
- **Traceable**: Link back to the success criterion, invariant, or guideline that was violated.

### 2. Reject the Goal

```bash
jumbo goal reject --id <goal-id> --issues "<detailed review issues>"
```

The rejection output confirms:
- The goal ID and objective
- The goal's status (returned to a reworkable state)
- The review issues recorded for the implementing agent

### 3. Communicate Next Steps

After rejection, the implementing agent should:

1. Address every review issue documented in the rejection.
2. Restart the goal to reload context:
   ```bash
   jumbo goal start --id <goal-id>
   ```
3. Re-implement the fixes within the original scope and constraints.
4. Resubmit for review:
   ```bash
   jumbo goal submit --id <goal-id>
   ```

If a next goal is queued, its ID will be displayed for reference, but the rejected goal takes priority.

## Rules

1. **Never reject without specific issues.** Every rejection must include actionable feedback the implementing agent can act on.
2. **Never combine rejection with rework.** The rejecting agent reviews; the implementing agent fixes. Do not attempt both roles.
3. **Always reference violated criteria.** Tie each issue back to a success criterion, invariant, or guideline so the implementing agent understands the standard.
4. **Keep issues structured.** Use numbered or bulleted lists. One issue per point. No walls of text.
5. **Never reject for out-of-scope concerns.** Only reject for issues within the goal's defined scope and criteria.

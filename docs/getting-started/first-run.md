---
title: First Run
description: Get Jumbo set up in your project and complete your first goal.
sidebar:
  order: 2
---

Get Jumbo initialized and complete your first goal with these simple commands:

```bash
jumbo init           # Set Jumbo up
claude               # Seed Jumbo with existing project knowledge
jumbo goal add       # Create a goal
claude               # Refine, implement, review, and codify
```

Full walkthrough below.

---

## Step 1: Initialize your project

Navigate to your project directory and run:

```bash
jumbo init
```

Jumbo walks you through a short setup, then shows a plan of what it will create before asking for confirmation:

```
? Project name: My Project
? Purpose (optional): A short description of what this project does
? Proceed with initialization? Yes

Initializing project...

  ✓ Updated AGENTS.md
  ✓ Updated CLAUDE.md
  ...

✅ Welcome to Jumbo! Project initialized successfully.
  projectId: project
  name: My Project
```

Jumbo creates a `.jumbo/` directory containing your project's memory store, configures agent hooks, and installs Jumbo skills. See [What Jumbo Creates](what-jumbo-creates.md) for the full list of files.

---

## Step 2: Seed Jumbo

Start your AI coding agent. For example, with Claude Code:

```bash
claude
```

Jumbo hooks into the session and prompts your agent to capture existing project knowledge.

:::note
You might need to run an initial prompt like "Hi" or "Follow instructions" to initiate the agent.
:::

The agent will read your project's `AGENTS.md`, run `jumbo session start`, and offer to capture your existing project knowledge:

```
❯ hi

● I can see you've added Jumbo to this project. This looks like an existing
  codebase with valuable context to preserve. Would you like me to help
  transfer your existing project knowledge into Jumbo? I can scan your
  documentation, code structure, and patterns to capture:

  - Project purpose and target audience
  - Architectural components and dependencies
  - Development guidelines and coding standards
  - Architectural decisions from docs, comments, or ADRs

  Should we start by scanning your project documentation?
```

:::note
This example is from a brownfield project with existing code and documentation. In a greenfield project, the agent will acknowledge there is no existing context to capture and prompt you for what to work on.
:::

Tell the agent to proceed:

```
❯ go for it
```

The agent will scan your project and begin registering what it finds with Jumbo — components, decisions, guidelines, dependencies, and more. Each registration requires your approval:

```
Bash command

  jumbo component add --name "Identity & Tenant Service"
    --description "Handles user authentication, RBAC, and tenant management."

This command requires approval

Do you want to proceed?
❯ 1. Yes
  2. Yes, and don't ask again for: jumbo component:*
  3. No
```

Select option 2 to auto-approve subsequent registrations of the same type, or review each one individually.

End your agent session when finished, or clear context and switch to a fresh terminal for Step 3.

:::tip[Best practice]
Archive all of your context related `.md` files to a location outside of your repository, and strip your `AGENTS.md` of any special instructions that can be registered with Jumbo. They will cause context bloat and potential conflicting instructions (as your project evolves) if left for agents to read. *You can always ask an agent to port them from Jumbo to an `.md` later if you want to remove Jumbo.*
:::

---

## Step 3: Create a goal

Goals are how you tell Jumbo what needs to be done. Each goal has an objective and success criteria.

Create your first goal from the terminal:

```bash
jumbo goal add \
  --title "Add rate limiting" \
  --objective "Add rate limiting middleware to the API" \
  --criteria "Returns 429 with Retry-After header when limit exceeded" \
    "Reads rate limit threshold from app configuration" \
    "Rate limits configurable per route via config" \
    "Bypasses health check and metrics endpoints" \
    "Includes unit tests for limit exceeded scenarios"
```

Output:

```
SUCCESS Goal defined
  goalId: goal_01JXXXXXXXXXX
  title: Add rate limiting
  objective: Add rate limiting middleware to the API
  criteria:
    - Returns 429 with Retry-After header when limit exceeded
    - Reads rate limit threshold from app configuration
    - Rate limits configurable per route via config
    - Bypasses health check and metrics endpoints
    - Includes unit tests for limit exceeded scenarios
  status: defined
```

Your goal is now in `defined` status — registered with Jumbo but not yet ready for implementation. The next step is to put your agent to work refining and implementing it.

---

## Step 4: Put the agent to work

:::note
These next steps walk you through the standard Jumbo workflow for implementing goals. It is recommended to adopt [advanced workflows](../guides/advanced-workflows.md) once the basics are understood.
:::

Start a fresh agent session. Jumbo presents your planned goals:

```
❯ hi

● Session is active. Here's where things stand:

  No goals currently in progress. There is 1 planned goal in the backlog:

  1. Add rate limiting middleware

  Should I start with the planned goal, or do you have something else in mind?
```

### Step 4.a: Refine the goal

Instruct the agent to refine the goal:

```
❯ refine the rate limiting goal
```

The agent searches Jumbo for project knowledge relevant to the goal — components, decisions, guidelines, and dependencies — and links them so the implementing agent receives precise context. When finished, the agent runs `jumbo goal commit`, marking the goal ready for implementation.

Clear the agent's context window or restart the session before moving to Step 4.b. Each phase works best with a fresh context window so the agent isn't carrying stale conversation history.

:::tip[Best practice]
Dedicate a terminal to refinement and clear the context window after each goal. Use a model that excels at planning and deep thinking — the upfront investment in more capable models pays dividends during implementation.
:::

---

### Step 4.b: Implement the goal

Open a new terminal or restart your agent to get a fresh context window. The agent will greet you with your planned goals again. Instruct it to start the goal:

```
❯ start the rate limiting goal
```

The agent receives the goal's context packet from Jumbo and begins implementation. When finished, the agent runs `jumbo goal submit`, marking the goal ready for review.

Clear context before moving to Step 4.c.

:::note
Correct the agent if it makes mistakes along the way. A mistake is likely the result of a guideline or invariant that has not been registered with Jumbo. The agent should capture the correction and propose an addition. These instances happen frequently when Jumbo is first added to a project, but decrease over time.
:::

:::tip[Best practice]
Dedicate a terminal to implementation. A second-tier model (e.g., Sonnet 4.6) should yield positive results if the refinement best practices are followed.
:::

---

### Step 4.c: Review the goal

Open a new terminal or restart your agent. Instruct the agent to review the goal:

```
❯ review the rate limiting goal
```

The agent verifies each criterion against the implementation.

If approved, the agent runs `jumbo goal approve`, marking the goal ready for codification. There is typically enough context window left to continue directly to Step 4.d.

If issues are found, the agent registers them with Jumbo and runs `jumbo goal reject`, returning the goal for rework. Clear the context window and repeat from Step 4.b.

:::tip[Best practice]
Dedicate a terminal to reviewing goals. Clear the context window after reviewing each goal.
:::

---

### Step 4.d: Codify and close the goal

After approval, instruct the agent to codify the goal:

```
❯ codify the goal
```

The agent captures new learnings, reviews registered entities for staleness, updates documentation, then closes the goal.

You've completed your first full goal lifecycle: **define → refine → implement → review → codify**. Every decision, guideline, and component the agent registered along the way is now part of Jumbo's memory and will inform future goals.

---

## What's next?

- [What Jumbo Creates](what-jumbo-creates.md) — Understand the full project footprint
- [Goal Management](../guides/goal-management.md) — Learn the full goal lifecycle
- [Advanced Workflows](../guides/advanced-workflows.md) — Multi-agent workflows and productivity tips

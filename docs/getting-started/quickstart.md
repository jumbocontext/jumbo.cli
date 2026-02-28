---
title: Quickstart
description: Get Jumbo working with your AI coding agent in under 2 minutes.
sidebar:
  order: 2
---

# Quickstart

Get Jumbo working with your AI coding agent in under 2 minutes.

---

## What you'll accomplish

By the end of this guide, you'll have:

- Initialized Jumbo in your project
- Started your first session
- Created and started your first goal

---

## Step 1: Initialize your project

Navigate to your project directory and run:

```bash
> jumbo init
```

Follow the interactive prompts to configure your project. Jumbo creates a `.jumbo/` directory containing your project's memory store and configures agent hook files. See [What Jumbo creates](what-jumbo-creates.md) for the full list of files.

---

## Step 2: Start an agent session

<sub>Example: Claude Code CLI:</sub>
```bash
> claude
```

Jumbo hooks into the session and instructs your agent to seed Jumbo with any project knowledge currently known. *You might need to run an initial prompt like 'Hi.' to initiate the agent.*

**[BEST PRACTICE]**  
Your agent should ask you if that is how you want to it to seed Jumbo. Agree and review its proposed commands before approving.  

End your agent session when finished.

---

## Step 3: Create a goal

```bash
> jumbo goal add --objective "Add rate limiting middleware to the API" --criteria "Returns 429 with Retry-After header when limit exceeded" "Reads rate limit threshold from app configuration" "Rate limits configurable per route via config" "Bypasses health check and metrics endpoints" "Includes unit tests for limit exceeded scenarios"
```

Output:

```
SUCCESS Goal defined
  goalId: goal_01JXXXXXXXXXX
  objective: Add rate limiting middleware to the API
  criteria:
    - Returns 429 with Retry-After header when limit exceeded
    - Reads rate limit threshold from app configuration
    - Rate limits configurable per route via config
    - Bypasses health check and metrics endpoints
    - Includes unit tests for limit exceeded scenarios
  status: defined
```

---

## Step 4: Put the agent to work

<sub>Example: Claude Code CLI</sub>
```bash
> claude
```

Jumbo hooks into your agent session. The agent should identify your goal and ask what you would like to work on. Instruct it to start the goal...

Give the agent permission to run ```> jumbo goal start``` when it asks.

The agent will begin implementing your goal based on the prompt is received from Jumbo. The prompt contains details about your goal and any relevant context provided in the seeding.

---

## Step 5: Complete the goal

Give the agent permission to run ```> jumbo goal complete``` when it has finished the work.  

Jumbo records the completion and prompts your AI agent to capture any lessons learned.

---

## What's next?

- [What Jumbo creates](what-jumbo-creates.md) — Understand the full project footprint
- [Deep dive into goal management](../guides/goal-management.md) — Learn the full goal lifecycle
- [Project initialization guide](../guides/project-initialization.md) — Configure hooks and capture project knowledge
- [Session management](../guides/session-management.md) — Manage work sessions effectively

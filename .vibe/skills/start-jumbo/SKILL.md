# Auto Session Start Skill

## Metadata
- **Name**: start-jumbo
- **Trigger**: on_startup
- **Priority**: high
- **Description**: Automatically starts a Jumbo session to load project context

## Behavior

When the agent starts a new session:
1. Immediately execute: `jumbo session start`
2. Wait for the command to complete
3. Display the session orientation context to the user
4. Proceed with normal agent operation

## Implementation

```bash
# This skill runs automatically on agent startup
# It ensures project context is loaded before any work begins
jumbo session start
```

## Notes
- This skill runs before any user interaction
- It provides essential project orientation context
- The session ID and context are available for subsequent commands
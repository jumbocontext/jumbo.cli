# Startup Instructions

## Automatic Session Management

Use the `auto-jumbo-session` skill to automatically load project context at the beginning of each session. This ensures the agent has proper orientation before assisting with any tasks.

## Agent Behavior Guidelines

1. **Session First**: Always ensure a session is active before starting work
2. **Context Awareness**: Use the session context to understand project state
3. **Goal Orientation**: Check for in-progress or planned goals from session data
4. **Proactive Assistance**: Based on session context, suggest relevant next steps

## Command Reference

- Start session: `jumbo session start`
- End session: `jumbo session end --focus "description" --summary "details"`
- Start goal: `jumbo goal start --goal-id <id>`
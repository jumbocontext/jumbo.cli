# JUMBO.md

## Instructions for Agents on how to collaborate with Jumbo

Dear Agent,

This project uses Jumbo CLI for agent orchestration and context management. Jumbo is a proxy for me. You must follow all prompts received from running `jumbo` commands, and take full advantage of `jumbo` commands to ensure optimal collaboration and maximal efficiency in executing goals.

Sincerely,
Project Administrator

### When you start a new Session Start
Run `jumbo session start`

This orients you with the current state of the project: high-level project, recent events and a goal backlog to select work from.

### Pre Compaction/Compression
If a goal is actively being implemented.

Run `jumbo work pause`

### After Compaction/Compression
Run `jumbo work resume`

This will automatically serve context of a goal that you were progressing on prior to compaction.

### Before Finishing a Session
Run `jumbo session end --focus {focus-description}` --summary {summary-of-what-transpired}

### Before Starting Work on a Goal
Run `jumbo goal start --id <id>`

### Maintain Context as You Work

Jumbo is your persistent memory across sessions. Keeping it accurate is part of your job — not a cleanup step, but something you do in real-time as you work, the same way you write tests alongside code.

#### During Refinement
When you discover that work X must happen before a goal can succeed, register it immediately:
```
jumbo goal add --objective "X that must happen first"
jumbo goal update --id <current-goal-id> --prerequisite-goals <new-goal-id>
```

#### During Implementation
When you make an architectural decision, register it before moving on:
```
jumbo decision add --title "Chose X over Y" --rationale "Because Z" --context "Background"
```

When you create a new component, register it and link it:
```
jumbo component add --name "ComponentName" --description "What it does"
jumbo relation add --from-type goal --from-id <goal-id> --to-type component --to-id <component-id> --type involves --description "Created during implementation"
```

#### When the User Corrects You
When user feedback changes the approach, capture it as a durable constraint:
```
jumbo invariant add --category "architecture" --description "Never do X because Y"
jumbo guideline add --category "codingStyle" --description "Prefer X over Y"
```

#### Why This Matters
Context you register now is served to future sessions — yours or another agent's. Unregistered decisions, components, and corrections are lost at session end. The more you capture, the fewer mistakes future sessions make.

### Available Commands
`jumbo --help `
`jumbo goal add --help `
`jumbo goal refine --help `
`jumbo goal block --help `
`jumbo goal complete --help `
`jumbo goal remove --help `
`jumbo goal reset --help `
`jumbo goal resume --help `
`jumbo goal show --help `
`jumbo goal start --help `
`jumbo goal unblock --help `
`jumbo goal update --help `
`jumbo goals list --help `
`jumbo session end --help `
`jumbo session pause --help `
`jumbo session resume --help `
`jumbo session start --help `
`jumbo component add --help `
`jumbo component deprecate --help `
`jumbo component remove --help `
`jumbo component update --help `
`jumbo decision add --help `
`jumbo decision reverse --help `
`jumbo decision supersede --help `
`jumbo decision update --help `
`jumbo dependency add --help `
`jumbo dependency remove --help `
`jumbo dependency update --help `
`jumbo guideline add --help `
`jumbo guideline remove --help `
`jumbo guideline update --help `
`jumbo invariant add --help `
`jumbo invariant remove --help `
`jumbo invariant update --help `

### Next step:
Run `jumbo session start` to retrieve project orientation.

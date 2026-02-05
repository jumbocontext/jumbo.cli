# Agents.md

## Instructions for Jumbo

**IMPORTANT: This project uses Jumbo CLI for agent orchestration and context management.**

Follow all prompts received from running `jumbo` commands.

### On Session Start
Run `jumbo session start`

### After Compaction/Compression
If a goal is actively being implemented.  
Run `jumbo goal resume --goal-id {active-goal-id}`

### Before Finishing a Session
Run `jumbo session end --focus {focus-description}` --summary {summary-of-what-transpired}

### Before Starting Work on a Goal
Run `jumbo goal start --goal-id <id>`

### Be Proactive
Be vigilant in identifying insights, from your interactions with the user, that match the command types and ask the user if they would like you to register them with Jumbo.

### Available Commands
`jumbo goal add --help `
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
`jumbo architecture define --help `
`jumbo architecture update --help `
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

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

### Be Proactive - Use Jumbo to the Fullest Extent
Jumbo supercharges your abilities and consistency by supplying you with durable memory. Use is unsparingly. Be vigilant in identifying user decisions that change the existing standards for the project. Document when new patterns are introduced or removed. Capture corrections made by the user in the form of invariants or guidelines. If a new pattern is introduced, capture it. If a new component is introduced capture it. If new relations are relevant, register them. Use the full jumbo command catalog to quickly gain project insights. The rate of successful collaborations and ability to deliver on the developers wishes without error will highly increase the more you leverage Jumbo.

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

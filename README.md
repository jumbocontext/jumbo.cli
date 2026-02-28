<p align="center">
  <img src="jumbo-logo.svg" alt="Jumbo" width="200">
</p>

<h1 align="center">Jumbo - Memory for Coding Agents</h1>

<p align="center">
  Use Jumbo. <br>
  Focus on goals, not context.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#faqs">FAQs</a>
</p>

---

## Can we address the elephant in the room?

Face it, working with coding agents is not ALL fun.  
One step back for every two forward is not a productivity boost.  
It's a hassle.

Context engineering alleviates the pain, but has you focused on the wrong things.


## How does Jumbo help?

Jumbo is a CLI tool that gives your coding agent memory like an... well, <span style="font-size: 1.5rem;">🐘</span>. <br>
It keeps your agent on track, and you focused on what you want to build.

### Seen in Action

**Before Jumbo:**

```
Monday - Claude Code CLI:
You: 
   "I'm building an Event Driven distributed system..."
Claude: 
   *helps for 2 hours*

Tuesday - New chat:
You: 
   "Continue working on my Event Driven distributed system"
Claude: 
   "What Event Driven distributed system? Can you describe your project?"
You: 
   *spends 20 minutes re-explaining everything*
```

**After Jumbo:**

```
Monday - Claude Code CLI:
You: 
   "I'm building an Event Driven distributed system..."
Claude: 
   *helps for 2 hours*

Tuesday - New chat (or different AI tool):
You: 
   "Hi"  
Claude:
   "Hi! I can see we have 2 planned goals ready to work on:

     - Model the Auth domain
     - Implement Auth abstractions

    Would you like to start with one of these goals, or did you have something else in mind?"
```

### Seen in Benefits
- **Tracks project details**  
Important aspects of you project are stored, retrievable, and mutable.  
<sub>(see below)</sub>

- **Delivers optimized context**  
Agents receive the context they need to work aligned with YOUR criteria.

- **Portable**  
Switch models, or move from CLI to IDE, without interruption. Jumbo stays with you project and knows exactly where you left off.

- **Extends context windows**  
Optimal context delivery lets agents work longer.

- **Automatic**  
Hooks into your agent session and orchestrates the flow. It just works.

- **Full control**  
Jumbo's memories are yours. Stay in control and manage your data directly from the terminal.

- **Private**  
All data stays local. Nothing leaves your machine.

- **Fast**  
No network calls. No lag. Works instantaneously.  


## What's in the trunk?
Jumbo models memories as the following aggregates:

- **Project**
What you are building and who it's for.
- **Architecture**
Your solution design, structure and patterns applied.
- **Components**
The parts comprising your solution and their roles.
- **Dependencies**
What your project relies on.
- **Decisions**
A history of why you chose what you chose.
- **Guidelines**
The preferences, best practices, and the standards you adhere to.
- **Invariants**
The rules you simply won't compromise on.
- **Audiences**
Who uses your product and their priorities.
- **Audience Pains**
The problems your audiences face that you aim to solve.
- **Value Propositions**
How your product addresses each audience pain.
- **Relations**
Connections between goals and knowledge entities for targeted context delivery.
- **Goals**
What you're working on—a 13-state lifecycle with refinement, review, and codification phases.
- **Sessions**
Manage work continuity with pause, resume, compact, and multi-agent support.
- **Maintenance**
Repair agent configuration and rebuild projections when needed.
- **Context Packets**
Optimized context packets delivered to your AI agents.


---

## Quick Start

```bash
# Install globally
npm install -g jumbo-cli

# Initialize in your project
jumbo init
```

That's it. Jumbo will guide you through the rest. Fire up your coding agent next and they'll use Jumbo automatically.

---

## Documentation

| Resource | Description |
|----------|-------------|
| [Quickstart](docs/getting-started/quickstart.md) | Get running in 5 minutes |
| [Installation](docs/getting-started/installation.md) | Prerequisites and setup |
| [Concepts](docs/getting-started/concepts.md) | Understand sessions, goals, and context |
| [Goal Management](docs/guides/goal-management.md) | Complete guide to tracking work |
| [Command Reference](docs/reference/) | Full command documentation |

---

## Dependencies

Jumbo is built with:

| Package | Purpose |
|---------|---------|
| better-sqlite3 | Local event store and projections |
| commander | CLI framework |
| chalk | Terminal styling |
| yaml | Context serialization |
| inversify | Dependency injection |
| ulid | Time-sortable unique IDs |

---

## FAQs

**How does jumbo integrate with my AI agent?**

Through hooks. Your agent calls `jumbo session start` at the beginning of a session, and `jumbo` injects relevant project context. A richer context packet is delivered to the agent when it starts work on a goal. New insights are captured in the natural flow of your agent conversations.

**What if I change agents or models?**

Change agents and models at will. `jumbo` just picks up where you left off.

**What coding agents does jumbo work with?**

`jumbo` has been battle tested with Claude Code, GitHub Copilot, and Gemini. More to be verified soon...

**What IDEs are supported?**

Theoretically, any IDE with an integrated coding agent should work. VS Code running GitHub Copilot has been tested and works well with all supported models. Cursor to be verified soon...

**Where is data stored?**

Locally, in `.jumbo/` within your project. Nothing leaves your machine unless you want it to.

**Can I control what data Jumbo captures?**  

Absolutely. You control how you want your agent to interact with Jumbo. Stay in-the-loop by approving each command, or run with pre-approved Jumbo commands for an automated experience.

**Is Jumbo going to hijack my agent?**  

Not at all. Jumbo prescribes an opinionated workflow that you can always bypass. It works alongside your agent to enhance its capabilities.  

**Why not just use markdown files?**  

Jumbo goes beyond static markdown files. It's an immutable event stream—capturing your entire project history, always current and auditable. You stay in your flow, never repeat yourself—only add new information when you need to. Markdown is a snapshot in time, Jumbo is your project's living memory.

**Can I share context across a team?**

Not yet. A teams version is coming soon.

If you're feeling bold, you can try committing `.jumbo/` directory to your repository—not recommended though. Without very tight coordination you're bound to encounter problems. `jumbo` uses Event Sourcing under the hood, working asynchronously will definitely result in out-of-sequence events. 

<!-- **Why not just use comments or docs?**

You can do that, but the amount of context window consumed while your agent crawls your repo for background information leaves little context budget for executing the task precisely. You risk auto-compression and the agent going awry. gure out how to execute a given task, leaves little   They also don't capture vital lessons learned in the context of your 'conversations'  Jumbo is dynamic—it knows what you're working on *right now* and surfaces relevant context automatically. Jumbo let's you focus on what you want to achieve, the background just comes automatically.

---

## License

[AGPL-3.0](LICENSE)

---

<p align="center">
  Built with 🪄 in Copenhagen for devs who are tired of repeating themselves, by devs who are tired of the same.
</p>

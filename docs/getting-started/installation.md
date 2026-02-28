---
title: Installation
description: Install Jumbo globally to use it across all your projects.
sidebar:
  order: 1
---

# Install Jumbo

Install Jumbo globally to use it across all your projects.

---

## Prerequisites

- **Node.js 18.18.0 or higher** — [Download Node.js](https://nodejs.org/)
- **npm** — Included with Node.js

Check your Node.js version:

```bash
node --version
```

---

## Install with npm

```bash
npm install -g jumbo-cli
```

---

## Verify installation

```bash
> jumbo --version
```

Expected output:

```
jumbo-cli/1.0.1
```

You can also run `jumbo` without arguments to see the quick start instructions.

---

### Command not found

If `jumbo` is not recognized after installation:

1. Check that npm's global bin directory is in your PATH
2. Run `npm bin -g` to find the directory
3. Add it to your PATH if missing

---

## Next steps

- [Initialize your first project](quickstart.md)
- [What Jumbo creates](what-jumbo-creates.md) — Understand every file Jumbo adds to your project
- [Understand core concepts](concepts.md)

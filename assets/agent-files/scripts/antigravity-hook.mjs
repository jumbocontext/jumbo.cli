#!/usr/bin/env node

import { spawn } from "node:child_process";

const MANAGED_MARKER = "JUMBO_MANAGED_ANTIGRAVITY_HOOK_RUNNER_V1";
const MAX_INJECTED_MESSAGE_LENGTH = 12_000;

void MANAGED_MARKER;

const mode = process.argv[2] ?? "";
const input = parseJson(await readStdin());

try {
  if (mode === "pre-invocation-bootstrap") {
    await handlePreInvocationBootstrap(input);
  } else {
    writeJson({ injectSteps: [] });
  }
} catch (error) {
  writeJson({
    injectSteps: [
      {
        ephemeralMessage: `Jumbo Antigravity hook failed: ${getErrorMessage(error)}`,
      },
    ],
  });
}

async function handlePreInvocationBootstrap(input) {
  if (input.invocationNum !== 0) {
    writeJson({ injectSteps: [] });
    return;
  }

  const cwd = getWorkspaceCwd(input);
  const result = await runCommand("jumbo", ["session", "start", "--format", "text"], cwd);
  const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();

  if (!output) {
    writeJson({ injectSteps: [] });
    return;
  }

  const prefix = result.exitCode === 0 ? "" : `jumbo session start exited with code ${result.exitCode}.\n\n`;
  writeJson({
    injectSteps: [
      {
        ephemeralMessage: limitTextTail(`${prefix}${output}`, MAX_INJECTED_MESSAGE_LENGTH),
      },
    ],
  });
}

function runCommand(command, args, cwd) {
  return new Promise((resolve) => {
    const isWin = process.platform === "win32";
    let child;
    if (isWin) {
      const commandLine = [command, ...args].map(arg => {
        return /[ \"]/.test(arg) ? `"${arg.replace(/"/g, '\\"')}"` : arg;
      }).join(" ");
      child = spawn(commandLine, [], {
        cwd,
        shell: true,
        stdio: ["ignore", "pipe", "pipe"],
      });
    } else {
      child = spawn(command, args, {
        cwd,
        shell: false,
        stdio: ["ignore", "pipe", "pipe"],
      });
    }

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (chunk) => {
      stdout = limitTextTail(`${stdout}${chunk.toString()}`, MAX_INJECTED_MESSAGE_LENGTH);
    });

    child.stderr?.on("data", (chunk) => {
      stderr = limitTextTail(`${stderr}${chunk.toString()}`, MAX_INJECTED_MESSAGE_LENGTH);
    });

    child.on("close", (code) => {
      resolve({ exitCode: code ?? 1, stdout, stderr });
    });

    child.on("error", (error) => {
      resolve({ exitCode: 1, stdout, stderr: stderr || error.message });
    });
  });
}

function getWorkspaceCwd(input) {
  if (Array.isArray(input.workspacePaths) && typeof input.workspacePaths[0] === "string") {
    return input.workspacePaths[0];
  }

  return process.cwd();
}

function readStdin() {
  return new Promise((resolve) => {
    let input = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (chunk) => {
      input += chunk;
    });
    process.stdin.on("end", () => resolve(input));
  });
}

function parseJson(value) {
  try {
    return value.trim() ? JSON.parse(value) : {};
  } catch {
    return {};
  }
}

function writeJson(value) {
  process.stdout.write(JSON.stringify(value));
}

function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function limitTextTail(value, maxLength) {
  return value.length > maxLength ? value.slice(-maxLength) : value;
}

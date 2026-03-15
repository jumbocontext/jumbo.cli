/**
 * Replaces empty-string telemetry defaults in the compiled output with
 * values from environment variables so the published npm package ships
 * with the PostHog key and host baked in.
 *
 * Runs as a postbuild step: `node build/inject-telemetry-config.mjs`
 *
 * Injection is all-or-nothing: both POSTHOG_API_KEY and POSTHOG_HOST
 * must be set, or neither. Partial configuration fails the build to
 * prevent half-configured releases.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const constantsPath = path.join(
  __dirname,
  "..",
  "dist",
  "infrastructure",
  "telemetry",
  "PostHogTelemetryConstants.js"
);

const apiKey = process.env.POSTHOG_API_KEY || "";
const host = process.env.POSTHOG_HOST || "";

if (!apiKey && !host) {
  console.log(
    "ℹ️  POSTHOG_API_KEY and POSTHOG_HOST not set — skipping telemetry injection."
  );
  process.exit(0);
}

if (!apiKey || !host) {
  console.error(
    "❌ Partial telemetry configuration: both POSTHOG_API_KEY and POSTHOG_HOST must be set, or neither."
  );
  process.exit(1);
}

if (!fs.existsSync(constantsPath)) {
  console.error(
    `❌ Missing ${constantsPath}. Run "npm run build" (tsc) before injecting telemetry config.`
  );
  process.exit(1);
}

let content = fs.readFileSync(constantsPath, "utf-8");

content = content.replace(
  /const POSTHOG_API_KEY = process\.env\.POSTHOG_API_KEY \|\| ""/,
  `const POSTHOG_API_KEY = "${apiKey}"`
);

content = content.replace(
  /const POSTHOG_HOST = process\.env\.POSTHOG_HOST \|\| ""/,
  `const POSTHOG_HOST = "${host}"`
);

fs.writeFileSync(constantsPath, content, "utf-8");

console.log("✅ Telemetry config injected into dist/.");

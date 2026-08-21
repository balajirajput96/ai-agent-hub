import { spawn, spawnSync } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { getMigrationCheckStatus } from "./maintenanceDatabaseCheck.mjs";
import { getSafeRepositoryIdentity } from "./maintenanceIdentity.mjs";

const outputDir = resolve(
  process.env.MAINTENANCE_OUTPUT_DIR ?? "maintenance-output"
);
const checks = [
  [
    "automation-inventory",
    "node",
    ["scripts/validate-automation-inventory.mjs"],
  ],
  ["format", "pnpm", ["exec", "prettier", "--check", "."]],
  ["typecheck", "pnpm", ["check"]],
  ["tests", "pnpm", ["test"]],
  ["build", "pnpm", ["build"]],
  ["audit", "pnpm", ["audit", "--audit-level=high"]],
  ["diff", "git", ["diff", "--check"]],
];

async function execute(name, command, args) {
  const result = await new Promise(resolveResult => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    child.stdout.on("data", chunk => {
      output += chunk;
    });
    child.stderr.on("data", chunk => {
      output += chunk;
    });
    child.on("error", error => {
      resolveResult({ output: `${output}${error.message}\n`, code: 1 });
    });
    child.on("close", code => {
      resolveResult({ output, code: code ?? 1 });
    });
  });

  await writeFile(join(outputDir, `${name}.log`), result.output, "utf8");
  return result.code === 0 ? "passed" : "failed";
}

function readGitValue(args) {
  const result = spawnSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  return result.status === 0 ? result.stdout.trim() || null : null;
}

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

const results = {};
for (const [name, command, args] of checks) {
  results[name] = await execute(name, command, args);
}
results.migration =
  getMigrationCheckStatus(process.env) ??
  (await execute("migration", "pnpm", ["drizzle-kit", "check"]));

const record = {
  schemaVersion: 1,
  timestamp: new Date().toISOString(),
  repository: getSafeRepositoryIdentity(process.env, process.cwd()),
  commit: process.env.GITHUB_SHA ?? readGitValue(["rev-parse", "HEAD"]),
  checks: results,
  secretValuesRecorded: false,
  recovery:
    "No source, credential, or external-account mutation is attempted by this maintenance command.",
};

await writeFile(
  join(outputDir, "maintenance-record.json"),
  `${JSON.stringify(record, null, 2)}\n`,
  "utf8"
);

const failed = Object.values(results).some(status => status === "failed");
process.exitCode = failed ? 1 : 0;

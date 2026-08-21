import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const inventoryPath = resolve(
  process.env.AUTOMATION_INVENTORY_PATH ??
    "automation/historical-automation-inventory.json"
);

const requiredAutomationNames = [
  "CI",
  "CI Health Monitor",
  "Daily Maintenance",
  "Hourly website continuation",
  "Daily GitHub and Drive summary",
];

const requiredCliNames = [
  "git and GitHub CLI",
  "Google Workspace CLI",
  "Gemini CLI",
  "Antigravity CLI",
  "Datadog CLI",
];

function fail(message) {
  console.error(`Automation inventory validation failed: ${message}`);
  process.exitCode = 1;
}

let inventory;
try {
  inventory = JSON.parse(await readFile(inventoryPath, "utf8"));
} catch (error) {
  fail(`could not read valid JSON at ${inventoryPath}: ${error.message}`);
  process.exit();
}

if (inventory.schemaVersion !== 1) {
  fail("schemaVersion must be 1");
}

if (!Number.isFinite(Date.parse(inventory.lastAuditedAt))) {
  fail("lastAuditedAt must be an ISO-compatible timestamp");
}

if (
  typeof inventory.secretPolicy !== "string" ||
  !inventory.secretPolicy.includes("never stores credential values")
) {
  fail("secretPolicy must declare that credential values are never stored");
}

if (
  !Array.isArray(inventory.repositories) ||
  inventory.repositories.length < 2
) {
  fail("at least the managed and GitHub repository records are required");
}

const automationNames = new Set(
  Array.isArray(inventory.automations)
    ? inventory.automations.map(automation => automation.name)
    : []
);
for (const name of requiredAutomationNames) {
  if (!automationNames.has(name)) {
    fail(`missing required automation record: ${name}`);
  }
}

const hourlyContinuation = inventory.automations?.find(
  automation => automation.name === "Hourly website continuation"
);
if (!hourlyContinuation?.trigger?.includes("2,400")) {
  fail("hourly continuation must retain its 2,400-cycle boundary");
}

const cliNames = new Set(
  Array.isArray(inventory.cliReadiness)
    ? inventory.cliReadiness.map(cli => cli.name)
    : []
);
for (const name of requiredCliNames) {
  if (!cliNames.has(name)) {
    fail(`missing required CLI readiness record: ${name}`);
  }
}

if (process.exitCode) {
  process.exit();
}

console.log(
  JSON.stringify(
    {
      status: "passed",
      inventoryPath,
      lastAuditedAt: inventory.lastAuditedAt,
      requiredAutomations: requiredAutomationNames.length,
      requiredCliRecords: requiredCliNames.length,
      secretValuesRecorded: false,
    },
    null,
    2
  )
);

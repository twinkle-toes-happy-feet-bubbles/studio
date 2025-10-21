import { spawnSync } from "node:child_process";

const extraArgs = [];
let cliProjectName;

for (let i = 2; i < process.argv.length; i += 1) {
  const token = process.argv[i];

  if (token === "--project-name" && i + 1 < process.argv.length) {
    cliProjectName = process.argv[i + 1];
    i += 1;
    continue;
  }

  if (token.startsWith("--project-name=")) {
    cliProjectName = token.split("=")[1];
    continue;
  }

  extraArgs.push(token);
}

const projectName =
  cliProjectName ??
  process.env.CF_PAGES_PROJECT_NAME ??
  process.env.CLOUDFLARE_PAGES_PROJECT_NAME ??
  process.env.CLOUDFLARE_PAGES_PROJECT ??
  "dpr-insight";

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
    ...options,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const runWithOutput = (command, args) =>
  spawnSync(command, args, {
    stdio: ["ignore", "pipe", "inherit"],
    env: process.env,
    shell: process.platform === "win32",
    encoding: "utf-8",
  });

console.log(`\n[cf-deploy] Using Cloudflare Pages project: ${projectName}`);

let projectExists = false;

try {
  const listResult = runWithOutput("npx", [
    "wrangler",
    "pages",
    "project",
    "list",
    "--json",
  ]);

  if (listResult.status === 0 && listResult.stdout) {
    const projects = JSON.parse(listResult.stdout);
    projectExists = Array.isArray(projects)
      ? projects.some((proj) => proj.name === projectName || proj.slug === projectName)
      : false;
  }
} catch (error) {
  console.warn("[cf-deploy] Unable to list Pages projects:", error.message ?? error);
}

if (!projectExists) {
  console.log(`\n[cf-deploy] Project '${projectName}' not found. Creating it...`);
  const createResult = spawnSync(
    "npx",
    [
      "wrangler",
      "pages",
      "project",
      "create",
      projectName,
      "--production-branch",
      process.env.CF_PAGES_PRODUCTION_BRANCH ?? "main",
    ],
    {
      stdio: "inherit",
      env: process.env,
      shell: process.platform === "win32",
    },
  );

  if (createResult.status !== 0) {
    console.warn(
      "[cf-deploy] Continuing even though project creation failed. If the project truly does not exist, the deploy step will error with code 8000007.",
    );
  }
}

run("npm", ["run", "cf-build"]);
run("npx", ["wrangler", "pages", "deploy", ".open-next", "--project-name", projectName, ...extraArgs]);

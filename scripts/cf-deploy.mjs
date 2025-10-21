import { spawnSync } from "node:child_process";

const wranglerArgs = [];
let cliProjectName;
let cliBranch;
const positionalArgs = [];

const projectNameTokens = ["--project-name", "--project", "-p"];
const branchTokens = ["--branch", "-b"];

for (let i = 2; i < process.argv.length; i += 1) {
  const token = process.argv[i];

  if (projectNameTokens.includes(token) && i + 1 < process.argv.length) {
    cliProjectName = process.argv[i + 1];
    i += 1;
    continue;
  }

  if (token.startsWith("--project-name=") || token.startsWith("--project=") || token.startsWith("-p=")) {
    cliProjectName = token.split("=")[1];
    continue;
  }

  if (branchTokens.includes(token) && i + 1 < process.argv.length) {
    cliBranch = process.argv[i + 1];
    i += 1;
    continue;
  }

  if (token.startsWith("--branch=") || token.startsWith("-b=")) {
    cliBranch = token.split("=")[1];
    continue;
  }

  if (!token.startsWith("-")) {
    // Collect positional arguments: first is project, second is branch
    positionalArgs.push(token);
    continue;
  }

  wranglerArgs.push(token);
}

// Handle positional arguments: cf-deploy <project> <branch>
if (positionalArgs.length > 0 && !cliProjectName) {
  cliProjectName = positionalArgs[0];
}
if (positionalArgs.length > 1 && !cliBranch) {
  cliBranch = positionalArgs[1];
}

const projectName =
  cliProjectName ??
  process.env.CF_PAGES_PROJECT_NAME ??
  process.env.CLOUDFLARE_PAGES_PROJECT_NAME ??
  process.env.CLOUDFLARE_PAGES_PROJECT ??
  "dpr-insight";

const branchName = cliBranch ?? process.env.CF_PAGES_PRODUCTION_BRANCH ?? "main";

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

console.log(`\n[cf-deploy] Using Cloudflare Pages project: ${projectName}`);

// Skip project creation - it already exists and requires extra API permissions
// The project 'parakh' was already created manually in Cloudflare dashboard
console.log(`[cf-deploy] Assuming project '${projectName}' already exists (skipping creation check).`);

// Build is now done separately in CI with proper env vars, so we skip it here
// run("npm", ["run", "cf-build"]);

console.log(`\n[cf-deploy] Deploying to production branch: ${branchName}`);

const deployArgs = [
  "wrangler",
  "pages",
  "deploy",
  ".open-next",
  "--project-name",
  projectName,
  "--branch",
  branchName,
  ...wranglerArgs,
];

run("npx", deployArgs);

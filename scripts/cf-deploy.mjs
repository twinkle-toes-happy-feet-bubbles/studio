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

const run = (command, args) => {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

console.log(`\n[cf-deploy] Using Cloudflare Pages project: ${projectName}`);

run("npm", ["run", "cf-build"]);
run("npx", ["wrangler", "pages", "deploy", ".open-next", "--project-name", projectName, ...extraArgs]);

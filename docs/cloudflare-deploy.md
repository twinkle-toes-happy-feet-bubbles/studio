# Deploying DPR Insight to Cloudflare Pages

This guide walks through hosting the DPR Insight Next.js app on Cloudflare Pages so you can share it on a `*.pages.dev` (or custom) domain.

## 1. Prerequisites

- Cloudflare account with Pages access.
- NVIDIA API key (required) and optional Tavily API key.
- Node.js 18+ locally for building before deployment.
- GitHub (or GitLab/Bitbucket) repository, or the ability to deploy via `wrangler` CLI.

## 2. Configure Environment Variables

In Cloudflare Pages, open **Settings → Environment Variables** for your project and add:

| Variable | Required | Notes |
| --- | --- | --- |
| `NVIDIA_API_KEY` | ✅ | Paste the same key you use locally. |
| `OPENAI_API_KEY` | ✅ | Required during the OpenNext build step for the NVIDIA SDK shim. |
| `CLOUDFLARE_API_TOKEN` | ✅ | Needed when the build command runs `wrangler pages deploy` inside Cloudflare’s builder. Grant **Cloudflare Pages:Edit** and **Workers Scripts:Read** at the account scope. |
| `TAVILY_API_KEY` | Optional | Needed only if you turned on Tavily search. |

> 💡 If you connect via Git, you can set these before the first build. When using the CLI deploy flow you can pass them with `--env` or set them in the dashboard afterwards.

## 3. Recommended Flow – Git-Connected Deployment

This is the easiest long-term setup: every push to `main` (and pull requests) will trigger a Page build on Cloudflare’s Linux workers, avoiding Windows bundling issues.

1. **Push to Git** – commit your work and push to GitHub/GitLab/Bitbucket. Make sure `.open-next/` and other build folders are ignored (already handled in `.gitignore`).
2. **Connect Cloudflare Pages** – in the dashboard choose **Create a project → Connect to Git** and pick your repo/branch (`main`).
3. **Build settings**:
   - Framework preset: **None** (we let OpenNext craft the worker and assets).
   - Build command: `npm run cf-deploy` (runs the OpenNext build and deploys via Wrangler in one shot).
   - Deploy command: leave blank/disabled—the deploy happens inside the build command.
   - Build output directory: leave empty; Wrangler uploads directly from `.open-next`.
4. **Environment variables** – set `NVIDIA_API_KEY` (and optional `TAVILY_API_KEY`) before the first build so the app can reach NVIDIA during SSR.
5. **Kick off the build** – hit save. Cloudflare compiles the project and deploys a production site. Every subsequent push repeats the flow; PRs get preview URLs automatically.

> `npm run cf-deploy` invokes `open-next build` under the hood. If you need to inspect the bundle separately, run `npm run cf-build` locally to populate `.open-next`.

### Required Cloudflare API token

Because the build command calls `wrangler pages deploy`, the Pages builder must have an API token with the right scopes. Create one from **Profile → API Tokens → Create** using the *Edit Cloudflare Pages* template (or manually grant **Account.Cloudflare Pages → Edit** plus **Account.Workers Scripts → Read**). Add the token value to the project’s environment variables as `CLOUDFLARE_API_TOKEN` for both Production and Preview environments.

## 4. Option B – Manual Deploy with Wrangler

If you prefer manual deploys or want to test before pushing to Git:

```bash
npm install
npm run cf-deploy -- --project-name dpr-insight
```

- `npm run cf-deploy` runs the OpenNext build and uploads the bundle to Pages; pass `--project-name` the first time (or hardcode it in the script). `npm run cf:deploy` remains as a local alias if you prefer the colon style.
- The command expects `CLOUDFLARE_API_TOKEN` to be present in your shell. When running locally you can export it or use `wrangler login` instead of the token.

## 5. Custom Domain (Optional)

1. After a successful deploy you get a `https://<project>.pages.dev` URL.
2. To use your own domain, go to **Custom Domains** in the Pages project.
3. Add the domain or subdomain, then follow Cloudflare’s DNS instructions.

## 6. Notes & Troubleshooting

- **SSR streaming & Edge runtime**: Cloudflare Pages runs on the Edge runtime, which the NVIDIA API client supports. Ensure your environment keys are valid.
- **Cache busting**: The streaming API route (`/api/analyze`) runs using Edge runtime and works without extra config.
- **CI/CD**: Cloudflare Pages automatically builds on each push. You can restrict production deploys to specific branches in project settings.

Once deployed, your app is accessible via the Cloudflare Pages URL—perfect for sharing live demos of the council experience.

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
| `TAVILY_API_KEY` | Optional | Needed only if you turned on Tavily search. |

> 💡 If you connect via Git, you can set these before the first build. When using the CLI deploy flow you can pass them with `--env` or set them in the dashboard afterwards.

## 3. Recommended Flow – Git-Connected Deployment

This is the easiest long-term setup: every push to `main` (and pull requests) will trigger a Page build on Cloudflare’s Linux workers, avoiding Windows bundling issues.

1. **Push to Git** – commit your work and push to GitHub/GitLab/Bitbucket. Make sure `.open-next/` and other build folders are ignored (already handled in `.gitignore`).
2. **Connect Cloudflare Pages** – in the dashboard choose **Create a project → Connect to Git** and pick your repo/branch (`main`).
3. **Build settings**:
   - Framework preset: **Next.js** (should auto-fill).
   - Build command: `npm run build` (Cloudflare’s builder handles the rest and generates the worker automatically).
   - Build output directory: `.vercel/output/static` (autofilled when the preset is set).
4. **Environment variables** – set `NVIDIA_API_KEY` (and optional `TAVILY_API_KEY`) before the first build so the app can reach NVIDIA during SSR.
5. **Kick off the build** – hit save. Cloudflare compiles the project and deploys a production site. Every subsequent push repeats the flow; PRs get preview URLs automatically.

> If Cloudflare ever stops auto-detecting Next.js, switch the build command to `npm run cf:prepare` with output `.open-next`. Their Linux builder runs OpenNext successfully and will generate the worker you need.

## 4. Option B – Manual Deploy with Wrangler

If you prefer manual deploys or want to test before pushing to Git:

```bash
npm install
npm run cf:prepare
npm run cf:deploy -- --project-name dpr-insight
```

- `npm run cf:prepare` builds and bundles the project into `.open-next` via [OpenNext](https://opennext.js.org/cloudflare).
- `npm run cf:deploy` uploads the bundle to Pages; pass `--project-name` the first time (or hardcode it in the script).

## 5. Custom Domain (Optional)

1. After a successful deploy you get a `https://<project>.pages.dev` URL.
2. To use your own domain, go to **Custom Domains** in the Pages project.
3. Add the domain or subdomain, then follow Cloudflare’s DNS instructions.

## 6. Notes & Troubleshooting

- **SSR streaming & Edge runtime**: Cloudflare Pages runs on the Edge runtime, which the NVIDIA API client supports. Ensure your environment keys are valid.
- **Cache busting**: The streaming API route (`/api/analyze`) runs using Edge runtime and works without extra config.
- **CI/CD**: Cloudflare Pages automatically builds on each push. You can restrict production deploys to specific branches in project settings.

Once deployed, your app is accessible via the Cloudflare Pages URL—perfect for sharing live demos of the council experience.

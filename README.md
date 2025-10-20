# Firebase Studio

This project is a Next.js + Firebase Studio starter that now ships with a Kurma-Σ inspired multi-agent council for DPR (Detailed Project Report) analysis.

## Getting Started

```powershell
npm install
npm run dev
```

Open [`http://localhost:3000`](http://localhost:3000) in your browser to use the UI.

### Required environment variables

Create a `.env.local` file and provide the credentials below:

```
# Required for NVIDIA API
NVIDIA_API_KEY=your_nvidia_foundation_models_key
# Optional: override the default model (llama-3.1-70b-instruct)
NVIDIA_MODEL=nvidia/llama-3.1-nemotron-70b-instruct

# Optional: enables `web_search` tool during deliberation
TAVILY_API_KEY=your_tavily_key
```

Restart `npm run dev` after updating secrets.

> **Tip:** If you see `NVIDIA rejected the API key`, double-check that you copied the key exactly from the [NVIDIA AI Foundation Models](https://build.nvidia.com/explore/discover) console, that the selected model is enabled for your org, and that your usage limits allow text generation calls.

## AI Council Flow

The DPR analysis now uses a Kurma-Σ v10.6 inspired council hosted in `src/ai/council/kurmaSigma.ts`.

- **Strategist**: proposes a falsifiable hypothesis grounded in the selected DPR text and user criteria.
- **Skeptic**: stress-tests the hypothesis and surfaces immediate risks.
- **Researcher**: suggests tool calls (`web_search` / `ask_user` / `none`). If a Tavily key is present, real searches are executed.
- **Conductor** & **Judge**: assess progress, set the next action, and deliver a verdict tied to user requirements.
- **Synthesizer**: converts the deliberation into the JSON payload returned by the DPR analysis helper, including risk band, confidence score, and governance guidance.

You can trigger the council by submitting the analysis form on the home page, which calls the `performAnalysis` server action. Each DPR “card” in the UI displays a friendly thumbnail, but the AI now receives the underlying report text from `src/lib/placeholder-images.ts`, so no image data is transmitted to NVIDIA’s endpoints.

## Quality Checks

```powershell
npm run typecheck
npm run lint
```

Lint currently emits a warning about custom fonts coming from the existing layout; no functional issues are introduced by the council update.

import OpenAI from "openai";

const DEFAULT_BASE_URL = process.env.NVIDIA_BASE_URL ?? "https://integrate.api.nvidia.com/v1";

export const DEFAULT_NVIDIA_MODEL =
  process.env.NVIDIA_MODEL ?? "deepseek-ai/deepseek-v3.1-terminus";

export const nvidiaClient = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: DEFAULT_BASE_URL,
});

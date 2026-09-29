// config/aiModels.js

export const AI_PROVIDERS_CONFIG = [
  {
    providerId: "OPENAI",
    displayName: "OpenAI",
    icon: "/icons/openai.svg", // Optional: Add a logo for your UI
    models: [
      { id: "gpt-4o", name: "GPT-4o", description: "Flagship model for complex tasks." },
      { id: "gpt-4o-mini", name: "GPT-4o Mini", description: "Fast and affordable for simple routing." }
    ]
  },
  {
    providerId: "GEMINI",
    displayName: "Google Gemini",
    icon: "/icons/google.svg",
    models: [
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", description: "Advanced reasoning and massive context." },
      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", description: "High-speed and lightweight." },
      { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite", description: " High speed lite version" }
    ]
  },
  {
    providerId: "ANTHROPIC",
    displayName: "Anthropic Claude",
    icon: "/icons/anthropic.svg",
    models: [
      { id: "claude-3-5-sonnet-latest", name: "Claude 3.5 Sonnet", description: "Incredible speed and coding capability." },
      { id: "claude-3-opus-latest", name: "Claude 3 Opus", description: "Maximum intelligence for hard problems." }
    ]
  },
  {
    providerId: "GROQ",
    displayName: "Groq",
    icon: "/icons/groq.svg", // Make sure to add a Groq logo to your public folder!
    models: [
      { id: "openai/gpt-oss-120b", name: "GPT OSS 120B", description: "OpenAI's flagship 120B open-weight model for complex reasoning and tasks." },
      { id: "qwen/qwen3.6-27b", name: "Qwen 3.6 27B", description: "Excellent balance of speed, reasoning, and multimodal vision support." },
      { id: "openai/gpt-oss-20b", name: "GPT OSS 20B", description: "Ultra-fast and lightweight model for simple or repetitive tasks." },
      { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", description: "High-speed mixture of experts model." }
    ]
  }

];
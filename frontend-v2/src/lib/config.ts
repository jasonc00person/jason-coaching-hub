import { StartScreenPrompt } from "@openai/chatkit";

export const THEME_STORAGE_KEY = "jason-coaching-theme";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000/";

export const CHATKIT_API_URL = import.meta.env.VITE_CHATKIT_API_URL ?? `${API_BASE}chatkit`;

/**
 * ChatKit expects a domain key. For development, you'll need to:
 * 1. Deploy your app to a real domain (e.g., your-app.vercel.app)
 * 2. Register that domain at https://platform.openai.com/settings/organization/security/domain-allowlist
 * 3. Replace this placeholder with the real domain key from OpenAI
 */
export const CHATKIT_API_DOMAIN_KEY =
  import.meta.env.VITE_CHATKIT_API_DOMAIN_KEY ?? "domain_pk_68e6f82c9e5081908d9b66e3fccbeed801c44e006ad5d8e7";

// API Endpoints - use full URLs for production
export const CREATE_SESSION_ENDPOINT = `${API_BASE}api/chatkit/session`;
export const FILES_API_URL = `${API_BASE}api/files`;
export const FILE_UPLOAD_URL = `${API_BASE}api/files/upload`;

export const GREETING =
  import.meta.env.VITE_GREETING ??
  "Hey! I'm Jason's AI coach. I have access to all of Jason's proven templates, frameworks, and strategies. Ask me about hooks, scripts, offers, or growth strategy!";

export const STARTER_PROMPTS: StartScreenPrompt[] = [
  {
    label: "Hook Templates",
    prompt: "Show me some of your best hook templates",
    icon: "sparkle",
  },
  {
    label: "Content Strategy",
    prompt: "Help me create a 30-day content plan for TikTok",
    icon: "calendar",
  },
  {
    label: "ICP Framework",
    prompt: "Walk me through your ICP framework",
    icon: "profile-card",
  },
  {
    label: "Script Templates",
    prompt: "Give me a YouTube script template",
    icon: "write",
  },
];

export const COMPOSER_PLACEHOLDER =
  import.meta.env.VITE_COMPOSER_PLACEHOLDER ??
  "Ask me about hooks, scripts, offers, or growth strategy...";

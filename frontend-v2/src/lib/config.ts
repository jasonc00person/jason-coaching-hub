import { StartScreenPrompt } from "@openai/chatkit";

export const THEME_STORAGE_KEY = "jason-coaching-theme";

// Use Railway for backend API
const API_BASE = import.meta.env.VITE_API_BASE ?? (
  import.meta.env.DEV ? "http://localhost:8000/" : "https://jason-coaching-backend-production.up.railway.app/"
);

export const CHATKIT_API_URL = import.meta.env.VITE_CHATKIT_API_URL ?? `${API_BASE}chatkit`;

/**
 * ChatKit expects a domain key. For development, you'll need to:
 * 1. Deploy your app to a real domain (e.g., your-app.vercel.app)
 * 2. Register that domain at https://platform.openai.com/settings/organization/security/domain-allowlist
 * 3. Replace this placeholder with the real domain key from OpenAI
 */
export const CHATKIT_API_DOMAIN_KEY =
  import.meta.env.VITE_CHATKIT_API_DOMAIN_KEY ?? "domain_pk_68e6f82c9e5081908d9b66e3fccbeed801c44e006ad5d8e7";

// API Endpoints - use Railway backend
export const CREATE_SESSION_ENDPOINT = `${API_BASE}api/chatkit/session`;
export const FILES_API_URL = `${API_BASE}api/files`;
export const FILE_UPLOAD_URL = `${API_BASE}api/files/upload`;

export const GREETING =
  import.meta.env.VITE_GREETING ??
  "What can I help you create today?";

export const STARTER_PROMPTS: StartScreenPrompt[] = [
  {
    label: "Hook Templates",
    prompt: "Show me your best hook templates",
    icon: "sparkle",
  },
  {
    label: "Content Strategy",
    prompt: "Help me create a 30-day content plan",
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
  "What do you want to know?";

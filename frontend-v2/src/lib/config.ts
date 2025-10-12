import { StartScreenPrompt } from "@openai/chatkit";

export const THEME_STORAGE_KEY = "jason-coaching-theme";

// Backend API - automatically uses correct environment
// Production (main branch): uses VITE_API_BASE or production Railway URL
// Staging (dev branch): uses VITE_API_BASE_1 (Preview env) or VITE_API_BASE
// Development (local): uses localhost
const API_BASE = 
  import.meta.env.VITE_API_BASE_1 ?? // Check Preview env variable first
  import.meta.env.VITE_API_BASE ?? // Then Production env variable
  (import.meta.env.DEV 
    ? "http://localhost:8000/" 
    : "https://jason-coaching-backend-production.up.railway.app/"
  );

console.log("=== CONFIG.TS LOADED ===");
console.log("import.meta.env:", import.meta.env);
console.log("VITE_API_BASE_1 (Preview):", import.meta.env.VITE_API_BASE_1);
console.log("VITE_API_BASE (Production):", import.meta.env.VITE_API_BASE);
console.log("VITE_CHATKIT_API_DOMAIN_KEY:", import.meta.env.VITE_CHATKIT_API_DOMAIN_KEY);
console.log("Computed API_BASE:", API_BASE);

export const CHATKIT_API_URL = import.meta.env.VITE_CHATKIT_API_URL ?? `${API_BASE}chatkit`;

/**
 * ChatKit expects a domain key. For development, you'll need to:
 * 1. Deploy your app to a real domain (e.g., your-app.vercel.app)
 * 2. Register that domain at https://platform.openai.com/settings/organization/security/domain-allowlist
 * 3. Replace this placeholder with the real domain key from OpenAI
 */
export const CHATKIT_API_DOMAIN_KEY =
  import.meta.env.VITE_CHATKIT_API_DOMAIN_KEY ?? "domain_pk_68e6f82c9e5081908d9b66e3fccbeed801c44e006ad5d8e7";

console.log("CHATKIT_API_DOMAIN_KEY:", CHATKIT_API_DOMAIN_KEY);
console.log("CHATKIT_API_URL:", CHATKIT_API_URL);

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

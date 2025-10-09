/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;
  readonly VITE_CHATKIT_API_URL?: string;
  readonly VITE_CHATKIT_API_DOMAIN_KEY?: string;
  readonly VITE_GREETING?: string;
  readonly VITE_COMPOSER_PLACEHOLDER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

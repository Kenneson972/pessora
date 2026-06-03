/// <reference types="vite/client" />

declare module '@heroui-pro/react';

interface ImportMetaEnv {
  readonly VITE_PESSOBOT_WEBHOOK_URL?: string;
  readonly VITE_PESSOBOT_SIGNATURE?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/// <reference types="vite/client" />

// The app's build settings (Vite exposes only VITE_… ones to the code).
interface ImportMetaEnv {
  /** The contact address the privacy policy gives (F-031); set on Render, not in the repository. */
  readonly VITE_CONTACT_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

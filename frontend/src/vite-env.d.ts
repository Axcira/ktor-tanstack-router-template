/// <reference types="vite/client" />

type BuildVersion = {
  commit: string;
  commitShort: string;
  builtAt: string;
  dirty: boolean;
};

declare const __APP_VERSION__: BuildVersion;

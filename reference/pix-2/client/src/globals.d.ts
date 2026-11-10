interface ImportMeta {
  glob<T = unknown>(pattern: string, options?: { eager?: boolean; import?: string; query?: string }): Record<string, T>;
}

declare module "*.css";
declare module "*.webp";
declare module "*.jpg";
declare module "*.png";
declare module "*.mp3";
declare module "*.zip";

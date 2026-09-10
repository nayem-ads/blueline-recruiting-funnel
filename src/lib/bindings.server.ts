// Server-only access to this app's bindings.
// Works seamlessly in Cloudflare Workers (workerd), Bun, Node.js, and Railway.
import type {
  D1Database,
  DurableObjectNamespace,
  KVNamespace,
  R2Bucket,
} from "@cloudflare/workers-types";

type AppEnv = {
  DB?: D1Database;
  STORAGE?: R2Bucket;
  KV?: KVNamespace;
  CONTAINER?: DurableObjectNamespace;
  HF_ENV?: string;
  APP_SLUG?: string;
};

export function bindings(): AppEnv {
  try {
    if (typeof globalThis !== "undefined" && (globalThis as unknown as { __CF_ENV__?: AppEnv }).__CF_ENV__) {
      return (globalThis as unknown as { __CF_ENV__: AppEnv }).__CF_ENV__;
    }
  } catch {
    // ignore
  }

  if (typeof process !== "undefined" && process.env) {
    return (process.env as unknown as AppEnv) || {};
  }

  return {};
}

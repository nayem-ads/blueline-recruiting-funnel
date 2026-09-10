import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import {
  higgsfieldDesignInspectorVitePlugin,
  higgsfieldDesignSourceBabelPlugin,
} from "./src/module/design-inspector/vite";
import svgr from "vite-plugin-svgr";
import { defaultServerConditions, defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const QUANTA_ICONS_SHIM = fileURLToPath(
  new URL("./src/lib/quanta-icons.ts", import.meta.url),
);
const CLOUDFLARE_SHIM = fileURLToPath(
  new URL("./src/lib/cloudflare-shim.ts", import.meta.url),
);

export default defineConfig(({ command, mode }) => {
  const designInspectorEnabled = process.env.HF_DESIGN_INSPECTOR === "1" || mode === "design";
  const isCfWorker = process.env.CF_WORKER === "1";

  return {
    server: {
      watch: { usePolling: true, interval: 150 },
      allowedHosts: true,
    },
    preview: {
      allowedHosts: true,
    },
    resolve: {
      tsconfigPaths: true,
      alias: [
        { find: /^@higgsfield-ai\/icons(\/.*)?$/, replacement: QUANTA_ICONS_SHIM },
        { find: /^cloudflare:workers$/, replacement: CLOUDFLARE_SHIM },
      ],
    },
    ssr: {
      ...(command === "build" && isCfWorker
        ? {
            target: "webworker" as const,
            resolve: {
              conditions: [
                "workerd",
                "worker",
                "browser",
                ...defaultServerConditions.filter((c) => c !== "node"),
              ],
            },
          }
        : {}),
      noExternal: command === "build" ? true : undefined,
      external: isCfWorker ? ["cloudflare:workers"] : [],
    },
    build: {
      rollupOptions: {
        external: isCfWorker ? [/^cloudflare:/] : [],
      },
    },
    plugins: [
      svgr({
        svgrOptions: {
          icon: true,
          svgProps: { fill: "currentColor" },
          svgoConfig: {
            plugins: [{ name: "preset-default", params: { overrides: { removeViewBox: false } } }],
          },
        },
      }),
      tanstackStart({
        server: { entry: "server" },
      }),
      higgsfieldDesignInspectorVitePlugin(designInspectorEnabled),
      react({
        babel: {
          plugins: designInspectorEnabled ? [higgsfieldDesignSourceBabelPlugin] : [],
        },
      }),
      tailwindcss(),
    ],
  };
});

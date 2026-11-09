import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// audit PLT-04: heavy vendors get their own long-lived chunks, loaded only by the pages that use
// them (every route is React.lazy). Rollup pulls a manual chunk's unassigned dependencies into it,
// which would drag shared code (react, CJS helpers) into e.g. vendor-pdf and make the entry import
// it. To avoid that, anything the entry reaches through static imports is pinned to `vendor-core`.
const HEAVY_VENDORS: Array<[RegExp, string]> = [
  [/\/node_modules\/mapbox-gl\//, "vendor-mapbox"],
  [/\/node_modules\/(recharts|recharts-scale|victory-vendor|d3-[^/]+)\//, "vendor-charts"],
  [/\/node_modules\/(jspdf|html2canvas|canvg|fflate)\//, "vendor-pdf"],
  [/\/node_modules\/@stripe\//, "vendor-stripe"],
];

type ModuleInfoLookup = (id: string) => { isEntry: boolean; importers: readonly string[] } | null;
const staticFromEntryCache = new Map<string, boolean>();

function isStaticallyReachableFromEntry(id: string, getModuleInfo: ModuleInfoLookup): boolean {
  const cached = staticFromEntryCache.get(id);
  if (cached !== undefined) return cached;
  const seen = new Set<string>([id]);
  const queue = [id];
  let found = false;
  while (queue.length && !found) {
    const info = getModuleInfo(queue.shift() as string);
    if (!info) continue;
    if (info.isEntry) found = true;
    for (const importer of info.importers) {
      if (!seen.has(importer)) {
        seen.add(importer);
        queue.push(importer);
      }
    }
  }
  staticFromEntryCache.set(id, found);
  return found;
}

function vendorChunks(id: string, { getModuleInfo }: { getModuleInfo: ModuleInfoLookup }): string | undefined {
  const isVendor = id.includes("node_modules") || id.startsWith("\0");
  if (!isVendor) return undefined;
  if (isStaticallyReachableFromEntry(id, getModuleInfo)) return "vendor-core";
  return HEAVY_VENDORS.find(([pattern]) => pattern.test(id))?.[1];
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: vendorChunks,
      },
    },
  },
  // audit SEC-17: remove console.log/info/debug do bundle de produção (mantém warn/error)
  esbuild: mode === "production"
    ? { pure: ["console.log", "console.info", "console.debug"] }
    : undefined,
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/__tests__/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
}));

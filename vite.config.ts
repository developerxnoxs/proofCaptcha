import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from 'url';
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    manifest: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('@radix-ui')) return 'radix-ui';
            if (id.includes('react-hook-form') || id.includes('@hookform')) return 'form-libs';
            if (id.includes('@tanstack/react-query')) return 'react-query';
            if (id.includes('framer-motion')) return 'framer-motion';
            if (id.includes('recharts')) return 'recharts';
            return 'vendor';
          }
          if (id.includes('client/src/components/ui')) return 'ui-components';
          if (id.includes('client/src/components')) return 'components';
          if (id.includes('client/src/pages')) return 'pages';
          if (id.includes('client/src/lib')) return 'lib';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: false,
    fs: {
      strict: true,
      allow: [
        path.resolve(__dirname),
        path.resolve(__dirname, 'client'),
        path.resolve(__dirname, 'shared'),
        path.resolve(__dirname, 'attached_assets'),
      ],
      deny: ["**/.*", "**/node_modules/**"],
    },
  },
  optimizeDeps: {
    exclude: ['@replit/vite-plugin-cartographer', '@replit/vite-plugin-dev-banner'],
  },
});

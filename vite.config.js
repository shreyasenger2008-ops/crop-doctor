import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.svg",
        "model/model.json",
        "model/class_indices.json",
        "model/group1-shard1of4.bin",
        "model/group1-shard2of4.bin",
        "model/group1-shard3of4.bin",
        "model/group1-shard4of4.bin",
      ],
      manifest: {
        name: "Crop Doctor AI",
        short_name: "CropDoc",
        description: "Offline-capable plant disease detection using AI",
        start_url: "/",
        display: "standalone",
        background_color: "#f0fdf4",
        theme_color: "#15803d",
        icons: [
          {
            src: "icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        // Cache model files (large binary assets)
        runtimeCaching: [
          {
            urlPattern: /\/model\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "model-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
        // Increase max file size limit so the model shards (4 MB each) are precached
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
      },
    }),
  ],
  // Ensure TF.js WASM backend files can be resolved (fallback, not primary)
  optimizeDeps: {
    exclude: ["@tensorflow/tfjs"],
  },
});

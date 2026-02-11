import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/employee": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/mark": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/product": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/sector": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/model": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/test": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/enum": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/descolagem": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/msc": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});

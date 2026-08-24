import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import http from "http";

export default defineConfig({
  plugins: [react()],

  server: {
    host: "127.0.0.1",
    port: 5173,

    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
        agent: new http.Agent({
          family: 4,
        }),
      },
    },
  },
});







// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";
// import http from "http";
// export default defineConfig({
//   plugins: [react()],
//   server: {
//     host: "127.0.0.1",
//     port: 5173,
//     proxy: {
//       "/api": {
//         target: "http://127.0.0.1:8000",
        
//         changeOrigin: true,
//         rewrite: (path) => path.replace(/^\\/api/, ""),
//         agent: new http.Agent({
//           family: 4,
//         }),
//       },
//     },
//   },
// });
// target: "http://localhost:8000"
// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";
// import http from "node:http";

// export default defineConfig({
//   plugins: [react()],

//   server: {
//     host: "127.0.0.1",
//     port: 5173,

//     proxy: {
//       "/api": {
//         target: "http://127.0.0.1:8000",
//         changeOrigin: true,
//         rewrite: (path) => path.replace(/^\/api/, ""),

//         agent: new http.Agent({
//           family: 4,
//         }),
//       },
//     },
//   },
// });
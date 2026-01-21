import path from "path"
import fs from "fs"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv, Plugin } from "vite"
import wasm from "vite-plugin-wasm"

// Middleware to serve local textures from filesystem
const localTextureMiddleware = (): Plugin => ({
  name: 'local-texture-middleware',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url?.startsWith('/local-textures/')) {
        const texturePath = req.url.replace('/local-textures/', '');
        const fsPath = path.join(
          '/Users/ishan-aiworkspace/Documents/Daga PDF All Design Assets/TexturesForViz2D/Texture File',
          texturePath
        );

        if (fs.existsSync(fsPath)) {
          res.setHeader('Content-Type', 'image/jpeg');
          res.setHeader('Cache-Control', 'public, max-age=31536000');
          fs.createReadStream(fsPath).pipe(res);
          return;
        }
      }
      next();
    });
  }
});

export default defineConfig(({ mode }) => {
  // Load env variables based on mode (development/production)
  const env = loadEnv(mode, process.cwd(), "")

  return {
    plugins: [react(), wasm(), localTextureMiddleware()],
    server: {
      fs: {
        // Allow serving files from project root, Downloads, and texture directory
        allow: [
          process.cwd(), // Project root
          '/Users/ishan-aiworkspace/Downloads', // External directory
          '/Users/ishan-aiworkspace/Documents/Daga PDF All Design Assets/TexturesForViz2D' // Texture files
        ]
      }
    },
    esbuild:{
      supported:{
        'top-level-await':true
      }
    },
    define: {
      "import.meta.env.VITE_API_URL": JSON.stringify(env.API_URL),
      "import.meta.env.VITE_WEBSITE_URL": JSON.stringify(env.WEBSITE_URL),
      "import.meta.env.VITE_GOOGLE_MAPS_API_KEY": JSON.stringify(env.GOOGLE_MAPS_API_KEY),
      "import.meta.env.VITE_MINIO_PUBLIC_URL": JSON.stringify(env.MINIO_PUBLIC_URL),
      "import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID": JSON.stringify(env.GOOGLE_OAUTH_CLIENT_ID),
      "import.meta.env.VITE_GIPHY_API_KEY": JSON.stringify(env.GIPHY_API_KEY),
      "import.meta.env.VITE_VIZ2D_API_URL": JSON.stringify(env.VITE_VIZ2D_API_URL),
      "import.meta.env.VITE_VIZ2D_VISUALIZER_ID": JSON.stringify(env.VITE_VIZ2D_VISUALIZER_ID),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src")
      },
    },
  }
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Ensure the dist directory exists during build
const ensureDirectoryExistence = (filePath) => {
  const dirname = path.dirname(filePath)
  if (fs.existsSync(dirname)) {
    return true
  }
  ensureDirectoryExistence(dirname)
  fs.mkdirSync(dirname)
}

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
      react(),
      {
        name: 'spa-fallback',
        closeBundle() {
          // Create _redirects file for Render/Netlify
          const redirectsPath = path.resolve(__dirname, 'dist', '_redirects')
          ensureDirectoryExistence(redirectsPath)
          fs.writeFileSync(redirectsPath, '/* /index.html 200')
          
          // Create netlify.toml for additional hosting support
          const netlifyPath = path.resolve(__dirname, 'dist', 'netlify.toml')
          ensureDirectoryExistence(netlifyPath)
          fs.writeFileSync(netlifyPath, `[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200`)
        }
      }
    ],
    server: { 
        port: 5176,
        historyApiFallback: true 
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: undefined
            }
        }
    }
})
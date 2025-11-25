import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Custom plugin to remove development-only scripts (like CDNs) during the build process
const removeDevScripts = (): Plugin => {
  return {
    name: 'remove-dev-scripts',
    apply: 'build', // Only run this transformation during the 'build' command
    transformIndexHtml(html) {
      // Regex to remove everything between <!-- DEV_ONLY_START --> and <!-- DEV_ONLY_END -->
      return html.replace(/<!-- DEV_ONLY_START -->[\s\S]*?<!-- DEV_ONLY_END -->/g, '');
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), removeDevScripts()],
  base: './', // Use relative paths for easier GitHub Pages deployment
})
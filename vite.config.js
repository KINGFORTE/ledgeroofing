import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      ignored: ['**/DumpStack.log.tmp', 'C:\\DumpStack.log.tmp'],
    },
  },
  assetsInclude: [/\.(jpe?g|png|gif|webp|avif|mp4|mov|m4v|webm)$/i],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react',
              test: /node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//,
            },
            {
              name: 'motion',
              test: /node_modules\/(framer-motion|motion-dom|motion-utils|motion)\//,
            },
            {
              name: 'swiper',
              test: /node_modules\/swiper\//,
            },
            {
              name: 'ui',
              test: /node_modules\/(lucide-react)\//,
            },
          ],
        },
      },
    },
  },
})

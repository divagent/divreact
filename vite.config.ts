import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Browser hits /yahoo/... -> proxied to Yahoo Finance server-side (avoids CORS).
      // For production, point /yahoo at a backend/serverless proxy instead.
      '/yahoo': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        },
        rewrite: (path) => path.replace(/^\/yahoo/, ''),
      },
    },
  },
})

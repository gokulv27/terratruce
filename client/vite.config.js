import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/perplexity': {
          target: 'https://api.perplexity.ai',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/perplexity/, '/chat/completions'),
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              // Add the API key from environment
              const apiKey = env.VITE_PERPLEXITY_API_KEY;
              if (apiKey) {
                proxyReq.setHeader('Authorization', `Bearer ${apiKey}`);
              }
            });
          }
        }
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Separate React and core libraries
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            // Separate charting library (Recharts is the largest)
            'vendor-charts': ['recharts'],
            // Separate Lucide icons
            'vendor-icons': ['lucide-react'],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
  }
})

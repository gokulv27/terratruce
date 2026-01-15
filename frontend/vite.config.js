import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  /* eslint-disable no-undef */
  const env = loadEnv(mode, process.cwd(), '');
  console.log('🔑 VITE CONFIG LOADED');
  console.log('🔑 API KEY PRESENT:', !!env.VITE_PERPLEXITY_API_KEY);
  if (env.VITE_PERPLEXITY_API_KEY) {
    console.log('🔑 KEY START:', env.VITE_PERPLEXITY_API_KEY.substring(0, 5) + '...');
  } else {
    console.error('❌ API KEY MISSING IN CONFIG');
  }

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
      },
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
  };
});

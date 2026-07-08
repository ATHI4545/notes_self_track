import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      proxy: {
        // Used by Roadmap.jsx in both dev and prod (Vercel function in prod)
        '/api/nvidia-proxy': {
          target: 'https://integrate.api.nvidia.com/v1',
          changeOrigin: true,
          rewrite: () => '/chat/completions',
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              const apiKey = env.VITE_NVIDIA_API_KEY || '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';
              proxyReq.setHeader('Authorization', `Bearer ${apiKey}`);
            });
          },
        },
        // Legacy proxy (kept for compatibility)
        '/nvidia-api': {
          target: 'https://integrate.api.nvidia.com/v1',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/nvidia-api/, ''),
        },
      },
    },
    // proxy removed — now using alfa-leetcode-api (CORS-friendly public REST API)
    build: {
      chunkSizeWarningLimit: 600,
      rolldownOptions: {
        output: {
          // rolldown requires manualChunks as a function (not an object)
          manualChunks(id) {
            if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/') || id.includes('node_modules/react-router')) {
              return 'vendor-react';
            }
            if (id.includes('node_modules/firebase/firestore') || id.includes('node_modules/@firebase/firestore')) {
              return 'vendor-firestore';
            }
            if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
              return 'vendor-firebase';
            }
            if (id.includes('node_modules/framer-motion') || id.includes('node_modules/react-icons')) {
              return 'vendor-ui';
            }
            if (id.includes('node_modules/chart.js') || id.includes('node_modules/react-chartjs-2')) {
              return 'vendor-charts';
            }
            if (
              id.includes('node_modules/react-calendar') ||
              id.includes('node_modules/react-toastify') ||
              id.includes('node_modules/react-circular-progressbar') ||
              id.includes('node_modules/@hello-pangea') ||
              id.includes('node_modules/date-fns')
            ) {
              return 'vendor-misc';
            }
          },
        },
      },
    },
  }
})

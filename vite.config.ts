import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { handleAiWordUsageRequest } from './server/aiWordUsageHandler';

function aiApiPlugin(): Plugin {
  return {
    name: 'ai-word-usage-api',
    configureServer(server) {
      server.middlewares.use('/api/ai/word-usage', async (req, res) => {
        if (req.method === 'POST') {
          await handleAiWordUsageRequest(req, res);
        } else {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'METHOD_NOT_ALLOWED' }));
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), aiApiPlugin()],
  server: {
    port: 3000,
    open: false,
    watch: {
      // Large reference datasets / generated reports are not app source.
      // Watching them crashed the dev server on Windows (EBUSY while downloading).
      ignored: ['**/data/hanzi-source/**', '**/reports/**', '**/scratch/**', '**/dist/**'],
    },
  },
});

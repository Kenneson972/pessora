import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'
import compression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    compression({ algorithm: 'brotliCompress', ext: '.br' }),
    compression({ algorithm: 'gzip', ext: '.gz' }),
    visualizer({
      open: false,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    rollupOptions: {
      // 2 entrées = 2 bundles distincts (site public / admin), servis chacun
      // sur son domaine (pessora.fr / admin.pessora.fr) — voir vercel.json
      // et docs/admin-separe-conception.md. Le split par entrée + le lazy
      // loading des routes suffisent : aucune route /admin/* n'est incluse
      // dans le bundle public, et inversement.
      input: {
        main: 'index.html',
        admin: 'admin.html',
      },
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-motion': ['framer-motion'],
          'vendor-ui': ['lucide-react', '@heroui/react'],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
    minify: 'esbuild',
    sourcemap: false,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 600,
  },
  server: {
    port: 3000,
    open: true,
  },
})

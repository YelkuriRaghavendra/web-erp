import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React ecosystem
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // State management and data fetching
          'state-vendor': [
            'zustand',
            'immer',
            '@tanstack/react-query',
            '@tanstack/react-query-devtools',
          ],
          // UI components and icons
          'ui-vendor': [
            'lucide-react',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-popover',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-switch',
            '@radix-ui/react-accordion',
            '@radix-ui/react-label',
            '@radix-ui/react-slot',
          ],
          // Forms and validation
          'forms-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          // Internationalization
          'i18n-vendor': [
            'i18next',
            'i18next-browser-languagedetector',
            'react-i18next',
          ],
          // Utilities
          'utils-vendor': [
            'crypto-js',
            'date-fns',
            'clsx',
            'tailwind-merge',
            'class-variance-authority',
            'tailwindcss-animate',
            'next-themes',
            'sonner',
            'react-day-picker',
          ],
        },
      },
    },
    chunkSizeWarningLimit: 500, // Increase warning limit to 500kb
  },
  server: {
    host: true,
    port: 3000,
    strictPort: true,
    cors: {
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    },
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'andinolabs.com',
      'www.andinolabs.com',
    ],
  },
});

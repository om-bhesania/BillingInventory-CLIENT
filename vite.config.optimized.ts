import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from 'rollup-plugin-visualizer';
import { compression } from 'vite-plugin-compression2';

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  const isProduction = mode === 'production';
  const isDevelopment = mode === 'development';

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react({
        // Enable SWC optimizations
        jsxImportSource: '@emotion/react',
        plugins: [
          // Add SWC plugins for better optimization
          ['@swc/plugin-emotion', {}],
        ],
      }),
      isDevelopment && componentTagger(),
      
      // Bundle analyzer for production builds
      isProduction && visualizer({
        filename: 'dist/bundle-analysis.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
      }),
      
      // Compression plugin for production
      isProduction && compression({
        algorithm: 'gzip',
        exclude: [/\.(br)$/, /\.(gz)$/],
      }),
      
      isProduction && compression({
        algorithm: 'brotliCompress',
        exclude: [/\.(br)$/, /\.(gz)$/],
      }),
    ].filter(Boolean),
    
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    
    build: {
      // Target modern browsers for better optimization
      target: 'es2020',
      
      // Enable minification
      minify: 'terser',
      
      // Terser options for better compression
      terserOptions: {
        compress: {
          drop_console: isProduction,
          drop_debugger: isProduction,
          pure_funcs: isProduction ? ['console.log', 'console.info'] : [],
        },
        mangle: {
          safari10: true,
        },
      },
      
      // Rollup options for bundle optimization
      rollupOptions: {
        output: {
          // Manual chunk splitting for better caching
          manualChunks: {
            // Vendor chunks
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-select',
              '@radix-ui/react-toast',
              '@radix-ui/react-tooltip',
              '@radix-ui/react-tabs',
              '@radix-ui/react-slot',
              '@radix-ui/react-separator',
              '@radix-ui/react-sheet',
              '@radix-ui/react-scroll-area',
              '@radix-ui/react-progress',
              '@radix-ui/react-popover',
              '@radix-ui/react-label',
              '@radix-ui/react-input',
              '@radix-ui/react-checkbox',
              '@radix-ui/react-avatar',
              '@radix-ui/react-alert-dialog',
              '@radix-ui/react-accordion',
            ],
            'chart-vendor': ['chart.js', 'recharts', 'tremor'],
            'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod', 'yup'],
            'table-vendor': ['@tanstack/react-table', 'material-react-table'],
            'animation-vendor': ['framer-motion'],
            'utils-vendor': ['lodash', 'date-fns', 'clsx', 'class-variance-authority'],
            'query-vendor': ['@tanstack/react-query'],
            'icons-vendor': ['lucide-react'],
          },
          
          // Optimize chunk file names
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId
              ? chunkInfo.facadeModuleId.split('/').pop().replace('.tsx', '').replace('.ts', '')
              : 'chunk';
            return `js/${facadeModuleId}-[hash].js`;
          },
          
          // Optimize asset file names
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
              return `images/[name]-[hash].${ext}`;
            }
            if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
              return `fonts/[name]-[hash].${ext}`;
            }
            return `assets/[name]-[hash].${ext}`;
          },
          
          // Entry file names
          entryFileNames: 'js/[name]-[hash].js',
        },
        
        // External dependencies (if using CDN)
        external: [],
        
        // Tree shaking optimization
        treeshake: {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
          unknownGlobalSideEffects: false,
        },
      },
      
      // Chunk size warnings
      chunkSizeWarningLimit: 1000,
      
      // Source map configuration
      sourcemap: isDevelopment,
      
      // CSS code splitting
      cssCodeSplit: true,
      
      // Asset inlining threshold
      assetsInlineLimit: 4096,
    },
    
    // CSS optimization
    css: {
      devSourcemap: isDevelopment,
      postcss: {
        plugins: [
          // Add PostCSS plugins for CSS optimization
          require('autoprefixer'),
          isProduction && require('cssnano')({
            preset: ['default', {
              discardComments: { removeAll: true },
              normalizeWhitespace: true,
              colormin: true,
              minifyFontValues: true,
              minifySelectors: true,
            }],
          }),
        ].filter(Boolean),
      },
    },
    
    // Dependency optimization
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@tanstack/react-query',
        'framer-motion',
        'lucide-react',
        'chart.js',
        'recharts',
        'lodash',
        'date-fns',
        'clsx',
        'class-variance-authority',
      ],
      exclude: [
        // Exclude heavy dependencies that are not needed immediately
      ],
    },
    
    // Define environment variables
    define: {
      __DEV__: isDevelopment,
      __PROD__: isProduction,
    },
    
    // Experimental features
    experimental: {
      renderBuiltUrl(filename, { hostType }) {
        if (hostType === 'js') {
          return { js: `/${filename}` };
        } else {
          return { relative: true };
        }
      },
    },
  };
});

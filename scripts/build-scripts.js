import { build } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// NOTE: API keys must never be baked into the public build.
// They are entered by the user in the extension Settings page.
const defines = {};

async function buildExtensionScripts() {
  console.log('Building background service worker...');
  await build({
    configFile: false,
    define: defines,
    resolve: {
      alias: {
        '@': path.resolve(root, 'src'),
      },
    },
    build: {
      outDir: path.resolve(root, 'dist'),
      emptyOutDir: false,
      lib: {
        entry: path.resolve(root, 'src/background/service-worker.ts'),
        name: 'ServiceWorker',
        formats: ['es'],
        fileName: () => 'service-worker.js',
      },
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
        },
      },
    },
  });

  console.log('Building content script (IIFE format)...');
  await build({
    configFile: false,
    define: defines,
    resolve: {
      alias: {
        '@': path.resolve(root, 'src'),
      },
    },
    build: {
      outDir: path.resolve(root, 'dist'),
      emptyOutDir: false,
      lib: {
        entry: path.resolve(root, 'src/content/content-script.ts'),
        name: 'IdiotSummaryContent',
        formats: ['iife'],
        fileName: () => 'content.js',
      },
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
        },
      },
    },
  });

  console.log('Building offscreen PDF worker...');
  await build({
    configFile: false,
    define: defines,
    resolve: {
      alias: {
        '@': path.resolve(root, 'src'),
      },
    },
    build: {
      outDir: path.resolve(root, 'dist'),
      emptyOutDir: false,
      lib: {
        entry: path.resolve(root, 'src/offscreen/pdf-offscreen.ts'),
        name: 'PdfOffscreen',
        formats: ['es'],
        fileName: () => 'pdf-offscreen.js',
      },
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
        },
      },
    },
  });

  console.log('Copying pdf.js worker into dist/vendor ...');
  const vendorDir = path.resolve(root, 'dist/vendor');
  fs.mkdirSync(vendorDir, { recursive: true });
  fs.copyFileSync(
    path.resolve(root, 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs'),
    path.resolve(vendorDir, 'pdf.worker.min.mjs')
  );

  console.log('Copying offscreen.html into dist ...');
  fs.copyFileSync(path.resolve(root, 'offscreen.html'), path.resolve(root, 'dist/offscreen.html'));

  console.log('All extension scripts built successfully.');
}

buildExtensionScripts().catch((err) => {
  console.error('Failed to build extension scripts:', err);
  process.exit(1);
});

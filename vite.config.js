import { defineConfig } from 'vite';

export default defineConfig({
  // Preserve previously generated files as well as the original project.
  build: { emptyOutDir: false },
});

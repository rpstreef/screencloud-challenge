import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths'; // Import the plugin

export default defineConfig({
  plugins: [
    tsconfigPaths()
  ],
  test: {
    // Optional: Add any other Vitest configurations here
    // e.g., environment: 'node', globals: true
    globals: true, // Optional: If you prefer global APIs like describe, it, etc.
    environment: 'node', // Usually needed for backend tests
  },
}); 
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [tailwindcss()],
	resolve: {
		tsconfigPaths: true
	},
	test: {
		environment: 'jsdom',
		setupFiles: ['./app/test/setup.ts'],
		include: ['app/**/*.test.{ts,tsx}'],
		globals: true,
		css: false
	}
});

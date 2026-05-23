import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

vi.stubEnv('VITE_PUBLIC_API_BASE_URL', 'http://localhost:5000');

function createLocalStorageMock() {
	const store = new Map<string, string>();
	return {
		get length() {
			return store.size;
		},
		clear() {
			store.clear();
		},
		getItem(key: string) {
			return store.get(key) ?? null;
		},
		setItem(key: string, value: string) {
			store.set(key, String(value));
		},
		removeItem(key: string) {
			store.delete(key);
		},
		key(index: number) {
			return [...store.keys()][index] ?? null;
		}
	};
}

Object.defineProperty(window, 'localStorage', {
	value: createLocalStorageMock(),
	writable: true
});

vi.mock('~/lib/api.client', () => ({
	default: {
		useQuery: vi.fn(),
		useMutation: vi.fn()
	}
}));

vi.mock('sonner', () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn()
	}
}));

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
	window.localStorage.clear();
});

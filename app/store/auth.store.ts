import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type UserRole = 'Admin' | 'Employee' | 'Client' | string;

export type AuthUser = {
	userId: string | null;
	email: string | null;
	roles: UserRole[];
	exp: number | null;
	rawClaims: Record<string, unknown>;
};

function decodeBase64UrlToString(input: string): string {
	const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
	const pad = base64.length % 4;
	const padded = pad ? base64 + '='.repeat(4 - pad) : base64;

	// Browser
	if (typeof globalThis.atob === 'function') {
		return globalThis.atob(padded);
	}

	// Node (SSR)
	return Buffer.from(padded, 'base64').toString('utf-8');
}

function parseJwtPayload(token: string): Record<string, unknown> | null {
	const parts = token.split('.');
	if (parts.length < 2) return null;
	try {
		const json = decodeBase64UrlToString(parts[1]!);
		const data = JSON.parse(json) as unknown;
		if (!data || typeof data !== 'object') return null;
		return data as Record<string, unknown>;
	} catch {
		return null;
	}
}

function toStringOrNull(v: unknown): string | null {
	return typeof v === 'string' && v.trim() ? v : null;
}

function toNumberOrNull(v: unknown): number | null {
	if (typeof v === 'number' && Number.isFinite(v)) return v;
	if (typeof v === 'string' && v.trim() && Number.isFinite(Number(v))) return Number(v);
	return null;
}

export function parseAuthUserFromAccessToken(
	accessToken: string | null
): AuthUser | null {
	if (!accessToken) return null;
	const payload = parseJwtPayload(accessToken);
	if (!payload) return null;

	const roleClaim =
		payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
	const rolesRaw = Array.isArray(roleClaim)
		? roleClaim
		: roleClaim == null
			? []
			: [roleClaim];
	const roles = rolesRaw
		.map((r) => (typeof r === 'string' ? (r as UserRole) : null))
		.filter((r): r is UserRole => Boolean(r));

	return {
		userId:
			toStringOrNull(
				payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
			) ?? toStringOrNull(payload.sub),
		email: toStringOrNull(payload.email),
		roles,
		exp: toNumberOrNull(payload.exp),
		rawClaims: payload
	};
}

type AuthState = {
	accessToken: string | null;
	refreshToken: string | null;
	user: AuthUser | null;
	setTokens: (tokens: {
		accessToken: string;
		refreshToken?: string | null;
	}) => void;
	clearTokens: () => void;
	hasRole: (role: UserRole) => boolean;
	isAdmin: () => boolean;
	isEmployee: () => boolean;
};

const storage =
	typeof window === 'undefined'
		? undefined
		: createJSONStorage(() => window.localStorage);

export const useAuthStore = create<AuthState>()(
	persist(
		(set, get) => ({
			accessToken: null,
			refreshToken: null,
			user: null,
			setTokens: ({ accessToken, refreshToken }) =>
				set({
					accessToken,
					refreshToken: refreshToken ?? null,
					user: parseAuthUserFromAccessToken(accessToken)
				}),
			clearTokens: () =>
				set({ accessToken: null, refreshToken: null, user: null }),
			hasRole: (role) => get().user?.roles?.includes(role) ?? false,
			isAdmin: () => get().hasRole('Admin'),
			isEmployee: () => get().hasRole('Employee')
		}),
		{
			name: 'auth',
			storage,
			partialize: (store) => ({
				accessToken: store.accessToken,
				refreshToken: store.refreshToken
			}),
			onRehydrateStorage: () => (state) => {
				if (!state) return;
				state.user = parseAuthUserFromAccessToken(state.accessToken);
			}
		}
	)
);

export function getAccessToken(): string | null {
	return useAuthStore.getState().accessToken;
}

export function getRefreshToken(): string | null {
	return useAuthStore.getState().refreshToken;
}

export function setTokens(tokens: {
	accessToken: string;
	refreshToken?: string | null;
}) {
	return useAuthStore.getState().setTokens(tokens);
}

export function clearTokens() {
	return useAuthStore.getState().clearTokens();
}

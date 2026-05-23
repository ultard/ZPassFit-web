import type { Mock } from 'vitest';
import { vi } from 'vitest';

import $api from '~/lib/api.client';

export const mockUseQuery = vi.mocked($api.useQuery) as Mock;
export const mockUseMutation = vi.mocked($api.useMutation) as Mock;

export function mockQueryResult(
	overrides: Partial<{
		data: unknown;
		isPending: boolean;
		error: unknown;
	}>
) {
	return {
		data: undefined,
		isPending: false,
		error: null,
		...overrides
	};
}

export function mockMutationResult(
	overrides: Partial<{
		mutate: Mock;
		isPending: boolean;
		data: unknown;
	}>
) {
	return {
		mutate: vi.fn(),
		isPending: false,
		data: undefined,
		...overrides
	};
}

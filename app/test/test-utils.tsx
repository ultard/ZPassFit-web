import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter, type MemoryRouterProps } from 'react-router';

type Options = Omit<RenderOptions, 'wrapper'> & {
	route?: string;
	routerProps?: MemoryRouterProps;
};

export function renderWithProviders(
	ui: ReactElement,
	{ route = '/', routerProps, ...options }: Options = {}
) {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false }
		}
	});

	function Wrapper({ children }: { children: ReactNode }) {
		return (
			<QueryClientProvider client={queryClient}>
				<MemoryRouter initialEntries={[route]} {...routerProps}>
					{children}
				</MemoryRouter>
			</QueryClientProvider>
		);
	}

	return render(ui, { wrapper: Wrapper, ...options });
}

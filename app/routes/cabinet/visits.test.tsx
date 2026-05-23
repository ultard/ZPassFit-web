import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { mockQueryResult, mockUseQuery } from '~/test/mock-api';
import { renderWithProviders } from '~/test/test-utils';

import CabinetVisitsRoute from './visits';

describe('CabinetVisitsRoute', () => {
	beforeEach(() => {
		mockUseQuery.mockImplementation((_method, path) => {
			if (path === '/attendance/visits/history') {
				return mockQueryResult({ data: [], isPending: false });
			}
			return mockQueryResult({});
		});
	});

	it('отображает заголовок истории посещений', () => {
		renderWithProviders(<CabinetVisitsRoute />);
		expect(screen.getByText('История посещений')).toBeInTheDocument();
	});

	it('показывает пустое состояние', () => {
		renderWithProviders(<CabinetVisitsRoute />);
		expect(screen.getByText('Пока нет посещений')).toBeInTheDocument();
	});

	it('отображает запись посещения с датой выхода', () => {
		mockUseQuery.mockImplementation((_method, path) => {
			if (path === '/attendance/visits/history') {
				return mockQueryResult({
					data: [
						{
							id: 42,
							enterDate: '2025-06-01T08:00:00.000Z',
							leaveDate: '2025-06-01T10:00:00.000Z'
						}
					]
				});
			}
			return mockQueryResult({});
		});

		renderWithProviders(<CabinetVisitsRoute />);

		expect(screen.getByText(/Выход:/)).toBeInTheDocument();
		expect(screen.getByText('#42')).toBeInTheDocument();
	});
});

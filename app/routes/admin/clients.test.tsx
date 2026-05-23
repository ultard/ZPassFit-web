import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { mockQueryResult, mockUseQuery } from '~/test/mock-api';
import { renderWithProviders } from '~/test/test-utils';

import AdminClientsRoute from './clients';

describe('AdminClientsRoute', () => {
	beforeEach(() => {
		mockUseQuery.mockImplementation((_method, path) => {
			if (path === '/dashboard/clients') {
				return mockQueryResult({ data: { items: [] }, isPending: false });
			}
			return mockQueryResult({});
		});
	});

	it('отображает поле поиска клиентов', () => {
		renderWithProviders(<AdminClientsRoute />);

		expect(screen.getByText('Клиенты')).toBeInTheDocument();
		expect(screen.getByLabelText('Поиск')).toBeInTheDocument();
		expect(
			screen.getByPlaceholderText('ФИО, телефон или email')
		).toBeInTheDocument();
	});

	it('показывает сообщение при пустом результате поиска', () => {
		renderWithProviders(<AdminClientsRoute />);
		expect(screen.getByText('Ничего не найдено')).toBeInTheDocument();
	});

	it('отображает карточку клиента и ссылку «Открыть»', () => {
		mockUseQuery.mockImplementation((_method, path) => {
			if (path === '/dashboard/clients') {
				return mockQueryResult({
					data: {
						items: [
							{
								id: 'c1',
								lastName: 'Петров',
								firstName: 'Пётр',
								middleName: 'Петрович',
								email: 'petrov@dev.local',
								phone: '+79990001122',
								status: 'Active'
							}
						]
					}
				});
			}
			return mockQueryResult({});
		});

		renderWithProviders(<AdminClientsRoute />);

		expect(screen.getByText('Петров Пётр Петрович')).toBeInTheDocument();
		expect(screen.getByText(/petrov@dev\.local/)).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Открыть' })).toHaveAttribute(
			'href',
			'/admin/clients/c1'
		);
	});

	it('обновляет строку поиска при вводе', async () => {
		const user = userEvent.setup();
		renderWithProviders(<AdminClientsRoute />);

		const search = screen.getByLabelText('Поиск');
		await user.type(search, 'petrov');

		expect(search).toHaveValue('petrov');
	});
});

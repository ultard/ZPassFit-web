import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { PaymentMethod, PaymentStatus } from '~/lib/api.types';
import { mockQueryResult, mockUseQuery } from '~/test/mock-api';
import { renderWithProviders } from '~/test/test-utils';

import CabinetPaymentsRoute from './payments';

describe('CabinetPaymentsRoute', () => {
	beforeEach(() => {
		mockUseQuery.mockImplementation((_method, path) => {
			if (path === '/client/payments') {
				return mockQueryResult({ data: [], isPending: false });
			}
			return mockQueryResult({});
		});
	});

	it('отображает заголовок страницы', () => {
		renderWithProviders(<CabinetPaymentsRoute />);
		expect(screen.getByText('Платежи')).toBeInTheDocument();
	});

	it('показывает индикатор загрузки', () => {
		mockUseQuery.mockImplementation((_method, path) => {
			if (path === '/client/payments') {
				return mockQueryResult({ isPending: true });
			}
			return mockQueryResult({});
		});

		renderWithProviders(<CabinetPaymentsRoute />);
		expect(screen.getByText('Загрузка…')).toBeInTheDocument();
	});

	it('показывает пустое состояние без платежей', () => {
		renderWithProviders(<CabinetPaymentsRoute />);
		expect(screen.getByText('Платежей пока нет')).toBeInTheDocument();
	});

	it('отображает список платежей с методом оплаты', () => {
		mockUseQuery.mockImplementation((_method, path) => {
			if (path === '/client/payments') {
				return mockQueryResult({
					data: [
						{
							id: 1,
							amount: 1500,
							paymentDate: '2025-06-01T10:00:00.000Z',
							method: PaymentMethod.Balance,
							status: PaymentStatus.Completed
						}
					]
				});
			}
			return mockQueryResult({});
		});

		renderWithProviders(<CabinetPaymentsRoute />);

		expect(screen.getByText('1500')).toBeInTheDocument();
		expect(screen.getByText('Баланс')).toBeInTheDocument();
	});
});

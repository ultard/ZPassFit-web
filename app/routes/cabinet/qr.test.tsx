import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockMutationResult, mockUseMutation } from '~/test/mock-api';
import { renderWithProviders } from '~/test/test-utils';

import CabinetQrRoute from './qr';

describe('CabinetQrRoute', () => {
	const mutate = vi.fn();

	beforeEach(() => {
		mutate.mockReset();
		mockUseMutation.mockReturnValue(mockMutationResult({ mutate }));
	});

	it('показывает подсказку до генерации QR', () => {
		renderWithProviders(<CabinetQrRoute />);

		expect(screen.getByText('QR для входа')).toBeInTheDocument();
		expect(
			screen.getByText('Нажмите «Сгенерировать» и покажите QR на ресепшене.')
		).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Сгенерировать' })).toBeInTheDocument();
	});

	it('вызывает создание QR-сессии по кнопке', async () => {
		const user = userEvent.setup();
		renderWithProviders(<CabinetQrRoute />);

		await user.click(screen.getByRole('button', { name: 'Сгенерировать' }));

		expect(mutate).toHaveBeenCalledWith({});
	});

	it('отображает токен и QR после успешной генерации', () => {
		const token = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
		const expireDate = new Date(Date.now() + 60_000).toISOString();

		mockUseMutation.mockReturnValue(
			mockMutationResult({
				mutate,
				data: { token, expireDate }
			})
		);

		renderWithProviders(<CabinetQrRoute />);

		expect(screen.getByText(token)).toBeInTheDocument();
		expect(
			screen.getByRole('button', { name: 'Сгенерировать заново' })
		).toBeInTheDocument();
		expect(screen.getByText(/Действует ещё:/)).toBeInTheDocument();
	});
});

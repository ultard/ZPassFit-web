import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockMutationResult, mockUseMutation } from '~/test/mock-api';
import { renderWithProviders } from '~/test/test-utils';

import RegisterRoute from './register';

describe('RegisterRoute', () => {
	const mutate = vi.fn();

	beforeEach(() => {
		mutate.mockReset();
		mockUseMutation.mockReturnValue(mockMutationResult({ mutate }));
	});

	it('отображает все обязательные поля регистрации', () => {
		renderWithProviders(<RegisterRoute />);

		expect(screen.getByText('Регистрация')).toBeInTheDocument();
		expect(screen.getByLabelText('Фамилия')).toBeInTheDocument();
		expect(screen.getByLabelText('Имя')).toBeInTheDocument();
		expect(screen.getByLabelText('Отчество')).toBeInTheDocument();
		expect(screen.getByLabelText('Телефон')).toBeInTheDocument();
		expect(screen.getByLabelText('Email')).toBeInTheDocument();
		expect(screen.getByLabelText('Пароль')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Войти' })).toHaveAttribute(
			'href',
			'/auth/login'
		);
	});

	it('отправляет данные клиента при сабмите', async () => {
		const user = userEvent.setup();
		renderWithProviders(<RegisterRoute />);

		await user.type(screen.getByLabelText('Фамилия'), 'Иванов');
		await user.type(screen.getByLabelText('Имя'), 'Иван');
		await user.type(screen.getByLabelText('Отчество'), 'Иванович');
		await user.type(screen.getByLabelText('Телефон'), '+79991234567');
		await user.type(screen.getByLabelText('Email'), 'new@e2e.local');
		await user.type(screen.getByLabelText('Пароль'), 'DevPassword123!');
		await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }));

		expect(mutate).toHaveBeenCalledOnce();
		const body = mutate.mock.calls[0]?.[0]?.body;
		expect(body).toMatchObject({
			lastName: 'Иванов',
			firstName: 'Иван',
			middleName: 'Иванович',
			phone: '+79991234567',
			email: 'new@e2e.local',
			password: 'DevPassword123!',
			gender: 0
		});
	});

	it('показывает ошибки валидации с сервера', () => {
		let onError: ((err: unknown) => void) | undefined;

		mockUseMutation.mockImplementation((_method, _path, options) => {
			onError = options?.onError;
			return mockMutationResult({ mutate });
		});

		renderWithProviders(<RegisterRoute />);

		act(() => {
			onError?.([{ description: 'Email уже занят' }]);
		});

		expect(screen.getByText('Ошибки')).toBeInTheDocument();
		expect(screen.getByText('Email уже занят')).toBeInTheDocument();
	});
});

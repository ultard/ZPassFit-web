import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clearTokens } from '~/store/auth.store';
import { mockMutationResult, mockUseMutation } from '~/test/mock-api';
import { renderWithProviders } from '~/test/test-utils';

import LoginRoute from './login';

const navigate = vi.fn();

vi.mock('react-router', async () => {
	const actual = await vi.importActual<typeof import('react-router')>(
		'react-router'
	);
	return {
		...actual,
		useNavigate: () => navigate
	};
});

describe('LoginRoute', () => {
	const mutate = vi.fn();

	beforeEach(() => {
		clearTokens();
		navigate.mockReset();
		mutate.mockReset();
		mockUseMutation.mockReturnValue(mockMutationResult({ mutate }));
	});

	it('отображает форму входа и ссылку на регистрацию', () => {
		renderWithProviders(<LoginRoute />);

		expect(screen.getByText('Вход')).toBeInTheDocument();
		expect(screen.getByLabelText('Email')).toBeInTheDocument();
		expect(screen.getByLabelText('Пароль')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Войти' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Зарегистрироваться' })).toHaveAttribute(
			'href',
			'/auth/register'
		);
	});

	it('отправляет email и пароль при сабмите формы', async () => {
		const user = userEvent.setup();
		renderWithProviders(<LoginRoute />);

		await user.type(screen.getByLabelText('Email'), 'client@dev.local');
		await user.type(screen.getByLabelText('Пароль'), 'DevPassword123!');
		await user.click(screen.getByRole('button', { name: 'Войти' }));

		expect(mutate).toHaveBeenCalledWith({
			body: { email: 'client@dev.local', password: 'DevPassword123!' }
		});
	});

	it('показывает состояние загрузки во время запроса', () => {
		mockUseMutation.mockReturnValue(
			mockMutationResult({ mutate, isPending: true })
		);

		renderWithProviders(<LoginRoute />);

		expect(screen.getByRole('button', { name: 'Входим…' })).toBeDisabled();
	});

	it('перенаправляет клиента в кабинет после успешного входа', async () => {
		let onSuccess: ((data: unknown) => void) | undefined;

		mockUseMutation.mockImplementation((_method, _path, options) => {
			onSuccess = options?.onSuccess;
			return mockMutationResult({ mutate });
		});

		renderWithProviders(<LoginRoute />);

		onSuccess?.({
			accessToken:
				'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJjQGRldi5sb2NhbCIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkNsaWVudCIsImV4cCI6OTk5OTk5OTk5OX0.sig',
			refreshToken: 'refresh'
		});

		await waitFor(() => {
			expect(navigate).toHaveBeenCalledWith('/cabinet', { replace: true });
		});
	});
});

import { expect, test } from '@playwright/test';

import {
	ADMIN_EMAIL,
	CLIENT_EMAIL,
	login,
	logout
} from './fixtures/auth';

test.describe('Авторизация', () => {
	test('Вход в личный кабинет', async ({ page }) => {
		await login(page, CLIENT_EMAIL);

		await page.goto('/cabinet/settings');
		await logout(page);
		await expect(page).toHaveURL(/\/auth\/login/);
	});

	test('Вход в админ-панель', async ({ page }) => {
		await login(page, ADMIN_EMAIL);

		await logout(page);
		await expect(page).toHaveURL(/\/auth\/login/);
	});
});

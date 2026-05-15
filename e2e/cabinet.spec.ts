import { expect, test } from '@playwright/test';

import { CLIENT_EMAIL, login } from './fixtures/auth';

test.describe('Личный кабинет', () => {
	test.beforeEach(async ({ page }) => {
		await login(page, CLIENT_EMAIL);
	});

	test('Переходы по страницам', async ({ page }) => {
		await page.getByRole('link', { name: 'QR' }).click();
		await expect(page.getByText('QR для входа')).toBeVisible();

		await page.getByRole('link', { name: 'Абонемент' }).click();
		await expect(page).toHaveURL(/\/cabinet\/membership/);
		await expect(
			page.getByText('Текущий абонемент')
		).toBeVisible();

		await page.getByRole('link', { name: 'Обзор' }).click();
		await expect(page).toHaveURL(/\/cabinet/);
		await expect(page.getByText('Ваш уровень лояльности')).toBeVisible();
	});
});

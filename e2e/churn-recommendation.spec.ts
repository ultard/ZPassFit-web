import { expect, test } from '@playwright/test';

import { ADMIN_EMAIL, login } from './fixtures/auth';

test.describe('Прогноз оттока', () => {
	test('Запрос прогноза оттока для клиента', async ({ page }) => {
		await login(page, ADMIN_EMAIL);
		await page.goto('/admin/clients');

		await page.locator('#q').fill('client3@dev.local');
		await expect(page.getByText('client3@dev.local')).toBeVisible();

		await page.getByRole('link', { name: 'Открыть' }).first().click();
		await expect(page).toHaveURL(/\/admin\/clients\//);

		await page.getByRole('button', { name: 'Прогноз оттока' }).click();
		await expect(page.getByText(/Вероятность оттока:/)).toBeVisible();
	});
});

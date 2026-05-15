import { expect, test } from '@playwright/test';

import { ADMIN_EMAIL, CLIENT_EMAIL, login } from './fixtures/auth';

const UUID_REGEX =
	/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

test.describe('Регистрация посещения', () => {
	test('Вход по QR-токену', async ({ browser }) => {
		const clientContext = await browser.newContext();
		const adminContext = await browser.newContext();

		const clientPage = await clientContext.newPage();
		const adminPage = await adminContext.newPage();

		await login(clientPage, CLIENT_EMAIL);
		await clientPage.goto('/cabinet/qr');
		await clientPage.getByRole('button', { name: 'Сгенерировать' }).click();
		await expect(clientPage.locator('svg')).toBeVisible();

		const tokenText = await clientPage
			.locator('.break-all')
			.filter({ hasText: UUID_REGEX })
			.textContent();
		const match = tokenText?.match(UUID_REGEX);
		expect(match).toBeTruthy();
		const token = match![0];

		await login(adminPage, ADMIN_EMAIL);
		await adminPage.goto('/admin/scan');
		await adminPage.locator('#token').fill(token);
		await adminPage.getByRole('button', { name: 'Проверить токен' }).click();

		await expect(adminPage.getByText('Результат')).toBeVisible();
		await expect(adminPage.getByText('Вход:')).toBeVisible();
		await expect(adminPage.getByText('Клиент:')).toBeVisible();

		await clientContext.close();
		await adminContext.close();
	});
});

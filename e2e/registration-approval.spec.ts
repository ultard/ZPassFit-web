import { expect, test } from '@playwright/test';

import { ADMIN_EMAIL, DEV_PASSWORD, login, logout } from './fixtures/auth';

test.describe('Регистрация клиента', () => {
	test('Подтверждение администратором', async ({ page }) => {
		const unique = Date.now();
		const client = {
			lastName: 'Тестов',
			firstName: 'Клиент',
			middleName: 'Автотестович',
			birthDate: '1999-01-01',
			gender: '1',
			phone: `+7999${String(unique).slice(-7)}`,
			email: `client-${unique}@e2e.local`,
			password: DEV_PASSWORD
		};

		await page.goto('/auth/register');

		await page.locator('#lastName').fill(client.lastName);
		await page.locator('#firstName').fill(client.firstName);
		await page.locator('#middleName').fill(client.middleName);
		await page.locator('#birthDate').fill(client.birthDate);
		await page.locator('#gender').selectOption(client.gender);
		await page.locator('#phone').fill(client.phone);
		await page.locator('#email').fill(client.email);
		await page.locator('#password').fill(client.password);

		await page.getByRole('button', { name: 'Зарегистрироваться' }).click();

		await expect(page).toHaveURL(/\/auth\/login/);
		await login(page, ADMIN_EMAIL);

		await page.goto('/admin/clients');
		await page.locator('#q').fill(client.email);

		await expect(page.getByText(client.email)).toBeVisible();
		await page.getByRole('link', { name: 'Открыть' }).first().click();

		await expect(page).toHaveURL(/\/admin\/clients\//);
		await expect(page.getByText(client.email)).toBeVisible();

		const approveButton = page.getByRole('button', { name: 'Подтвердить' });
		await expect(approveButton).toBeVisible();

		await approveButton.click();
		await expect(approveButton).toBeHidden();

		await logout(page);

		await page.locator('#email').fill(client.email);
		await page.locator('#password').fill(client.password);
		await page.getByRole('button', { name: 'Войти' }).click();

		await expect(page).toHaveURL(/\/cabinet/);
		await expect(page.getByText('Ваш уровень лояльности')).toBeVisible();
	});
});

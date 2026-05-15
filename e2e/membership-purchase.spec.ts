import { expect, test } from '@playwright/test';

import { CLIENT_EMAIL, login } from './fixtures/auth';

test.describe('Покупка абонемента', () => {
	test('Покупка абонемента с баланса', async ({ page }) => {
		await login(page, CLIENT_EMAIL);
		await page.goto('/cabinet/membership');

		await expect(
			page.getByText('Купить абонемент')
		).toBeVisible();

		const firstPlan = page
			.locator('button')
			.filter({ has: page.locator('.font-medium') })
			.first();
		await firstPlan.click();

		const balanceOption = page
			.locator('label')
			.filter({ hasText: /Баланс/i });
		await expect(balanceOption).toBeVisible();
		await balanceOption.click();

		await page.getByRole('button', { name: 'Оформить абонемент' }).click();

		await expect(page.getByText('Абонемент активирован')).toBeVisible();
	});
});

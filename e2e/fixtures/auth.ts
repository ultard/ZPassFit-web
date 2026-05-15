import type { Page } from '@playwright/test';

export const DEV_PASSWORD = 'DevPassword123!';
export const CLIENT_EMAIL = 'client@dev.local';
export const ADMIN_EMAIL = 'admin@dev.local';

export async function login(
	page: Page,
	email: string,
	password = DEV_PASSWORD
) {
	await page.goto('/auth/login');
	await page.locator('#email').fill(email);
	await page.locator('#password').fill(password);
	await page.getByRole('button', { name: 'Войти' }).click();
	await page.waitForURL(email === ADMIN_EMAIL ? /\/admin/ : /\/cabinet/);
}

export async function logout(page: Page) {
	const logoutButton = page.getByRole('button', { name: 'Выйти' });
	await logoutButton.click();
	await page.waitForURL('**/auth/login');
}

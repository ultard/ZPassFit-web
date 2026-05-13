/**
 * Цена тарифа в системе указывается за минимальный срок из списка `durations`.
 * Для остальных длительностей стоимость пересчитывается пропорционально.
 */
export function computeMembershipPrice(
	price: number,
	durations: readonly number[],
	durationDays: number
): number {
	if (!Number.isFinite(price) || price <= 0) return 0;
	if (!Number.isFinite(durationDays) || durationDays <= 0) return price;

	const validDurations = durations
		.map((d) => Number(d))
		.filter((d) => Number.isFinite(d) && d > 0);

	if (!validDurations.length) return price;

	const minDuration = Math.min(...validDurations);
	if (minDuration <= 0) return price;

	return Math.round((price * durationDays) / minDuration);
}

/** Цена за минимальный срок (т.е. базовая цена тарифа). */
export function getBasePrice(price: number): number {
	return Number.isFinite(price) && price > 0 ? price : 0;
}

/** Наименьший допустимый срок (или 0, если сроки не заданы). */
export function getMinDuration(durations: readonly number[]): number {
	const valid = durations
		.map((d) => Number(d))
		.filter((d) => Number.isFinite(d) && d > 0);
	return valid.length ? Math.min(...valid) : 0;
}

export function formatRubles(amount: number): string {
	return `${Number(amount).toLocaleString('ru-RU')} ₽`;
}

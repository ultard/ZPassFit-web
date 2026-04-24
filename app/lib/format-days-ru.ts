/** Склонение «N дней» по правилам русского языка (целая часть дней). */
export function formatDaysCountRussian(dayCount: number): string {
	const n = Math.floor(dayCount);
	const lastTwoDigits = Math.abs(n) % 100;
	const lastDigit = lastTwoDigits % 10;
	if (lastTwoDigits > 10 && lastTwoDigits < 20) return `${n} дней`;
	if (lastDigit === 1) return `${n} день`;
	if (lastDigit >= 2 && lastDigit <= 4) return `${n} дня`;
	return `${n} дней`;
}

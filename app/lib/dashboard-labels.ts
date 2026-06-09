function num(v: number | string | null | undefined) {
	if (v == null) return 0;
	return typeof v === 'string' ? Number(v) : v;
}

const LEGACY_UNIT_LABELS: Record<string, string> = {
	visits: '',
	currency: '₽',
	count: ''
};

export function formatDashboardKpiAmount(
	metricId: string | undefined,
	value: number | string | null | undefined
) {
	const n = num(value);
	const formatted = Number.isFinite(n)
		? n.toLocaleString('ru-RU')
		: String(value ?? '—');

	if (metricId === 'revenue') return `${formatted} ₽`;
	return formatted;
}

export function formatDashboardKpiUnit(unit: string | undefined) {
	if (!unit) return '';
	return LEGACY_UNIT_LABELS[unit] ?? unit;
}

export function formatDashboardKpiValue(
	metricId: string | undefined,
	value: number | string | null | undefined,
	unit: string | undefined
) {
	const legacyUnit = formatDashboardKpiUnit(unit);
	if (legacyUnit === '₽' && metricId !== 'revenue') {
		return `${formatDashboardKpiAmount(undefined, value)} ₽`;
	}
	if (metricId === 'revenue' || legacyUnit === '₽') {
		return formatDashboardKpiAmount('revenue', value);
	}
	const amount = formatDashboardKpiAmount(metricId, value);
	return legacyUnit ? `${amount} ${legacyUnit}`.trim() : amount;
}

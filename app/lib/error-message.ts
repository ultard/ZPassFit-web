export function getErrorMessage(error: unknown, fallback = 'Ошибка') {
	if (!error || typeof error !== 'object') return fallback;

	const e = error as {
		detail?: string | null;
		title?: string | null;
		message?: string | null;
	};

	return e.detail ?? e.title ?? e.message ?? fallback;
}

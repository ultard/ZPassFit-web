const ACTION_LABELS: Record<string, string> = {
	Insert: 'Создание',
	Update: 'Изменение',
	Delete: 'Удаление',
	Unknown: 'Неизвестно'
};

const ENTITY_LABELS: Record<string, string> = {
	Client: 'Клиент',
	ApplicationUser: 'Пользователь',
	VisitLog: 'Посещение',
	Payment: 'Платёж',
	Membership: 'Абонемент',
	MembershipPlan: 'Тариф',
	MembershipPricing: 'Цена тарифа',
	Level: 'Уровень',
	ClientLevel: 'Уровень клиента',
	BonusTransaction: 'Бонусная операция',
	Employee: 'Сотрудник',
	QrSession: 'QR-сессия'
};

export const ACTION_FILTER_OPTIONS = [
	{ value: '', label: 'Все действия' },
	{ value: 'Insert', label: 'Создание' },
	{ value: 'Update', label: 'Изменение' },
	{ value: 'Delete', label: 'Удаление' }
] as const;

export const ENTITY_FILTER_OPTIONS = [
	{ value: '', label: 'Все объекты' },
	{ value: 'Client', label: 'Клиент' },
	{ value: 'ApplicationUser', label: 'Пользователь' },
	{ value: 'VisitLog', label: 'Посещение' },
	{ value: 'Payment', label: 'Платёж' },
	{ value: 'Membership', label: 'Абонемент' },
	{ value: 'MembershipPlan', label: 'Тариф' },
	{ value: 'Level', label: 'Уровень' },
	{ value: 'BonusTransaction', label: 'Бонусы' },
	{ value: 'Employee', label: 'Сотрудник' },
	{ value: 'QrSession', label: 'QR-сессия' }
] as const;

export function shortEntityType(full: string) {
	const dot = full.lastIndexOf('.');
	return dot >= 0 ? full.slice(dot + 1) : full;
}

export function entityTypeLabel(entityType: string) {
	const short = shortEntityType(entityType);
	return ENTITY_LABELS[short] ?? short;
}

export function actionLabel(action: string) {
	return ACTION_LABELS[action] ?? action;
}

export function actionBadgeVariant(
	action: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
	switch (action) {
		case 'Insert':
			return 'default';
		case 'Update':
			return 'secondary';
		case 'Delete':
			return 'destructive';
		default:
			return 'outline';
	}
}

export function formatAuditDetails(details: string | null | undefined) {
	if (!details?.trim()) return null;

	try {
		const parsed = JSON.parse(details) as unknown;
		return JSON.stringify(parsed, null, 2);
	} catch {
		return details;
	}
}

import { PaymentMethod } from '~/lib/api.types';

export function paymentMethodLabel(method: number): string {
	switch (method) {
		case PaymentMethod.Cash:
			return 'Наличные';
		case PaymentMethod.Card:
			return 'Карта';
		case PaymentMethod.Balance:
			return 'Баланс';
		case PaymentMethod.YooKassa:
			return 'ЮKassa';
		default:
			return `Способ ${method}`;
	}
}

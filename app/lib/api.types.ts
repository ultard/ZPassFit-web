export enum ClientGender {
	Male,
	Female,
	Unknown
}

export enum ClientStatus {
	Pending,
	Active,
	Blocked
}

export function clientStatusLabel(status: ClientStatus | number | string) {
	const value = typeof status === 'string' ? Number(status) : status;
	switch (value) {
		case ClientStatus.Pending:
			return 'Ожидает подтверждения';
		case ClientStatus.Active:
			return 'Активен';
		case ClientStatus.Blocked:
			return 'Заблокирован';
		default:
			return String(status);
	}
}

export enum BonusTransactionType {
	Accrual,
	Redeem,
	Expire,
	Adjust
}

export enum MembershipStatus {
	Active,
	Frozen,
	Expired,
	Disabled
}

export enum PaymentStatus {
	Pending,
	Completed,
	Cancelled
}

export enum PaymentMethod {
	Cash,
	Card,
	Balance,
	YooKassa
}

export type IdentityError = {
	code?: string;
	description?: string;
};

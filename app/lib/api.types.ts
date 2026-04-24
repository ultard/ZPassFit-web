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
	Card
}

export type IdentityError = {
	code?: string;
	description?: string;
};

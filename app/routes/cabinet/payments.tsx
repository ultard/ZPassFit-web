import $api from '~/lib/api.client';
import { PaymentStatus } from '~/lib/api.types';
import { getErrorMessage } from '~/lib/error-message';
import { paymentMethodLabel } from '~/lib/payment-method-label';

import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';

export default function CabinetPaymentsRoute() {
	const payments = $api.useQuery('get', '/client/payments');

	return (
		<Card>
			<CardHeader>
				<CardTitle>Платежи</CardTitle>
			</CardHeader>
			<CardContent className="grid gap-2 text-sm">
				{payments.isPending && (
					<div className="text-muted-foreground">Загрузка…</div>
				)}
				{payments.error && (
					<div className="text-destructive">
						{getErrorMessage(payments.error, 'Не удалось загрузить платежи')}
					</div>
				)}
				{payments.data?.length ? (
					<div className="grid gap-2">
						{payments.data.map((p) => (
							<div
								key={String(p.id)}
								className="flex items-center justify-between gap-4 rounded-xl border border-border p-3"
							>
								<div className="grid">
									<div className="font-medium">{p.amount ?? '—'}</div>
									<div className="text-muted-foreground">
										{p.paymentDate
											? new Date(p.paymentDate).toLocaleString()
											: '—'}
									</div>
								</div>
								<div className="text-muted-foreground text-right">
									<div>{paymentMethodLabel(Number(p.method))}</div>
									{p.status !== undefined &&
										p.status !== PaymentStatus.Completed && (
											<div className="text-xs mt-1">
												{p.status === PaymentStatus.Pending && 'Ожидает'}
												{p.status === PaymentStatus.Cancelled && 'Отменён'}
											</div>
										)}
								</div>
							</div>
						))}
					</div>
				) : (
					!payments.isPending && (
						<div className="text-muted-foreground">Платежей пока нет</div>
					)
				)}
			</CardContent>
		</Card>
	);
}

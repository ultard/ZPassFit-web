import $api from '~/lib/api.client';
import { getErrorMessage } from '~/lib/error-message';

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
								<div className="text-muted-foreground">{p.method ?? '—'}</div>
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

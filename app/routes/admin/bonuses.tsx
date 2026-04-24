import $api from '~/lib/api.client';
import { getErrorMessage } from '~/lib/error-message';

import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';

export default function AdminBonusesRoute() {
	const bonuses = $api.useQuery('get', '/dashboard/bonuses', {
		params: { query: { page: 1, pageSize: 20 } }
	});

	return (
		<Card>
			<CardHeader>
				<CardTitle>Бонусы</CardTitle>
			</CardHeader>
			<CardContent className="grid gap-2 text-sm">
				{bonuses.isPending && (
					<div className="text-muted-foreground">Загрузка…</div>
				)}
				{bonuses.error && (
					<div className="text-destructive">
						{getErrorMessage(bonuses.error, 'Не удалось загрузить бонусы')}
					</div>
				)}
				{bonuses.data?.items?.length ? (
					<div className="grid gap-2">
						{bonuses.data.items.map((b) => (
							<div
								key={String(b.id)}
								className="rounded-xl border border-border p-3 flex items-center justify-between gap-4"
							>
								<div className="grid">
									<div className="font-medium">{String(b.type)}</div>
									<div className="text-muted-foreground">
										{b.clientLastName} {b.clientFirstName}
									</div>
								</div>
								<div className="text-muted-foreground">
									{new Date(b.createDate).toLocaleDateString()}
								</div>
							</div>
						))}
					</div>
				) : (
					!bonuses.isPending && (
						<div className="text-muted-foreground">Нет транзакций</div>
					)
				)}
			</CardContent>
		</Card>
	);
}

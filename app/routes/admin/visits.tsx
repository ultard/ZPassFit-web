import $api from '~/lib/api.client';
import { getErrorMessage } from '~/lib/error-message';

import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';

export default function AdminVisitsRoute() {
	const visits = $api.useQuery('get', '/dashboard/visits', {
		params: { query: { page: 1, pageSize: 20 } }
	});

	return (
		<Card>
			<CardHeader>
				<CardTitle>Посещения</CardTitle>
			</CardHeader>
			<CardContent className="grid gap-2 text-sm">
				{visits.isPending && (
					<div className="text-muted-foreground">Загрузка…</div>
				)}
				{visits.error && (
					<div className="text-destructive">
						{getErrorMessage(visits.error, 'Не удалось загрузить посещения')}
					</div>
				)}
				{visits.data?.items?.length ? (
					<div className="grid gap-2">
						{visits.data.items.map((v) => (
							<div
								key={String(v.id)}
								className="rounded-xl border border-border p-3 flex items-center justify-between gap-4"
							>
								<div className="grid">
									<div className="font-medium">
										{new Date(v.enterDate).toLocaleString()}
									</div>
									<div className="text-muted-foreground">
										{v.clientLastName} {v.clientFirstName}
									</div>
								</div>
								<div className="text-muted-foreground">
									{v.leaveDate
										? new Date(v.leaveDate).toLocaleString()
										: 'Открыто'}
								</div>
							</div>
						))}
					</div>
				) : (
					!visits.isPending && (
						<div className="text-muted-foreground">Нет записей</div>
					)
				)}
			</CardContent>
		</Card>
	);
}

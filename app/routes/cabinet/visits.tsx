import $api from '~/lib/api.client';
import { getErrorMessage } from '~/lib/error-message';

import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';

export default function CabinetVisitsRoute() {
	const visits = $api.useQuery('get', '/attendance/visits/history');

	return (
		<Card>
			<CardHeader>
				<CardTitle>История посещений</CardTitle>
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
				{visits.data?.length ? (
					<div className="grid gap-2">
						{visits.data.map((v) => (
							<div
								key={String(v.id)}
								className="flex items-center justify-between gap-4 rounded-xl border border-border p-3"
							>
								<div className="grid">
									<div className="font-medium">
										{new Date(v.enterDate).toLocaleString()}
									</div>
									<div className="text-muted-foreground">
										Выход:{' '}
										{v.leaveDate ? new Date(v.leaveDate).toLocaleString() : '—'}
									</div>
								</div>
								<div className="text-muted-foreground">#{String(v.id)}</div>
							</div>
						))}
					</div>
				) : (
					!visits.isPending && (
						<div className="text-muted-foreground">Пока нет посещений</div>
					)
				)}
			</CardContent>
		</Card>
	);
}

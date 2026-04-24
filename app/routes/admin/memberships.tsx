import { Link } from 'react-router';

import $api from '~/lib/api.client';
import { getErrorMessage } from '~/lib/error-message';

import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';

export default function AdminMembershipsRoute() {
	const memberships = $api.useQuery('get', '/dashboard/memberships', {
		params: { query: { page: 1, pageSize: 20 } }
	});

	return (
		<Card>
			<CardHeader>
				<CardTitle>Абонементы</CardTitle>
			</CardHeader>
			<CardContent className="grid gap-2 text-sm">
				{memberships.isPending && (
					<div className="text-muted-foreground">Загрузка…</div>
				)}
				{memberships.error && (
					<div className="text-destructive">
						{getErrorMessage(
							memberships.error,
							'Не удалось загрузить абонементы'
						)}
					</div>
				)}
				{memberships.data?.items?.length ? (
					<div className="grid gap-2">
						{memberships.data.items.map((m) => (
							<div
								key={String(m.id)}
								className="rounded-xl border border-border p-3 flex items-center justify-between gap-4"
							>
								<div className="grid">
									<div className="font-medium">{m.planName}</div>
									<div className="text-muted-foreground">
										{m.clientLastName} {m.clientFirstName}
									</div>
								</div>
								<div className="flex items-center gap-2">
									<div className="text-muted-foreground">
										До {new Date(m.expireDate).toLocaleDateString()}
									</div>
									<Button asChild size="sm" variant="outline">
										<Link to={`/admin/memberships/${String(m.id)}`}>
											Редактировать
										</Link>
									</Button>
								</div>
							</div>
						))}
					</div>
				) : (
					!memberships.isPending && (
						<div className="text-muted-foreground">Нет записей</div>
					)
				)}
			</CardContent>
		</Card>
	);
}

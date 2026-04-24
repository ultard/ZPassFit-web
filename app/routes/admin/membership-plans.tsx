import { Link } from 'react-router';

import $api from '~/lib/api.client';
import { getErrorMessage } from '~/lib/error-message';

import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';

export default function AdminMembershipPlansRoute() {
	const plans = $api.useQuery('get', '/dashboard/membership-plans');

	return (
		<Card>
			<CardHeader className="flex-row items-center justify-between gap-4">
				<CardTitle>Тарифы абонементов</CardTitle>
				<Button asChild>
					<Link to="/admin/membership-plans/new">Создать</Link>
				</Button>
			</CardHeader>
			<CardContent className="grid gap-2 text-sm">
				{plans.isPending && (
					<div className="text-muted-foreground">Загрузка…</div>
				)}
				{plans.error && (
					<div className="text-destructive">
						{getErrorMessage(plans.error, 'Не удалось загрузить тарифы')}
					</div>
				)}
				{plans.data?.length ? (
					<div className="grid gap-2 md:grid-cols-2">
						{plans.data.map((p) => (
							<Button
								key={String(p.id)}
								asChild
								variant="outline"
								className="h-auto justify-start"
							>
								<Link
									to={`/admin/membership-plans/${String(p.id)}`}
									className="grid gap-1 p-3"
								>
									<div className="font-medium">{p.name}</div>
									<div className="text-muted-foreground text-sm">
										{p.description}
									</div>
								</Link>
							</Button>
						))}
					</div>
				) : (
					!plans.isPending && (
						<div className="text-muted-foreground">Нет тарифов</div>
					)
				)}
			</CardContent>
		</Card>
	);
}

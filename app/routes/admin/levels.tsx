import { Link } from 'react-router';

import $api from '~/lib/api.client';
import { getErrorMessage } from '~/lib/error-message';

import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';

export default function AdminLevelsRoute() {
	const levels = $api.useQuery('get', '/dashboard/levels');

	return (
		<Card>
			<CardHeader className="flex-row items-center justify-between gap-4">
				<CardTitle>Уровни лояльности</CardTitle>
				<Button asChild>
					<Link to="/admin/levels/new">Создать</Link>
				</Button>
			</CardHeader>
			<CardContent className="grid gap-2 text-sm">
				{levels.isPending && (
					<div className="text-muted-foreground">Загрузка…</div>
				)}
				{levels.error && (
					<div className="text-destructive">
						{getErrorMessage(levels.error, 'Не удалось загрузить уровни')}
					</div>
				)}
				{levels.data?.length ? (
					<div className="grid gap-2 md:grid-cols-2">
						{levels.data.map((l) => (
							<Button
								key={l.id}
								asChild
								variant="outline"
								className="h-auto justify-start"
							>
								<Link to={`/admin/levels/${l.id}`} className="grid gap-1 p-3">
									<div className="font-medium">{l.name}</div>
									<div className="text-muted-foreground text-sm">
										Активируется: {String(l.activateDays)} дн. • Grace:{' '}
										{String(l.graceDays)} дн.
									</div>
								</Link>
							</Button>
						))}
					</div>
				) : (
					!levels.isPending && (
						<div className="text-muted-foreground">Нет уровней</div>
					)
				)}
			</CardContent>
		</Card>
	);
}

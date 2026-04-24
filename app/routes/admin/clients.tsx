import { useState } from 'react';
import { Link } from 'react-router';

import $api from '~/lib/api.client';
import { getErrorMessage } from '~/lib/error-message';

import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';

export default function AdminClientsRoute() {
	const [search, setSearch] = useState('');
	const clients = $api.useQuery('get', '/dashboard/clients', {
		params: { query: { search, page: 1, pageSize: 20 } }
	});

	return (
		<Card>
			<CardHeader>
				<CardTitle>Клиенты</CardTitle>
			</CardHeader>
			<CardContent className="grid gap-4">
				<div className="grid gap-2 max-w-lg">
					<Label htmlFor="q">Поиск</Label>
					<Input
						id="q"
						value={search}
						onChange={(e) => setSearch(e.currentTarget.value)}
						placeholder="ФИО, телефон или email"
					/>
				</div>

				{clients.isPending && (
					<div className="text-sm text-muted-foreground">Загрузка…</div>
				)}
				{clients.error && (
					<div className="text-sm text-destructive">
						{getErrorMessage(clients.error, 'Не удалось загрузить клиентов')}
					</div>
				)}

				{clients.data?.items?.length ? (
					<div className="grid gap-2">
						{clients.data.items.map((c) => (
							<div key={c.id} className="rounded-xl border border-border p-3">
								<div className="flex items-center justify-between gap-4">
									<div className="grid">
										<div className="font-medium">
											{c.lastName} {c.firstName} {c.middleName}
										</div>
										<div className="text-sm text-muted-foreground">
											{c.email} • {c.phone}
										</div>
									</div>
									<div className="flex items-center gap-2">
										<div className="text-sm text-muted-foreground">
											{String(c.status)}
										</div>
										<Button asChild size="sm" variant="outline">
											<Link to={`/admin/clients/${c.id}`}>Открыть</Link>
										</Button>
									</div>
								</div>
							</div>
						))}
					</div>
				) : (
					!clients.isPending && (
						<div className="text-sm text-muted-foreground">
							Ничего не найдено
						</div>
					)
				)}
			</CardContent>
		</Card>
	);
}

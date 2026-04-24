import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { toast } from 'sonner';

import $api from '~/lib/api.client';
import { getErrorMessage } from '~/lib/error-message';
import queryClient from '~/lib/query.client';

import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';

export default function AdminLevelRoute() {
	const params = useParams();
	const id = params.id ?? '';

	const level = $api.useQuery(
		'get',
		'/dashboard/levels/{id}',
		{
			params: { path: { id } }
		},
		{ enabled: Boolean(id) }
	);
	const levels = $api.useQuery('get', '/dashboard/levels');

	const [name, setName] = useState('');
	const [activateDays, setActivateDays] = useState(0);
	const [graceDays, setGraceDays] = useState(0);
	const [previousLevelId, setPreviousLevelId] = useState<string>('');

	useEffect(() => {
		if (!level.data) return;
		setName(level.data.name);
		setActivateDays(Number(level.data.activateDays));
		setGraceDays(Number(level.data.graceDays));
		setPreviousLevelId(level.data.previousLevelId ?? '');
	}, [level.data]);

	const update = $api.useMutation('put', '/dashboard/levels/{id}', {
		onSuccess: async () => {
			toast.success('Уровень обновлён');
			await queryClient.invalidateQueries({
				queryKey: ['get', '/dashboard/levels']
			});
			await queryClient.invalidateQueries({
				queryKey: [
					'get',
					'/dashboard/levels/{id}',
					{ params: { path: { id } } }
				]
			});
		},
		onError: (e) =>
			toast.error(getErrorMessage(e, 'Не удалось обновить уровень'))
	});

	return (
		<Card>
			<CardHeader>
				<CardTitle>Редактировать уровень</CardTitle>
			</CardHeader>
			<CardContent className="grid gap-4 max-w-xl">
				{level.isPending && (
					<div className="text-muted-foreground">Загрузка…</div>
				)}
				{level.error && (
					<div className="text-destructive">
						{getErrorMessage(level.error, 'Не удалось загрузить уровень')}
					</div>
				)}
				{!level.isPending && !level.data && !level.error && (
					<div className="text-muted-foreground">Уровень не найден</div>
				)}
				<div className="grid gap-2">
					<Label htmlFor="name">Название</Label>
					<Input
						id="name"
						value={name}
						onChange={(e) => setName(e.currentTarget.value)}
					/>
				</div>
				<div className="grid gap-2">
					<Label htmlFor="activateDays">Activate days</Label>
					<Input
						id="activateDays"
						type="number"
						value={activateDays}
						onChange={(e) => setActivateDays(Number(e.currentTarget.value))}
					/>
				</div>
				<div className="grid gap-2">
					<Label htmlFor="graceDays">Grace days</Label>
					<Input
						id="graceDays"
						type="number"
						value={graceDays}
						onChange={(e) => setGraceDays(Number(e.currentTarget.value))}
					/>
				</div>
				<div className="grid gap-2">
					<Label htmlFor="previousLevelId">Предыдущий уровень</Label>
					<select
						id="previousLevelId"
						value={previousLevelId}
						onChange={(e) => setPreviousLevelId(e.currentTarget.value)}
						className="h-9 w-full rounded-4xl border border-input bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
					>
						<option value="">—</option>
						{levels.data
							?.filter((l) => l.id !== id)
							.map((l) => (
								<option key={l.id} value={l.id}>
									{l.name}
								</option>
							))}
					</select>
				</div>
				<Button
					disabled={update.isPending}
					onClick={() =>
						id &&
						update.mutate({
							params: { path: { id } },
							body: {
								name,
								activateDays,
								graceDays,
								previousLevelId: previousLevelId || null
							}
						})
					}
				>
					Сохранить
				</Button>
			</CardContent>
		</Card>
	);
}

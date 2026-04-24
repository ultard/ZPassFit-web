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

function parseDurations(text: string): number[] {
	return text
		.split(',')
		.map((t) => Number(t.trim()))
		.filter((n) => Number.isFinite(n) && n > 0);
}

export default function AdminMembershipPlanRoute() {
	const params = useParams();
	const planId = params.id ?? '';

	const plan = $api.useQuery(
		'get',
		'/dashboard/membership-plans/{id}',
		{
			params: { path: { id: planId } }
		},
		{ enabled: Boolean(planId) }
	);

	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [durations, setDurations] = useState('');
	const [price, setPrice] = useState(0);

	useEffect(() => {
		if (!plan.data) return;
		setName(plan.data.name);
		setDescription(plan.data.description);
		setDurations(plan.data.durations.map(String).join(', '));
		setPrice(Number(plan.data.price));
	}, [plan.data]);

	const update = $api.useMutation('put', '/dashboard/membership-plans/{id}', {
		onSuccess: async () => {
			toast.success('Тариф обновлён');
			await queryClient.invalidateQueries({
				queryKey: ['get', '/dashboard/membership-plans']
			});
			await queryClient.invalidateQueries({
				queryKey: [
					'get',
					'/dashboard/membership-plans/{id}',
					{ params: { path: { id: planId } } }
				]
			});
		},
		onError: (e) => toast.error(getErrorMessage(e, 'Не удалось обновить тариф'))
	});

	return (
		<Card>
			<CardHeader>
				<CardTitle>Редактировать тариф</CardTitle>
			</CardHeader>
			<CardContent className="grid gap-4 max-w-xl">
				{plan.isPending && (
					<div className="text-muted-foreground">Загрузка…</div>
				)}
				{plan.error && (
					<div className="text-destructive">
						{getErrorMessage(plan.error, 'Не удалось загрузить тариф')}
					</div>
				)}
				{!plan.isPending && !plan.data && !plan.error && (
					<div className="text-muted-foreground">Тариф не найден</div>
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
					<Label htmlFor="description">Описание</Label>
					<Input
						id="description"
						value={description}
						onChange={(e) => setDescription(e.currentTarget.value)}
					/>
				</div>
				<div className="grid gap-2">
					<Label htmlFor="durations">Длительности (дни, через запятую)</Label>
					<Input
						id="durations"
						value={durations}
						onChange={(e) => setDurations(e.currentTarget.value)}
					/>
				</div>
				<div className="grid gap-2">
					<Label htmlFor="price">Цена</Label>
					<Input
						id="price"
						type="number"
						value={price}
						onChange={(e) => setPrice(Number(e.currentTarget.value))}
					/>
				</div>
				<Button
					disabled={update.isPending}
					onClick={() =>
						planId &&
						update.mutate({
							params: { path: { id: planId } },
							body: {
								name,
								description,
								durations: parseDurations(durations),
								price
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

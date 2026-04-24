import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import $api from '~/lib/api.client';
import { getErrorMessage } from '~/lib/error-message';

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

export default function AdminMembershipPlanNewRoute() {
	const navigate = useNavigate();
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [durations, setDurations] = useState('30, 90, 180, 365');
	const [price, setPrice] = useState(0);

	const create = $api.useMutation('post', '/dashboard/membership-plans', {
		onSuccess: (data) => {
			toast.success('Тариф создан');
			navigate(`/admin/membership-plans/${String(data.id)}`, { replace: true });
		},
		onError: (e) => toast.error(getErrorMessage(e, 'Не удалось создать тариф'))
	});

	return (
		<Card>
			<CardHeader>
				<CardTitle>Создать тариф</CardTitle>
			</CardHeader>
			<CardContent className="grid gap-4 max-w-xl">
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
					disabled={create.isPending}
					onClick={() =>
						create.mutate({
							body: {
								name,
								description,
								durations: parseDurations(durations),
								price
							}
						})
					}
				>
					Создать
				</Button>
			</CardContent>
		</Card>
	);
}

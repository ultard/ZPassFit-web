import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import $api from '~/lib/api.client';
import { getErrorMessage } from '~/lib/error-message';

import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';

export default function AdminLevelNewRoute() {
	const navigate = useNavigate();
	const levels = $api.useQuery('get', '/dashboard/levels');

	const [name, setName] = useState('');
	const [activateDays, setActivateDays] = useState(0);
	const [graceDays, setGraceDays] = useState(0);
	const [previousLevelId, setPreviousLevelId] = useState<string>('');

	const create = $api.useMutation('post', '/dashboard/levels', {
		onSuccess: (data) => {
			toast.success('Уровень создан');
			navigate(`/admin/levels/${data.id}`, { replace: true });
		},
		onError: (e) =>
			toast.error(getErrorMessage(e, 'Не удалось создать уровень'))
	});

	return (
		<Card>
			<CardHeader>
				<CardTitle>Создать уровень</CardTitle>
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
						{levels.data?.map((l) => (
							<option key={l.id} value={l.id}>
								{l.name}
							</option>
						))}
					</select>
				</div>
				<Button
					disabled={create.isPending}
					onClick={() =>
						create.mutate({
							body: {
								name,
								activateDays,
								graceDays,
								previousLevelId: previousLevelId || null
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

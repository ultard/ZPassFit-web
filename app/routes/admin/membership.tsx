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

export default function AdminMembershipRoute() {
	const params = useParams();
	const membershipId = params.id ?? '';

	const membership = $api.useQuery(
		'get',
		'/dashboard/memberships/{id}',
		{
			params: { path: { id: membershipId } }
		},
		{ enabled: Boolean(membershipId) }
	);
	const plans = $api.useQuery('get', '/dashboard/membership-plans');

	const [status, setStatus] = useState<string>('');
	const [planId, setPlanId] = useState<string>('');
	const [activatedDate, setActivatedDate] = useState<string>('');
	const [expireDate, setExpireDate] = useState<string>('');

	useEffect(() => {
		if (!membership.data) return;
		setStatus(String(membership.data.status));
		setPlanId(String(membership.data.planId));
		setActivatedDate(membership.data.activatedDate.slice(0, 10));
		setExpireDate(membership.data.expireDate.slice(0, 10));
	}, [membership.data]);

	const update = $api.useMutation('put', '/dashboard/memberships/{id}', {
		onSuccess: async () => {
			toast.success('Абонемент обновлён');
			await queryClient.invalidateQueries({
				queryKey: ['get', '/dashboard/memberships']
			});
			await queryClient.invalidateQueries({
				queryKey: [
					'get',
					'/dashboard/memberships/{id}',
					{ params: { path: { id: membershipId } } }
				]
			});
		},
		onError: (e) =>
			toast.error(getErrorMessage(e, 'Не удалось обновить абонемент'))
	});

	return (
		<Card>
			<CardHeader>
				<CardTitle>Редактировать абонемент</CardTitle>
			</CardHeader>
			<CardContent className="grid gap-4 max-w-xl">
				{membership.isPending && (
					<div className="text-muted-foreground">Загрузка…</div>
				)}
				{membership.error && (
					<div className="text-destructive">
						{getErrorMessage(
							membership.error,
							'Не удалось загрузить абонемент'
						)}
					</div>
				)}
				{!membership.isPending && !membership.data && !membership.error && (
					<div className="text-muted-foreground">Абонемент не найден</div>
				)}
				{membership.data && (
					<div className="text-sm text-muted-foreground">
						Клиент: {membership.data.clientLastName}{' '}
						{membership.data.clientFirstName}
					</div>
				)}

				<div className="grid gap-2">
					<Label htmlFor="planId">Тариф</Label>
					<select
						id="planId"
						value={planId}
						onChange={(e) => setPlanId(e.currentTarget.value)}
						className="h-9 w-full rounded-4xl border border-input bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
					>
						{plans.data?.map((p) => (
							<option key={String(p.id)} value={String(p.id)}>
								{p.name}
							</option>
						))}
					</select>
				</div>

				<div className="grid gap-2">
					<Label htmlFor="status">Status (код)</Label>
					<Input
						id="status"
						type="number"
						value={status}
						onChange={(e) => setStatus(e.currentTarget.value)}
					/>
				</div>

				<div className="grid gap-2">
					<Label htmlFor="activatedDate">Дата активации</Label>
					<Input
						id="activatedDate"
						type="date"
						value={activatedDate}
						onChange={(e) => setActivatedDate(e.currentTarget.value)}
					/>
				</div>

				<div className="grid gap-2">
					<Label htmlFor="expireDate">Дата окончания</Label>
					<Input
						id="expireDate"
						type="date"
						value={expireDate}
						onChange={(e) => setExpireDate(e.currentTarget.value)}
					/>
				</div>

				<Button
					disabled={update.isPending}
					onClick={() =>
						membershipId &&
						update.mutate({
							params: { path: { id: membershipId } },
							body: {
								status: status === '' ? null : Number(status),
								planId: planId === '' ? null : planId,
								activatedDate: activatedDate
									? new Date(`${activatedDate}T00:00:00.000Z`).toISOString()
									: null,
								expireDate: expireDate
									? new Date(`${expireDate}T00:00:00.000Z`).toISOString()
									: null
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

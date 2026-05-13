import { useState } from 'react';
import { useParams } from 'react-router';
import { toast } from 'sonner';

import $api from '~/lib/api.client';
import queryClient from '~/lib/query.client';
import { ClientStatus } from '~/lib/api.types';
import { getErrorMessage } from '~/lib/error-message';

import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';

export default function AdminClientRoute() {
	const params = useParams();
	const id = params.id ?? '';
	const [creditAmount, setCreditAmount] = useState('');

	const client = $api.useQuery(
		'get',
		'/dashboard/clients/{id}',
		{
			params: { path: { id } }
		},
		{ enabled: Boolean(id) }
	);

	const churnPrediction = $api.useMutation('post', '/prediction/churn', {
		onSuccess: (data) => {
			const probability =
				typeof data.probability === 'string'
					? Number(data.probability)
					: data.probability;

			const probabilityText = Number.isFinite(probability)
				? `${(probability * 100).toFixed(1)}%`
				: String(data.probability);

			toast.success(`Вероятность оттока: ${probabilityText}`);
		},
		onError: (e) =>
			toast.error(getErrorMessage(e, 'Не удалось рассчитать прогноз оттока'))
	});

	const approve = $api.useMutation('post', '/dashboard/clients/{id}/approve', {
		onSuccess: async () => {
			toast.success('Клиент подтверждён');
			await queryClient.invalidateQueries({
				queryKey: ['get', '/dashboard/clients']
			});
			await queryClient.invalidateQueries({
				queryKey: [
					'get',
					'/dashboard/clients/{id}',
					{ params: { path: { id } } }
				]
			});
		},
		onError: (e) =>
			toast.error(getErrorMessage(e, 'Не удалось подтвердить клиента'))
	});

	const block = $api.useMutation('post', '/dashboard/clients/{id}/block', {
		onSuccess: async () => {
			toast.success('Клиент заблокирован');
			await queryClient.invalidateQueries({
				queryKey: ['get', '/dashboard/clients']
			});
			await queryClient.invalidateQueries({
				queryKey: [
					'get',
					'/dashboard/clients/{id}',
					{ params: { path: { id } } }
				]
			});
		},
		onError: (e) =>
			toast.error(getErrorMessage(e, 'Не удалось заблокировать клиента'))
	});

	const unblock = $api.useMutation('post', '/dashboard/clients/{id}/unblock', {
		onSuccess: async () => {
			toast.success('Клиент разблокирован');
			await queryClient.invalidateQueries({
				queryKey: ['get', '/dashboard/clients']
			});
			await queryClient.invalidateQueries({
				queryKey: [
					'get',
					'/dashboard/clients/{id}',
					{ params: { path: { id } } }
				]
			});
		},
		onError: (e) =>
			toast.error(getErrorMessage(e, 'Не удалось разблокировать клиента'))
	});

	const creditBalance = $api.useMutation(
		'post',
		'/dashboard/clients/{id}/balance/credit',
		{
			onSuccess: async () => {
				toast.success('Баланс пополнен');
				setCreditAmount('');
				await queryClient.invalidateQueries({
					queryKey: [
						'get',
						'/dashboard/clients/{id}',
						{ params: { path: { id } } }
					]
				});
			},
			onError: (e) =>
				toast.error(getErrorMessage(e, 'Не удалось зачислить на баланс'))
		}
	);

	const creditParsed = Number.parseInt(creditAmount.replace(/\s/g, ''), 10);
	const canCredit =
		Boolean(id) &&
		Number.isFinite(creditParsed) &&
		creditParsed >= 1 &&
		!creditBalance.isPending;

	return (
		<Card>
			<CardHeader className="flex-row items-center justify-between gap-4">
				<CardTitle>Клиент</CardTitle>
				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						disabled={
							!id ||
							churnPrediction.isPending ||
							client.isPending ||
							Boolean(client.error) ||
							!client.data
						}
						onClick={() =>
							id && churnPrediction.mutate({ body: { clientId: id } })
						}
					>
						Прогноз оттока
					</Button>
					{client.data?.status === ClientStatus.Pending && (
						<Button
							variant="secondary"
							disabled={approve.isPending}
							onClick={() => id && approve.mutate({ params: { path: { id } } })}
						>
							Подтвердить
						</Button>
					)}
					{client.data?.status === ClientStatus.Active && (
						<Button
							variant="destructive"
							disabled={block.isPending}
							onClick={() => id && block.mutate({ params: { path: { id } } })}
						>
							Заблокировать
						</Button>
					)}
					{client.data?.status === ClientStatus.Blocked && (
						<Button
							variant="outline"
							disabled={unblock.isPending}
							onClick={() => id && unblock.mutate({ params: { path: { id } } })}
						>
							Разблокировать
						</Button>
					)}
				</div>
			</CardHeader>
			<CardContent className="grid gap-2 text-sm">
				{client.isPending && (
					<div className="text-muted-foreground">Загрузка…</div>
				)}
				{client.error && (
					<div className="text-destructive">
						{getErrorMessage(client.error, 'Не удалось загрузить клиента')}
					</div>
				)}
				{!client.isPending && !client.data && !client.error && (
					<div className="text-muted-foreground">Клиент не найден</div>
				)}
				{client.data && (
					<div className="grid gap-6">
						<div className="grid gap-1">
							<div>
								<span className="text-muted-foreground">ФИО:</span>{' '}
								{client.data.lastName} {client.data.firstName}{' '}
								{client.data.middleName}
							</div>
							<div>
								<span className="text-muted-foreground">Email:</span>{' '}
								{client.data.email}
							</div>
							<div>
								<span className="text-muted-foreground">Телефон:</span>{' '}
								{client.data.phone}
							</div>
							<div>
								<span className="text-muted-foreground">Статус:</span>{' '}
								{String(client.data.status)}
							</div>
							<div>
								<span className="text-muted-foreground">Бонусы:</span>{' '}
								{Number(client.data.bonuses).toLocaleString('ru-RU')}
							</div>
							<div>
								<span className="text-muted-foreground">Баланс:</span>{' '}
								{Number(client.data.balance).toLocaleString('ru-RU')} ₽
							</div>
						</div>
						<div className="rounded-xl border border-border p-4 grid gap-3 max-w-md">
							<div className="font-medium">Пополнение баланса</div>
							<p className="text-muted-foreground text-xs">
								Сумма в рублях (целое число). Зачисление доступно сотрудникам и
								администраторам.
							</p>
							<div className="grid gap-2">
								<Label htmlFor="credit-amount">Сумма, ₽</Label>
								<Input
									id="credit-amount"
									inputMode="numeric"
									placeholder="Например, 500"
									value={creditAmount}
									onChange={(e) => setCreditAmount(e.target.value)}
								/>
							</div>
							<Button
								type="button"
								disabled={!canCredit}
								onClick={() => {
									if (!id || !canCredit) return;
									creditBalance.mutate({
										params: { path: { id } },
										body: { amount: creditParsed }
									});
								}}
							>
								Зачислить
							</Button>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

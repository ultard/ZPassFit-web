import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';

import $api from '~/lib/api.client';
import queryClient from '~/lib/query.client';
import { ClientStatus, clientStatusLabel } from '~/lib/api.types';
import { getErrorMessage } from '~/lib/error-message';

import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent
} from '~/components/ui/chart';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';

import { useAuthStore } from '~/store/auth.store';

function num(v: number | string | null | undefined) {
	if (v == null) return 0;
	return typeof v === 'string' ? Number(v) : v;
}

function fmtDay(value: string) {
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return value;
	return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

const visitsChartConfig: ChartConfig = {
	value: {
		label: 'Посещения',
		color: 'var(--chart-1)'
	}
};

const paymentsChartConfig: ChartConfig = {
	amount: {
		label: 'Платежи, ₽',
		color: 'var(--chart-2)'
	}
};

const bonusesChartConfig: ChartConfig = {
	amount: {
		label: 'Бонусы',
		color: 'var(--chart-3)'
	}
};

export default function AdminClientRoute() {
	const params = useParams();
	const id = params.id ?? '';
	const [searchParams, setSearchParams] = useSearchParams();
	const now = new Date();
	const year = Number(searchParams.get('year') ?? now.getFullYear());
	const month = Number(searchParams.get('month') ?? now.getMonth() + 1);
	const isAdmin = useAuthStore((s) => s.isAdmin());
	const [balanceValue, setBalanceValue] = useState('');

	const client = $api.useQuery(
		'get',
		'/dashboard/clients/{id}',
		{
			params: { path: { id } }
		},
		{ enabled: Boolean(id) }
	);

	const stats = $api.useQuery(
		'get',
		'/dashboard/clients/{id}/stats',
		{
			params: {
				path: { id },
				query: { year, month }
			}
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
			onSuccess: async (data) => {
				toast.success('Баланс пополнен');
				setBalanceValue(String(data.balance));
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

	const setBalance = $api.useMutation('put', '/dashboard/clients/{id}/balance', {
		onSuccess: async (data) => {
			toast.success('Баланс обновлён');
			setBalanceValue(String(data.balance));
			await queryClient.invalidateQueries({
				queryKey: [
					'get',
					'/dashboard/clients/{id}',
					{ params: { path: { id } } }
				]
			});
		},
		onError: (e) =>
			toast.error(getErrorMessage(e, 'Не удалось изменить баланс'))
	});

	useEffect(() => {
		if (client.data) {
			setBalanceValue(String(client.data.balance));
		}
	}, [client.data?.id, client.data?.balance]);

	const currentBalance = num(client.data?.balance);
	const balanceParsed = Number.parseInt(balanceValue.replace(/\s/g, ''), 10);
	const balanceChanged =
		Number.isFinite(balanceParsed) && balanceParsed !== currentBalance;
	const balanceValid = isAdmin
		? Number.isFinite(balanceParsed) && balanceParsed >= 0
		: Number.isFinite(balanceParsed) && balanceParsed > currentBalance;
	const balancePending = setBalance.isPending || creditBalance.isPending;
	const canSaveBalance =
		Boolean(id) && balanceChanged && balanceValid && !balancePending;

	const saveBalance = () => {
		if (!id || !canSaveBalance) return;

		if (isAdmin) {
			setBalance.mutate({
				params: { path: { id } },
				body: { balance: balanceParsed }
			});
			return;
		}

		creditBalance.mutate({
			params: { path: { id } },
			body: { amount: balanceParsed - currentBalance }
		});
	};

	const series = stats.data?.series;
	const summary = stats.data?.summary;
	const visitsData =
		series?.visitsByDay?.map((p) => ({
			date: fmtDay(String(p.date)),
			value: num(p.value)
		})) ?? [];
	const paymentsData =
		series?.paymentsByDay?.map((p) => ({
			date: fmtDay(String(p.date)),
			amount: num(p.amount)
		})) ?? [];
	const bonusesData =
		series?.bonusAccrualsByDay?.map((p) => ({
			date: fmtDay(String(p.date)),
			amount: num(p.amount)
		})) ?? [];

	return (
		<div className="grid gap-4">
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
								{clientStatusLabel(client.data.status)}
							</div>
							<div>
								<span className="text-muted-foreground">Бонусы:</span>{' '}
								{Number(client.data.bonuses).toLocaleString('ru-RU')}
							</div>
							<div className="flex flex-wrap items-center gap-2">
								<Label htmlFor="client-balance" className="text-muted-foreground shrink-0">
									Баланс, ₽
								</Label>
								<Input
									id="client-balance"
									className="h-8 w-32"
									inputMode="numeric"
									min={isAdmin ? 0 : currentBalance}
									value={balanceValue}
									onChange={(e) => setBalanceValue(e.target.value)}
								/>
								<Button
									type="button"
									size="sm"
									disabled={!canSaveBalance}
									onClick={saveBalance}
								>
									{balancePending ? '…' : 'Сохранить'}
								</Button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{client.data && (
				<>
					<Card>
						<CardHeader>
							<CardTitle>
								Статистика
								{stats.data?.period?.label ? (
									<span className="ml-2 text-sm font-normal text-muted-foreground">
										· {stats.data.period.label}
									</span>
								) : null}
							</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-4">
							<div className="grid gap-3 sm:grid-cols-2 max-w-lg">
								<div className="grid gap-2">
									<Label htmlFor="year">Год</Label>
									<Input
										id="year"
										type="number"
										value={year}
										onChange={(e) => {
											const v = e.currentTarget.value;
											setSearchParams((prev) => {
												prev.set('year', v);
												return prev;
											});
										}}
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="month">Месяц</Label>
									<Input
										id="month"
										type="number"
										min={1}
										max={12}
										value={month}
										onChange={(e) => {
											const v = e.currentTarget.value;
											setSearchParams((prev) => {
												prev.set('month', v);
												return prev;
											});
										}}
									/>
								</div>
							</div>

							{stats.isPending && (
								<div className="text-sm text-muted-foreground">
									Загрузка статистики…
								</div>
							)}
							{stats.error && (
								<div className="text-sm text-destructive">
									{getErrorMessage(stats.error, 'Не удалось загрузить статистику')}
								</div>
							)}

							{summary && (
								<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
									<div className="rounded-xl border border-border p-3">
										<div className="text-sm text-muted-foreground">Посещений</div>
										<div className="text-2xl font-semibold">
											{num(summary.visits).toLocaleString('ru-RU')}
										</div>
									</div>
									<div className="rounded-xl border border-border p-3">
										<div className="text-sm text-muted-foreground">
											Дней с визитами
										</div>
										<div className="text-2xl font-semibold">
											{num(summary.visitDays).toLocaleString('ru-RU')}
										</div>
									</div>
									<div className="rounded-xl border border-border p-3">
										<div className="text-sm text-muted-foreground">Платежи</div>
										<div className="text-2xl font-semibold">
											{num(summary.paymentsAmount).toLocaleString('ru-RU')} ₽
										</div>
									</div>
									<div className="rounded-xl border border-border p-3">
										<div className="text-sm text-muted-foreground">
											Начислено бонусов
										</div>
										<div className="text-2xl font-semibold">
											{num(summary.bonusAccrued).toLocaleString('ru-RU')}
										</div>
									</div>
								</div>
							)}
						</CardContent>
					</Card>

					{series && (
						<div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
							<Card>
								<CardHeader>
									<CardTitle className="text-base">Посещения по дням</CardTitle>
								</CardHeader>
								<CardContent className="max-h-72">
									<ChartContainer config={visitsChartConfig}>
										<BarChart data={visitsData}>
											<CartesianGrid strokeDasharray="3 3" />
											<XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
											<YAxis allowDecimals={false} width={32} />
											<Bar dataKey="value" fill="var(--color-value)" radius={4} />
											<ChartTooltip content={<ChartTooltipContent />} />
										</BarChart>
									</ChartContainer>
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle className="text-base">Платежи по дням</CardTitle>
								</CardHeader>
								<CardContent className="max-h-72">
									<ChartContainer config={paymentsChartConfig}>
										<BarChart data={paymentsData}>
											<CartesianGrid strokeDasharray="3 3" />
											<XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
											<YAxis width={48} />
											<Bar dataKey="amount" fill="var(--color-amount)" radius={4} />
											<ChartTooltip content={<ChartTooltipContent />} />
										</BarChart>
									</ChartContainer>
								</CardContent>
							</Card>

							<Card className="lg:col-span-2 xl:col-span-1">
								<CardHeader>
									<CardTitle className="text-base">Бонусы по дням</CardTitle>
								</CardHeader>
								<CardContent className="max-h-72">
									<ChartContainer config={bonusesChartConfig}>
										<BarChart data={bonusesData}>
											<CartesianGrid strokeDasharray="3 3" />
											<XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
											<YAxis allowDecimals={false} width={32} />
											<Bar dataKey="amount" fill="var(--color-amount)" radius={4} />
											<ChartTooltip content={<ChartTooltipContent />} />
										</BarChart>
									</ChartContainer>
								</CardContent>
							</Card>
						</div>
					)}
				</>
			)}
		</div>
	);
}

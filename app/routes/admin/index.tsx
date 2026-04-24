import { RiArrowDownLine, RiArrowUpLine } from '@remixicon/react';
import { useSearchParams } from 'react-router';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import $api from '~/lib/api.client';

import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent
} from '~/components/ui/chart';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';

function num(v: number | string | null | undefined) {
	if (v == null) return 0;
	return typeof v === 'string' ? Number(v) : v;
}

export default function AdminOverviewRoute() {
	const [searchParams, setSearchParams] = useSearchParams();
	const now = new Date();
	const year = Number(searchParams.get('year') ?? now.getFullYear());
	const month = Number(searchParams.get('month') ?? now.getMonth() + 1);

	const visitsChartConfig: ChartConfig = {
		value: {
			label: 'Посещения',
			color: 'var(--chart-1)'
		}
	};

	const revenueChartConfig: ChartConfig = {
		amount: {
			label: 'Выручка',
			color: 'var(--chart-1)'
		}
	};

	const newClientsChartConfig: ChartConfig = {
		value: {
			label: 'Новые клиенты',
			color: 'var(--chart-1)'
		}
	};

	const membershipsByPlanChartConfig: ChartConfig = {
		count: {
			label: 'Абонементы',
			color: 'var(--chart-1)'
		}
	};

	const overview = $api.useQuery('get', '/dashboard/overview', {
		params: { query: { year, month } }
	});

	if (overview.error) {
		const status = (overview.error as { status?: number | string | null })
			.status;
		if (String(status) === '403') {
			return (
				<Card>
					<CardHeader>
						<CardTitle>Нет доступа</CardTitle>
					</CardHeader>
					<CardContent className="text-sm text-muted-foreground">
						У вас нет прав для просмотра админ-аналитики.
					</CardContent>
				</Card>
			);
		}
	}

	const kpis = overview.data?.kpis ?? [];
	const series = overview.data?.series;

	return (
		<div className="grid gap-4">
			<Card>
				<CardHeader>
					<CardTitle>Период</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-3 sm:grid-cols-2 max-w-lg">
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
				</CardContent>
			</Card>

			<div className="grid gap-4 md:grid-cols-4">
				{kpis.slice(0, 4).map((k) => {
					const up = k.direction?.toLowerCase?.() === 'up' || k.isNewGrowth;
					const Icon = up ? RiArrowUpLine : RiArrowDownLine;
					const change = k.changePercent == null ? null : num(k.changePercent);
					return (
						<Card key={k.id}>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									{k.title}
								</CardTitle>
							</CardHeader>
							<CardContent className="grid gap-1">
								<div className="text-2xl font-semibold">
									{String(k.value)} {k.unit}
								</div>
								<div
									className={
										'flex items-center gap-1 text-sm ' +
										(up ? 'text-emerald-600' : 'text-destructive')
									}
								>
									<Icon className="size-4" />
									<span>{change == null ? '—' : `${change.toFixed(1)}%`}</span>
									<span className="text-muted-foreground">
										vs {String(k.previousValue)}
									</span>
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>

			{series && (
				<div className="grid gap-4 lg:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle>Посещения по дням</CardTitle>
						</CardHeader>
						<CardContent className="h-72">
							<ChartContainer config={visitsChartConfig}>
								<BarChart data={series.visitsByDay}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="date" />
									<YAxis />
									<Bar dataKey="value" fill="var(--color-value)" radius={4} />
									<ChartTooltip content={<ChartTooltipContent />} />
								</BarChart>
							</ChartContainer>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Выручка по дням</CardTitle>
						</CardHeader>
						<CardContent className="h-72">
							<ChartContainer config={revenueChartConfig}>
								<BarChart data={series.revenueByDay}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="date" />
									<YAxis />
									<Bar dataKey="amount" fill="var(--color-amount)" radius={4} />
									<ChartTooltip content={<ChartTooltipContent />} />
								</BarChart>
							</ChartContainer>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Новые клиенты по дням</CardTitle>
						</CardHeader>
						<CardContent className="h-72">
							<ChartContainer config={newClientsChartConfig}>
								<BarChart data={series.newClientsByDay}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="date" />
									<YAxis />
									<Bar dataKey="value" fill="var(--color-value)" radius={4} />
									<ChartTooltip content={<ChartTooltipContent />} />
								</BarChart>
							</ChartContainer>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Абонементы по тарифам</CardTitle>
						</CardHeader>
						<CardContent className="h-72">
							<ChartContainer config={membershipsByPlanChartConfig}>
								<BarChart data={series.membershipsByPlan}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="planName" hide />
									<YAxis />
									<Bar dataKey="count" fill="var(--color-count)" radius={4} />
									<ChartTooltip content={<ChartTooltipContent />} />
								</BarChart>
							</ChartContainer>
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	);
}

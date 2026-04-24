import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import $api from '~/lib/api.client';
import { PaymentMethod } from '~/lib/api.types';
import { getErrorMessage } from '~/lib/error-message';
import queryClient from '~/lib/query.client';
import { cn } from '~/lib/utils';

import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Separator } from '~/components/ui/separator';

function parsePlanDurations(
	durations: (number | string)[] | undefined
): number[] {
	if (!durations?.length) return [];
	const nums = durations
		.map((d) => Number(d))
		.filter((n) => Number.isFinite(n) && n > 0);
	return [...new Set(nums)].sort((a, b) => a - b);
}

function formatDaysRu(days: number): string {
	const n = Math.floor(days);
	const mod10 = n % 10;
	const mod100 = n % 100;
	if (mod100 >= 11 && mod100 <= 14) return `${n} дней`;
	if (mod10 === 1) return `${n} день`;
	if (mod10 >= 2 && mod10 <= 4) return `${n} дня`;
	return `${n} дней`;
}

export default function CabinetMembershipRoute() {
	const membership = $api.useQuery('get', '/client/membership');
	const plans = $api.useQuery('get', '/membership/plans');

	const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
	const [durationDays, setDurationDays] = useState(30);

	const selectedPlan = useMemo(
		() => plans.data?.find((p) => String(p.id) === String(selectedPlanId)),
		[plans.data, selectedPlanId]
	);

	const durationOptions = useMemo(
		() => parsePlanDurations(selectedPlan?.durations),
		[selectedPlan]
	);

	const buy = $api.useMutation('post', '/membership/buy', {
		onSuccess: () => {
			toast.success('Абонемент активирован');
			queryClient.invalidateQueries({
				queryKey: ['get', '/client/membership']
			});
			queryClient.invalidateQueries({ queryKey: ['get', '/client/payments'] });
		},
		onError: (err) =>
			toast.error(getErrorMessage(err, 'Не удалось купить абонемент'))
	});

	const canBuy =
		Boolean(selectedPlan) &&
		Number.isFinite(durationDays) &&
		durationDays >= 1;

	function selectPlan(planId: string) {
		setSelectedPlanId(planId);
		const plan = plans.data?.find((p) => String(p.id) === String(planId));
		const opts = parsePlanDurations(plan?.durations);
		setDurationDays(opts.length ? opts[0] : 30);
	}

	return (
		<div className="grid gap-4">
			<Card>
				<CardHeader>
					<CardTitle>Текущий абонемент</CardTitle>
				</CardHeader>
				<CardContent className="text-sm grid gap-1">
					<div>
						<span className="text-muted-foreground">Тариф:</span>{' '}
						{membership.data
							? (plans.data?.find(
									(p) => String(p.id) === String(membership.data?.planId)
								)?.name ?? `#${String(membership.data.planId)}`)
							: '—'}
					</div>
					<div>
						<span className="text-muted-foreground">До:</span>{' '}
						{membership.data?.expireDate
							? new Date(membership.data.expireDate).toLocaleDateString()
							: '—'}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Купить абонемент</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-6">
					{plans.isPending && (
						<div className="text-sm text-muted-foreground">
							Загрузка тарифов…
						</div>
					)}

					{plans.data?.length ? (
						<>
							<div className="grid gap-3">
								<Label className="text-base">1. Выберите тариф</Label>
								<div className="grid gap-2 sm:grid-cols-2">
									{plans.data.map((p) => {
										const isSelected =
											String(p.id) === String(selectedPlanId);
										return (
											<button
												type="button"
												key={String(p.id)}
												onClick={() => selectPlan(p.id)}
												className={cn(
													'text-left rounded-2xl border p-4 grid gap-2 transition-colors',
													'hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
													isSelected
														? 'border-primary ring-2 ring-primary/20 bg-accent/30'
														: 'border-border'
												)}
											>
												<div className="font-medium">{p.name}</div>
												{p.description ? (
													<div className="text-sm text-muted-foreground line-clamp-3">
														{p.description}
													</div>
												) : null}
												{Number(p.price) > 0 ? (
													<div className="text-sm text-muted-foreground">
														{Number(p.price).toLocaleString('ru-RU')} ₽
													</div>
												) : null}
											</button>
										);
									})}
								</div>
							</div>

							{selectedPlan ? (
								<>
									<Separator />
									<div className="grid gap-3">
										<Label className="text-base">2. Длительность</Label>
										{durationOptions.length > 0 ? (
											<div className="flex flex-wrap gap-2">
												{durationOptions.map((d) => (
													<Button
														key={d}
														type="button"
														variant={
															durationDays === d ? 'default' : 'outline'
														}
														size="sm"
														className="rounded-full"
														onClick={() => setDurationDays(d)}
													>
														{formatDaysRu(d)}
													</Button>
												))}
											</div>
										) : (
											<div className="grid gap-2 max-w-xs">
												<Label htmlFor="durationDays" className="sr-only">
													Дней
												</Label>
												<Input
													id="durationDays"
													type="number"
													min={1}
													value={durationDays}
													onChange={(e) =>
														setDurationDays(
															Number(e.currentTarget.value) || 0
														)
													}
												/>
												<p className="text-xs text-muted-foreground">
													Укажите число дней вручную — для этого тарифа не
													заданы готовые варианты.
												</p>
											</div>
										)}
									</div>

									<Separator />
									<div className="grid gap-4">
										<Label className="text-base">3. Оплата</Label>
										<div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm grid gap-1">
											<div>
												<span className="text-muted-foreground">Тариф:</span>{' '}
												<span className="font-medium">{selectedPlan.name}</span>
											</div>
											<div>
												<span className="text-muted-foreground">Срок:</span>{' '}
												<span className="font-medium">
													{formatDaysRu(durationDays)}
												</span>
											</div>
										</div>
										<Button
											size="lg"
											className="w-full sm:w-auto"
											disabled={!canBuy || buy.isPending}
											onClick={() =>
												selectedPlan &&
												buy.mutate({
													body: {
														planId: selectedPlan.id,
														durationDays,
														method: PaymentMethod.Cash
													}
												})
											}
										>
											Купить абонемент
										</Button>
									</div>
								</>
							) : (
								<p className="text-sm text-muted-foreground">
									Выберите тариф, чтобы указать длительность и перейти к оплате.
								</p>
							)}
						</>
					) : (
						!plans.isPending && (
							<div className="text-sm text-muted-foreground">Тарифов нет</div>
						)
					)}
				</CardContent>
			</Card>
		</div>
	);
}

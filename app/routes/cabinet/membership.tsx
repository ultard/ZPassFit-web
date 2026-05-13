import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import $api from '~/lib/api.client';
import queryClient from '~/lib/query.client';
import { PaymentMethod } from '~/lib/api.types';
import { getErrorMessage } from '~/lib/error-message';
import { formatDaysCountRussian } from '~/lib/format-days-ru';
import {
	computeMembershipPrice,
	formatRubles,
	getMinDuration
} from '~/lib/membership-pricing';
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

function isPaymentMethodEnabled(
	methods: { method: number; enabled: boolean }[] | undefined,
	paymentMethod: PaymentMethod
) {
	return methods?.some((m) => m.method === paymentMethod && m.enabled) ?? false;
}

export default function CabinetMembershipRoute() {
	const membership = $api.useQuery('get', '/client/membership');
	const plans = $api.useQuery('get', '/membership/plans');
	const payMethods = $api.useQuery('get', '/membership/payment-methods');

	const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
	const [durationDays, setDurationDays] = useState(30);
	const [selectedPayMethod, setSelectedPayMethod] =
		useState<PaymentMethod | null>(null);

	const selectedPlan = useMemo(
		() => plans.data?.find((p) => String(p.id) === String(selectedPlanId)),
		[plans.data, selectedPlanId]
	);

	const durationOptions = useMemo(
		() => parsePlanDurations(selectedPlan?.durations),
		[selectedPlan]
	);

	const selectedPrice = useMemo(() => {
		if (!selectedPlan) return 0;
		return computeMembershipPrice(
			Number(selectedPlan.price) || 0,
			(selectedPlan.durations ?? []).map((d) => Number(d)),
			durationDays
		);
	}, [selectedPlan, durationDays]);

	const buy = $api.useMutation('post', '/membership/buy', {
		onSuccess: () => {
			toast.success('Абонемент активирован');
			queryClient.invalidateQueries({
				queryKey: ['get', '/client/membership']
			});
			queryClient.invalidateQueries({ queryKey: ['get', '/client/payments'] });
			queryClient.invalidateQueries({ queryKey: ['get', '/client/profile'] });
		},
		onError: (err) =>
			toast.error(getErrorMessage(err, 'Не удалось купить абонемент'))
	});

	const yookassaCheckout = $api.useMutation(
		'post',
		'/membership/yookassa/checkout',
		{
			onError: (err) =>
				toast.error(getErrorMessage(err, 'Не удалось перейти к оплате ЮKassa'))
		}
	);

	const canBuy =
		Boolean(selectedPlan) && Number.isFinite(durationDays) && durationDays >= 1;

	const methodsList = payMethods.data?.methods;

	type PayOption = {
		method: PaymentMethod;
		label: string;
		hint: string | null | undefined;
		recommended?: boolean;
	};

	const paymentOptions = useMemo((): PayOption[] => {
		if (!methodsList?.length) return [];

		const order: PaymentMethod[] = [
			PaymentMethod.YooKassa,
			PaymentMethod.Balance,
			PaymentMethod.Card,
			PaymentMethod.Cash
		];

		const fallbackLabel = (pm: PaymentMethod) => {
			switch (pm) {
				case PaymentMethod.YooKassa:
					return 'Банковская карта онлайн';
				case PaymentMethod.Balance:
					return 'Баланс в приложении';
				case PaymentMethod.Card:
					return 'Карта на ресепшене';
				case PaymentMethod.Cash:
					return 'Наличные в клубе';
				default:
					return 'Оплата';
			}
		};

		const out: PayOption[] = [];
		for (const pm of order) {
			if (!isPaymentMethodEnabled(methodsList, pm)) continue;
			const row = methodsList.find((m) => m.method === pm);
			out.push({
				method: pm,
				label: row?.displayName?.trim() || fallbackLabel(pm),
				hint: row?.description,
				recommended: pm === PaymentMethod.YooKassa
			});
		}
		return out;
	}, [methodsList]);

	useEffect(() => {
		if (!paymentOptions.length) {
			setSelectedPayMethod(null);
			return;
		}
		setSelectedPayMethod((prev) => {
			if (prev !== null && paymentOptions.some((o) => o.method === prev)) {
				return prev;
			}
			return paymentOptions[0].method;
		});
	}, [paymentOptions]);

	const anyPayMethod =
		paymentOptions.length > 0 || payMethods.isPending || payMethods.isFetching;

	function submitPayment() {
		if (!selectedPlan || selectedPayMethod === null) return;
		if (selectedPayMethod === PaymentMethod.YooKassa) {
			yookassaCheckout.mutate(
				{
					body: {
						planId: selectedPlan.id,
						durationDays
					}
				},
				{
					onSuccess: (res) => {
						window.location.assign(res.confirmationUrl);
					}
				}
			);
			return;
		}
		buy.mutate({
			body: {
				planId: selectedPlan.id,
				durationDays,
				method: selectedPayMethod
			}
		});
	}

	const primaryCtaLabel =
		selectedPayMethod === PaymentMethod.YooKassa
			? 'Перейти к оплате'
			: 'Оформить абонемент';

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
										const isSelected = String(p.id) === String(selectedPlanId);
										const planDurations = parsePlanDurations(p.durations);
										const planPrice = Number(p.price) || 0;
										const minDuration = getMinDuration(planDurations);
										const hasMultipleDurations = planDurations.length > 1;
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
												{planPrice > 0 ? (
													<div className="text-sm text-muted-foreground">
														{hasMultipleDurations ? 'от ' : ''}
														{formatRubles(planPrice)}
														{minDuration > 0
															? ` / ${formatDaysCountRussian(minDuration)}`
															: ''}
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
												{durationOptions.map((d) => {
													const optionPrice = computeMembershipPrice(
														Number(selectedPlan.price) || 0,
														(selectedPlan.durations ?? []).map((x) =>
															Number(x)
														),
														d
													);
													return (
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
															<span>{formatDaysCountRussian(d)}</span>
															{optionPrice > 0 ? (
																<span className="ml-2 opacity-80">
																	· {formatRubles(optionPrice)}
																</span>
															) : null}
														</Button>
													);
												})}
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
														setDurationDays(Number(e.currentTarget.value) || 0)
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
										{payMethods.error && (
											<p className="text-sm text-destructive">
												{getErrorMessage(
													payMethods.error,
													'Не удалось загрузить способы оплаты'
												)}
											</p>
										)}
										{payMethods.isPending || payMethods.isFetching ? (
											<p className="text-sm text-muted-foreground">
												Загрузка способов оплаты…
											</p>
										) : !anyPayMethod ? (
											<p className="text-sm text-muted-foreground">
												Нет доступных способов оплаты. Обратитесь в клуб.
											</p>
										) : (
											<div className="grid gap-4 max-w-lg">
												<p className="text-sm text-muted-foreground">
													Выберите способ оплаты и подтвердите покупку.
												</p>
												<fieldset className="grid gap-2 border-0 p-0 m-0 min-w-0">
													<legend className="sr-only">Способ оплаты</legend>
													{paymentOptions.map((opt) => {
														const selected = selectedPayMethod === opt.method;
														return (
															<label
																key={opt.method}
																className={cn(
																	'text-left rounded-2xl border p-4 transition-colors cursor-pointer',
																	'hover:bg-accent/50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
																	selected
																		? 'border-primary ring-2 ring-primary/20 bg-accent/30'
																		: 'border-border bg-card'
																)}
															>
																<input
																	type="radio"
																	name="cabinet-membership-payment"
																	className="sr-only"
																	checked={selected}
																	onChange={() =>
																		setSelectedPayMethod(opt.method)
																	}
																/>
																<div className="flex gap-3 items-start">
																	<span
																		className={cn(
																			'mt-0.5 h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center',
																			selected
																				? 'border-primary'
																				: 'border-muted-foreground/60'
																		)}
																		aria-hidden
																	>
																		{selected ? (
																			<span className="h-2 w-2 rounded-full bg-primary" />
																		) : null}
																	</span>
																	<div className="grid gap-1 flex-1 min-w-0">
																		<div className="flex flex-wrap items-center gap-2">
																			<span className="font-medium leading-snug">
																				{opt.label}
																			</span>
																			{opt.recommended ? (
																				<span className="text-[10px] uppercase tracking-wide font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary">
																					Удобно
																				</span>
																			) : null}
																		</div>
																		{opt.hint ? (
																			<p className="text-xs text-muted-foreground leading-relaxed">
																				{opt.hint}
																			</p>
																		) : null}
																	</div>
																</div>
															</label>
														);
													})}
												</fieldset>
												{selectedPrice > 0 ? (
													<div className="flex items-baseline justify-between gap-3 rounded-xl bg-muted/40 px-4 py-3">
														<span className="text-sm text-muted-foreground">
															К оплате
														</span>
														<span className="text-lg font-semibold">
															{formatRubles(selectedPrice)}
														</span>
													</div>
												) : null}
												<Button
													size="lg"
													className="w-full sm:max-w-xs"
													disabled={
														!canBuy ||
														selectedPayMethod === null ||
														buy.isPending ||
														yookassaCheckout.isPending
													}
													onClick={submitPayment}
												>
													{primaryCtaLabel}
												</Button>
											</div>
										)}
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

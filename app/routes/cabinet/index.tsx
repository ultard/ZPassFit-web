import {
	RiArrowRightLine,
	RiSparklingLine,
	RiTrophyFill
} from '@remixicon/react';
import { toast } from 'sonner';

import $api from '~/lib/api.client';
import { MembershipStatus } from '~/lib/api.types';
import { getErrorMessage } from '~/lib/error-message';
import { formatDaysCountRussian } from '~/lib/format-days-ru';
import queryClient from '~/lib/query.client';
import { cn } from '~/lib/utils';

import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';

/** API отдаёт int32 как number или string — приводим к number. */
function parseApiInt32(
	value: string | number | null | undefined
): number | null {
	if (value === null || value === undefined) return null;
	const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : value;
	return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Оценка заполнения шкалы: сколько полных дней прошло с получения уровня,
 * относительно суммы (дни на уровне + оставшиеся дни до следующего).
 */
function estimateLevelProgressPercent(
	levelReceivedAtIso: string,
	daysRemainingUntilNext: number | null
): number | null {
	if (daysRemainingUntilNext === null) return null;
	if (daysRemainingUntilNext <= 0) return 100;

	const levelReceivedAtMs = new Date(levelReceivedAtIso).getTime();
	const nowMs = Date.now();
	const millisecondsPerDay = 86_400_000;
	const daysSinceLevelReceived = Math.max(
		0,
		Math.floor((nowMs - levelReceivedAtMs) / millisecondsPerDay)
	);
	const totalDaysInThisStretch =
		daysSinceLevelReceived + daysRemainingUntilNext;
	if (totalDaysInThisStretch <= 0) return null;

	const ratio = daysSinceLevelReceived / totalDaysInThisStretch;
	return Math.min(100, Math.max(0, ratio * 100));
}

function LoyaltyProgressBarTrack({
	progressPercent
}: {
	progressPercent: number | null;
}) {
	const hasKnownProgress = progressPercent !== null;
	const roundedPercent = hasKnownProgress
		? Math.round(progressPercent)
		: undefined;
	const fillWidth = hasKnownProgress ? `${progressPercent}%` : undefined;
	const highlightPosition = hasKnownProgress
		? `clamp(0px, calc(${progressPercent}% - 0.5px), calc(100% - 1px))`
		: '33%';

	return (
		<div
			className="relative h-3 w-full overflow-hidden rounded-full bg-muted ring-1 ring-border/60"
			role="progressbar"
			aria-valuenow={roundedPercent}
			aria-valuemin={0}
			aria-valuemax={100}
			aria-label="Прогресс к следующему уровню"
		>
			<div
				className={cn(
					'h-full rounded-full bg-linear-to-r from-primary/90 via-primary to-emerald-500/90 transition-[width] duration-700 ease-out',
					!hasKnownProgress && 'w-1/3 animate-pulse opacity-60'
				)}
				style={hasKnownProgress ? { width: fillWidth } : undefined}
			/>
			<div
				className="pointer-events-none absolute inset-y-0 w-px bg-white/25 shadow-[2px_0_12px_rgba(255,255,255,0.35)]"
				style={{ left: highlightPosition }}
				aria-hidden
			/>
		</div>
	);
}

function LoyaltyNextLevelStatus({
	nextLevelName,
	daysRemainingUntilNext,
	hasNextLevel
}: {
	nextLevelName: string;
	daysRemainingUntilNext: number | null;
	hasNextLevel: boolean;
}) {
	if (!hasNextLevel) {
		return (
			<p className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 sm:text-sm">
				<RiTrophyFill className="size-4 shrink-0" aria-hidden />
				Вы на максимальном уровне программы
			</p>
		);
	}

	if (daysRemainingUntilNext !== null && daysRemainingUntilNext > 0) {
		return (
			<p className="text-muted-foreground text-right text-xs sm:text-sm">
				До «{nextLevelName}» —{' '}
				<span className="font-medium text-foreground">
					{formatDaysCountRussian(daysRemainingUntilNext)}
				</span>
			</p>
		);
	}

	if (daysRemainingUntilNext === 0) {
		return (
			<p className="text-primary text-xs font-medium sm:text-sm">
				Поздравляем — следующий статус уже близко!
			</p>
		);
	}

	return null;
}

function membershipStatusPresentation(status: number): {
	label: string;
	variant: 'default' | 'secondary' | 'destructive' | 'outline';
} {
	switch (status) {
		case MembershipStatus.Active:
			return { label: 'Активен', variant: 'default' };
		case MembershipStatus.Frozen:
			return { label: 'Заморожен', variant: 'secondary' };
		case MembershipStatus.Expired:
			return { label: 'Истёк', variant: 'destructive' };
		case MembershipStatus.Disabled:
			return { label: 'Отключён', variant: 'outline' };
		default:
			return { label: `Неизвестно (${status})`, variant: 'outline' };
	}
}

function MembershipStatusBadge({ status }: { status: number }) {
	const { label, variant } = membershipStatusPresentation(status);
	return <Badge variant={variant}>{label}</Badge>;
}

function loyaltyMotivationFootnote(
	hasNextLevel: boolean,
	daysRemainingUntilNext: number | null
): string {
	if (!hasNextLevel) {
		return 'Спасибо, что вы с нами на максимальном уровне.';
	}
	if (daysRemainingUntilNext !== null && daysRemainingUntilNext > 0) {
		return 'Чем стабильнее посещения, тем быстрее заполняется шкала.';
	}
	return 'Продолжайте в том же духе.';
}

export default function CabinetOverviewRoute() {
	const clientLevelQuery = $api.useQuery('get', '/client/level');
	const membershipQuery = $api.useQuery('get', '/client/membership');
	const membershipPlansQuery = $api.useQuery('get', '/membership/plans');
	const activeVisitQuery = $api.useQuery('get', '/attendance/visits');

	const checkoutVisit = $api.useMutation('post', '/attendance/checkout', {
		onSuccess: () => {
			toast.success('Посещение завершено');
			queryClient.invalidateQueries({
				queryKey: ['get', '/attendance/visits']
			});
		},
		onError: (err) =>
			toast.error(getErrorMessage(err, 'Не удалось завершить посещение'))
	});

	const currentMembershipPlanName =
		membershipQuery.data && membershipPlansQuery.data
			? membershipPlansQuery.data.find(
					(plan) => String(plan.id) === String(membershipQuery.data.planId)
				)?.name
			: undefined;

	const clientLevel = clientLevelQuery.data;
	const nextLoyaltyLevel = clientLevel?.nextLevel ?? null;
	const daysRemainingUntilNextLevel = parseApiInt32(
		clientLevel?.remainingDaysToNextLevel
	);
	const hasNextLoyaltyLevel = nextLoyaltyLevel !== null;

	let levelProgressPercent: number | null = null;
	if (
		clientLevel &&
		hasNextLoyaltyLevel &&
		daysRemainingUntilNextLevel !== null
	) {
		levelProgressPercent = estimateLevelProgressPercent(
			clientLevel.receiveDate,
			daysRemainingUntilNextLevel
		);
	} else if (clientLevel && !hasNextLoyaltyLevel) {
		levelProgressPercent = 100;
	}

	const nextLevelRequiredActiveDays = hasNextLoyaltyLevel
		? parseApiInt32(nextLoyaltyLevel.activateDays)
		: null;

	const activeVisit = activeVisitQuery.data;
	const hasOpenVisit = Boolean(
		activeVisit?.enterDate && activeVisit.leaveDate == null
	);

	return (
		<div className="grid gap-4 md:grid-cols-2">
			<Card className="relative overflow-hidden border-primary/15 bg-linear-to-br from-primary/8 via-card to-card md:col-span-2">
				<div
					className="pointer-events-none absolute -top-24 right-0 size-56 rounded-full bg-primary/10 blur-3xl"
					aria-hidden
				/>
				<CardHeader className="relative z-10 pb-2">
					<div className="flex flex-wrap items-start justify-between gap-3">
						<div className="space-y-1">
							<CardTitle className="flex items-center gap-2 text-lg">
								<RiSparklingLine
									className="size-5 shrink-0 text-primary"
									aria-hidden
								/>
								Ваш уровень лояльности
							</CardTitle>
							<CardDescription className="max-w-xl text-pretty">
								Регулярные визиты приближают следующий статус: бонусы и
								привилегии становятся выше вместе с уровнем.
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent className="relative z-10 space-y-5">
					{clientLevelQuery.isLoading ? (
						<div className="space-y-3">
							<Skeleton className="h-4 w-2/3 max-w-md" />
							<Skeleton className="h-3 w-full rounded-full" />
							<Skeleton className="h-3 w-5/6 rounded-full" />
						</div>
					) : !clientLevel ? (
						<p className="text-muted-foreground text-sm">
							Не удалось загрузить уровень.
						</p>
					) : (
						<>
							<div className="flex flex-wrap items-center justify-between gap-3 text-sm">
								<div className="flex min-w-0 flex-wrap items-center gap-2">
									<span className="text-muted-foreground shrink-0">Сейчас</span>
									<Badge className="max-w-full truncate font-medium">
										{clientLevel.level.name}
									</Badge>
									{nextLoyaltyLevel ? (
										<>
											<RiArrowRightLine
												className="size-4 shrink-0 text-muted-foreground"
												aria-hidden
											/>
											<span className="text-muted-foreground shrink-0">
												цель
											</span>
											<Badge variant="outline" className="max-w-full truncate">
												{nextLoyaltyLevel.name}
											</Badge>
										</>
									) : null}
								</div>
							</div>

							<div className="space-y-2">
								<LoyaltyProgressBarTrack
									progressPercent={levelProgressPercent}
								/>
								<div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
									<span>
										{loyaltyMotivationFootnote(
											hasNextLoyaltyLevel,
											daysRemainingUntilNextLevel
										)}
									</span>
									{hasNextLoyaltyLevel &&
									nextLevelRequiredActiveDays !== null ? (
										<LoyaltyNextLevelStatus
											hasNextLevel={hasNextLoyaltyLevel}
											nextLevelName={nextLoyaltyLevel?.name ?? ''}
											daysRemainingUntilNext={daysRemainingUntilNextLevel}
										/>
									) : null}
								</div>
							</div>
						</>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Абонемент</CardTitle>
					<CardDescription>Текущий статус</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-1 text-sm">
					<div>
						<span className="text-muted-foreground">Тариф:</span>{' '}
						{currentMembershipPlanName ??
							(membershipQuery.data
								? `#${String(membershipQuery.data.planId)}`
								: '—')}
					</div>
					<div>
						<span className="text-muted-foreground">До:</span>{' '}
						{membershipQuery.data?.expireDate
							? new Date(membershipQuery.data.expireDate).toLocaleDateString()
							: '—'}
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<span className="text-muted-foreground">Статус:</span>
						{membershipQuery.data ? (
							<MembershipStatusBadge status={membershipQuery.data.status} />
						) : (
							'—'
						)}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Посещение</CardTitle>
					<CardDescription>Текущее посещение клуба</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-1 text-sm">
					<div>
						<span className="text-muted-foreground">Вход:</span>{' '}
						{activeVisit?.enterDate
							? new Date(activeVisit.enterDate).toLocaleString()
							: '—'}
					</div>
					<div>
						<span className="text-muted-foreground">Выход:</span>{' '}
						{activeVisit?.leaveDate
							? new Date(activeVisit.leaveDate).toLocaleString()
							: '—'}
					</div>
					<div className="mt-4 flex flex-col gap-2 border-t border-border/60 pt-4">
						<Button
							type="button"
							disabled={!hasOpenVisit || checkoutVisit.isPending}
							onClick={() => checkoutVisit.mutate({})}
						>
							{checkoutVisit.isPending ? 'Завершаем…' : 'Завершить посещение'}
						</Button>
						{!hasOpenVisit ? (
							<p className="text-muted-foreground text-xs">
								Кнопка доступна, когда вы в клубе и посещение ещё не закрыто
								(после входа по QR).
							</p>
						) : null}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

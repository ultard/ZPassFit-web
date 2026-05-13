import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { toast } from 'sonner';

import $api from '~/lib/api.client';
import queryClient from '~/lib/query.client';
import { getErrorMessage } from '~/lib/error-message';

import { Button } from '~/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '~/components/ui/card';

type Phase =
	| 'loading'
	| 'success'
	| 'pending'
	| 'cancelled'
	| 'error'
	| 'no_payment';

export default function MembershipYooKassaReturnRoute() {
	const [searchParams] = useSearchParams();
	const paymentId = searchParams.get('paymentId');

	const [phase, setPhase] = useState<Phase>('loading');
	const [detail, setDetail] = useState<string | null>(null);

	const { mutate, isPending } = $api.useMutation(
		'post',
		'/membership/yookassa/sync/{paymentId}'
	);

	useEffect(() => {
		if (!paymentId) {
			setPhase('no_payment');
			setDetail(
				'В ссылке нет идентификатора платежа. Откройте раздел «Абонемент» в личном кабинете.'
			);
			return;
		}

		setPhase('loading');
		setDetail(null);

		mutate(
			{ params: { path: { paymentId } } },
			{
				onSuccess: (data) => {
					const code = data.code;
					if (code === 'completed' || code === 'already_completed') {
						setPhase('success');
						toast.success('Оплата прошла успешно');
						queryClient.invalidateQueries({
							queryKey: ['get', '/client/membership']
						});
						queryClient.invalidateQueries({
							queryKey: ['get', '/client/payments']
						});
						queryClient.invalidateQueries({
							queryKey: ['get', '/client/profile']
						});
						return;
					}
					if (code === 'still_pending') {
						setPhase('pending');
						setDetail(
							data.message ??
								'Платёж ещё обрабатывается. Подождите минуту и нажмите «Проверить снова».'
						);
						return;
					}
					if (code === 'cancelled' || code === 'already_cancelled') {
						setPhase('cancelled');
						setDetail(data.message ?? null);
						return;
					}
					setPhase('error');
					setDetail(data.message ?? 'Не удалось подтвердить оплату.');
				},
				onError: (err) => {
					setPhase('error');
					setDetail(getErrorMessage(err, 'Ошибка при проверке платежа'));
				}
			}
		);
	}, [paymentId, mutate]);

	return (
		<div className="min-h-dvh flex items-center justify-center p-6 bg-muted/40">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Оплата абонемента</CardTitle>
					<CardDescription>
						{phase === 'loading' && 'Проверяем статус платежа…'}
						{phase === 'success' && 'Готово'}
						{phase === 'pending' && 'Ожидаем подтверждение'}
						{phase === 'cancelled' && 'Платёж не выполнен'}
						{phase === 'error' && 'Что-то пошло не так'}
						{phase === 'no_payment' && 'Нет данных о платеже'}
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4">
					{phase === 'loading' && (
						<p className="text-sm text-muted-foreground">
							Это займёт несколько секунд.
						</p>
					)}
					{phase === 'success' && (
						<p className="text-sm">
							Абонемент активирован. Вы можете вернуться к абонементу или
							истории платежей.
						</p>
					)}
					{(phase === 'pending' ||
						phase === 'error' ||
						phase === 'no_payment') &&
						detail && <p className="text-sm text-muted-foreground">{detail}</p>}
					{phase === 'cancelled' && (
						<p className="text-sm text-muted-foreground">
							{detail ??
								'Оплата отменена или не завершена. Вы можете выбрать тариф и оплатить снова.'}
						</p>
					)}
					<div className="flex flex-wrap gap-2">
						{phase === 'pending' && paymentId ? (
							<Button
								type="button"
								variant="default"
								disabled={isPending}
								onClick={() => {
									setPhase('loading');
									mutate(
										{ params: { path: { paymentId } } },
										{
											onSuccess: (data) => {
												const code = data.code;
												if (
													code === 'completed' ||
													code === 'already_completed'
												) {
													setPhase('success');
													toast.success('Оплата прошла успешно');
													queryClient.invalidateQueries({
														queryKey: ['get', '/client/membership']
													});
													queryClient.invalidateQueries({
														queryKey: ['get', '/client/payments']
													});
													queryClient.invalidateQueries({
														queryKey: ['get', '/client/profile']
													});
													return;
												}
												if (code === 'still_pending') {
													setPhase('pending');
													setDetail(
														data.message ?? 'Платёж ещё обрабатывается.'
													);
													return;
												}
												setPhase('pending');
												setDetail(
													data.message ?? 'Статус пока не подтверждён.'
												);
											},
											onError: (err) => {
												setPhase('error');
												setDetail(
													getErrorMessage(err, 'Ошибка при проверке платежа')
												);
											}
										}
									);
								}}
							>
								Проверить снова
							</Button>
						) : null}
						<Button type="button" variant="outline" asChild>
							<Link to="/cabinet/membership">К абонементу</Link>
						</Button>
						<Button type="button" variant="ghost" asChild>
							<Link to="/cabinet/payments">Платежи</Link>
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

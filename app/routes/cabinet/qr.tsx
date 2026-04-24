import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import $api from '~/lib/api.client';
import { getErrorMessage } from '~/lib/error-message';

import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';

function msUntil(dateIso: string, now: number) {
	const t = new Date(dateIso).getTime();
	return Number.isFinite(t) ? t - now : 0;
}

export default function CabinetQrRoute() {
	const [now, setNow] = useState(() => Date.now());
	const qrSession = $api.useMutation('post', '/attendance/qr_session', {
		onError: (err) =>
			toast.error(getErrorMessage(err, 'Не удалось создать QR-сессию'))
	});

	useEffect(() => {
		const id = window.setInterval(() => setNow(Date.now()), 1000);
		return () => window.clearInterval(id);
	}, []);

	const token = qrSession.data?.token;
	const expireDate = qrSession.data?.expireDate;
	const msLeft = expireDate ? msUntil(expireDate, now) : 0;
	const secondsLeft = Math.max(0, Math.floor(msLeft / 1000));
	const expired = Boolean(expireDate && msLeft <= 0);

	return (
		<Card>
			<CardHeader>
				<CardTitle>QR для входа</CardTitle>
			</CardHeader>
			<CardContent className="grid gap-4">
				<div className="flex flex-wrap items-center gap-2">
					<Button
						onClick={() => qrSession.mutate({})}
						disabled={qrSession.isPending}
					>
						{qrSession.isPending
							? 'Создаём…'
							: token
								? 'Сгенерировать заново'
								: 'Сгенерировать'}
					</Button>
					{expireDate && (
						<div className="text-sm text-muted-foreground">
							{expired ? 'Истёк' : `Действует ещё: ${secondsLeft}s`}
						</div>
					)}
				</div>

				{token ? (
					<div className="grid gap-3 place-items-center">
						<div className="rounded-2xl border border-border bg-background p-4">
							<QRCodeSVG value={token} size={220} />
						</div>
						<div className="text-xs text-muted-foreground break-all text-center max-w-lg">
							{token}
						</div>
						{expired && (
							<div className="text-sm text-destructive">
								QR-сессия истекла. Сгенерируйте новую.
							</div>
						)}
					</div>
				) : (
					<div className="text-sm text-muted-foreground">
						Нажмите «Сгенерировать» и покажите QR на ресепшене.
					</div>
				)}
			</CardContent>
		</Card>
	);
}

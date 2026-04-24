import { BrowserMultiFormatReader } from '@zxing/browser';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import $api from '~/lib/api.client';
import { getErrorMessage } from '~/lib/error-message';

import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';

function extractUuid(text: string): string | null {
	const uuidRegex =
		/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
	const m = text.match(uuidRegex);
	return m?.[0] ?? null;
}

export default function AdminScanRoute() {
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const [token, setToken] = useState('');
	const [scanning, setScanning] = useState(false);

	const checkin = $api.useMutation('post', '/attendance/checkin/{token}', {
		onSuccess: () => toast.success('Посещение открыто'),
		onError: (err) =>
			toast.error(getErrorMessage(err, 'Не удалось выполнить check-in'))
	});

	useEffect(() => {
		if (!scanning) return;

		const reader = new BrowserMultiFormatReader();
		let stopped = false;
		let stopScan: (() => void) | null = null;

		(async () => {
			try {
				const devices = await BrowserMultiFormatReader.listVideoInputDevices();
				const deviceId = devices[0]?.deviceId;
				if (!videoRef.current) return;

				const controls = await reader.decodeFromVideoDevice(
					deviceId,
					videoRef.current,
					(result, error) => {
						if (stopped) return;
						if (result) {
							const raw = result.getText();
							const uuid = extractUuid(raw);
							if (uuid) {
								setToken(uuid);
								setScanning(false);
								checkin.mutate({ params: { path: { token: uuid } } });
							} else {
								toast.error('Не удалось распознать token (uuid)');
							}
						}
						if (error) {
							// ignore scan noise
						}
					}
				);
				stopScan = () => controls.stop();
			} catch {
				toast.error('Нет доступа к камере');
				setScanning(false);
			}
		})();

		return () => {
			stopped = true;
			stopScan?.();
		};
	}, [scanning, checkin]);

	return (
		<div className="grid gap-4">
			<Card>
				<CardHeader>
					<CardTitle>Сканирование QR</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-4">
					<div className="flex flex-wrap items-center gap-2">
						<Button
							variant={scanning ? 'secondary' : 'default'}
							onClick={() => setScanning((v) => !v)}
						>
							{scanning ? 'Остановить' : 'Начать сканирование'}
						</Button>
						<Button
							variant="outline"
							disabled={!token || checkin.isPending}
							onClick={() => checkin.mutate({ params: { path: { token } } })}
						>
							Проверить токен
						</Button>
					</div>

					{scanning && (
						<div className="rounded-2xl border border-border overflow-hidden bg-black">
							{/* biome-ignore lint/a11y/useMediaCaption: Camera preview for QR scanning does not require captions. */}
							<video
								ref={videoRef}
								className="w-full max-h-[360px] object-contain"
							/>
						</div>
					)}

					<div className="grid gap-2 max-w-lg">
						<Label htmlFor="token">Token (uuid)</Label>
						<Input
							id="token"
							value={token}
							onChange={(e) => setToken(e.currentTarget.value)}
							placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
						/>
					</div>

					{checkin.data && (
						<Card className="border-emerald-600/30">
							<CardHeader>
								<CardTitle className="text-base">Результат</CardTitle>
							</CardHeader>
							<CardContent className="text-sm grid gap-1">
								<div>
									<span className="text-muted-foreground">Вход:</span>{' '}
									{new Date(checkin.data.enterDate).toLocaleString()}
								</div>
								<div>
									<span className="text-muted-foreground">Клиент:</span>{' '}
									{checkin.data.clientId}
								</div>
							</CardContent>
						</Card>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

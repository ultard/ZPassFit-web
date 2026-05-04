import { Link, Navigate, Outlet, useLocation } from 'react-router';

import $api from '~/lib/api.client';

import { Button } from '~/components/ui/button';

import { useAuthStore } from '~/store/auth.store';

const links = [
	{ to: '/cabinet', label: 'Обзор' },
	{ to: '/cabinet/qr', label: 'QR' },
	{ to: '/cabinet/membership', label: 'Абонемент' },
	{ to: '/cabinet/visits', label: 'Посещения' },
	{ to: '/cabinet/payments', label: 'Платежи' },
	{ to: '/cabinet/settings', label: 'Настройки' }
] as const;

export default function CabinetLayout() {
	const accessToken = useAuthStore((s) => s.accessToken);
	const location = useLocation();
	const profile = $api.useQuery('get', '/client/profile', {
		enabled: Boolean(accessToken)
	});

	if (!accessToken) {
		return (
			<Navigate to="/auth/login" replace state={{ from: location.pathname }} />
		);
	}

	return (
		<div className="min-h-dvh">
			<header className="border-b border-border">
				<div className="container mx-auto px-4 min-h-14 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2 md:py-0 md:h-14">
					<div className="font-semibold">ZPassFit</div>
					<div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
						<div className="text-sm tabular-nums" aria-live="polite">
							{profile.isPending ? (
								<span className="text-muted-foreground">Баланс…</span>
							) : profile.data ? (
								<>
									<span className="text-muted-foreground">Баланс </span>
									<span className="font-medium">
										{Number(profile.data.balance).toLocaleString('ru-RU')} ₽
									</span>
								</>
							) : null}
						</div>
						<nav className="hidden md:flex items-center gap-2">
							{links.map((l) => (
								<Button asChild key={l.to} variant="ghost" size="sm">
									<Link to={l.to}>{l.label}</Link>
								</Button>
							))}
						</nav>
					</div>
				</div>
			</header>

			<main className="container mx-auto px-4 py-6">
				<Outlet />
			</main>
		</div>
	);
}

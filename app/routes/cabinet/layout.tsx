import { Link, Navigate, Outlet, useLocation } from 'react-router';

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

	if (!accessToken) {
		return (
			<Navigate to="/auth/login" replace state={{ from: location.pathname }} />
		);
	}

	return (
		<div className="min-h-dvh">
			<header className="border-b border-border">
				<div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">
					<div className="font-semibold">ZPassFit</div>
					<nav className="hidden md:flex items-center gap-2">
						{links.map((l) => (
							<Button asChild key={l.to} variant="ghost" size="sm">
								<Link to={l.to}>{l.label}</Link>
							</Button>
						))}
					</nav>
				</div>
			</header>

			<main className="container mx-auto px-4 py-6">
				<Outlet />
			</main>
		</div>
	);
}

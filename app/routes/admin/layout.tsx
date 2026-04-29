import {
	RiBarChartLine,
	RiCalendarCheckLine,
	RiFileList3Line,
	RiGiftLine,
	RiPriceTag3Line,
	RiQrScan2Line,
	RiTicket2Line,
	RiTrophyLine,
	RiUser3Line
} from '@remixicon/react';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';

import $api from '~/lib/api.client';
import queryClient from '~/lib/query.client';

import { Button } from '~/components/ui/button';
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarRail,
	SidebarTrigger
} from '~/components/ui/sidebar';

import { clearTokens, getRefreshToken, useAuthStore } from '~/store/auth.store';

const links = [
	{ to: '/admin', label: 'Аналитика', Icon: RiBarChartLine },
	{
		to: '/admin/audit',
		label: 'Аудит',
		Icon: RiFileList3Line,
		adminOnly: true
	},
	{ to: '/admin/scan', label: 'Скан QR', Icon: RiQrScan2Line },
	{ to: '/admin/clients', label: 'Клиенты', Icon: RiUser3Line },
	{ to: '/admin/visits', label: 'Посещения', Icon: RiCalendarCheckLine },
	{ to: '/admin/memberships', label: 'Абонементы', Icon: RiTicket2Line },
	{ to: '/admin/membership-plans', label: 'Тарифы', Icon: RiPriceTag3Line },
	{ to: '/admin/levels', label: 'Уровни', Icon: RiTrophyLine },
	{ to: '/admin/bonuses', label: 'Бонусы', Icon: RiGiftLine }
];

export default function AdminLayout() {
	const accessToken = useAuthStore((s) => s.accessToken);
	const isAdmin = useAuthStore((s) => s.isAdmin());
	const location = useLocation();
	const navigate = useNavigate();

	const logout = $api.useMutation('post', '/auth/logout', {
		onSuccess: () => {
			clearTokens();
			queryClient.clear();
			toast.success('Вы вышли из системы');
			navigate('/auth/login', { replace: true });
		},
		onError: () => {
			clearTokens();
			queryClient.clear();
			navigate('/auth/login', { replace: true });
		}
	});

	if (!accessToken) {
		return (
			<Navigate to="/auth/login" replace state={{ from: location.pathname }} />
		);
	}

	return (
		<SidebarProvider>
			<Sidebar collapsible="icon">
				<div className="flex h-14 items-center px-3 font-semibold">
					ZPassFit
				</div>

				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupLabel>Разделы</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{links
									.filter((l) => !l.adminOnly || isAdmin)
									.map((l) => {
										const isActive =
											location.pathname === l.to ||
											(l.to !== '/admin' &&
												location.pathname.startsWith(`${l.to}/`));
										const Icon = l.Icon;

										return (
											<SidebarMenuItem key={l.to}>
												<SidebarMenuButton asChild isActive={isActive}>
													<Link to={l.to}>
														<Icon />
														<span>{l.label}</span>
													</Link>
												</SidebarMenuButton>
											</SidebarMenuItem>
										);
									})}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>

				<SidebarRail />
			</Sidebar>

			<SidebarInset>
				<header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 backdrop-blur">
					<div className="flex min-w-0 items-center gap-2">
						<SidebarTrigger className="-ml-2 md:hidden" />
						<div className="font-semibold truncate">Admin</div>
					</div>

					<Button
						variant="outline"
						size="sm"
						disabled={logout.isPending}
						onClick={() => {
							const refreshToken = getRefreshToken();
							logout.mutate({ body: refreshToken ? { refreshToken } : null });
						}}
					>
						{logout.isPending ? 'Выходим…' : 'Выйти'}
					</Button>
				</header>

				<div className="container mx-auto flex-1 px-4 py-6">
					<Outlet />
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}

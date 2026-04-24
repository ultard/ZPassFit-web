import {
	RiBarChartLine,
	RiCalendarCheckLine,
	RiGiftLine,
	RiPriceTag3Line,
	RiQrScan2Line,
	RiTicket2Line,
	RiTrophyLine,
	RiUser3Line
} from '@remixicon/react';
import { Link, Navigate, Outlet, useLocation } from 'react-router';

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

import { useAuthStore } from '~/store/auth.store';

const links = [
	{ to: '/admin', label: 'Аналитика', Icon: RiBarChartLine },
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
	const location = useLocation();

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
								{links.map((l) => {
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
				<header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur">
					<SidebarTrigger className="-ml-2 md:hidden" />
					<div className="font-semibold">Admin</div>
				</header>

				<div className="container mx-auto flex-1 px-4 py-6">
					<Outlet />
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}

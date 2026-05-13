import { index, type RouteConfig, route } from '@react-router/dev/routes';

export default [
	index('routes/index.tsx'),
	route('auth', 'routes/auth/layout.tsx', [
		route('login', 'routes/auth/login.tsx'),
		route('register', 'routes/auth/register.tsx')
	]),
	route('membership/yookassa-return', 'routes/membership-yookassa-return.tsx'),
	route('cabinet', 'routes/cabinet/layout.tsx', [
		index('routes/cabinet/index.tsx'),
		route('qr', 'routes/cabinet/qr.tsx'),
		route('visits', 'routes/cabinet/visits.tsx'),
		route('payments', 'routes/cabinet/payments.tsx'),
		route('membership', 'routes/cabinet/membership.tsx'),
		route('settings', 'routes/cabinet/settings.tsx')
	]),
	route('admin', 'routes/admin/layout.tsx', [
		index('routes/admin/index.tsx'),
		route('audit', 'routes/admin/audit.tsx'),
		route('scan', 'routes/admin/scan.tsx'),
		route('clients', 'routes/admin/clients.tsx'),
		route('clients/:id', 'routes/admin/client.tsx'),
		route('visits', 'routes/admin/visits.tsx'),
		route('memberships', 'routes/admin/memberships.tsx'),
		route('memberships/:id', 'routes/admin/membership.tsx'),
		route('membership-plans', 'routes/admin/membership-plans.tsx'),
		route('membership-plans/new', 'routes/admin/membership-plan-new.tsx'),
		route('membership-plans/:id', 'routes/admin/membership-plan.tsx'),
		route('levels', 'routes/admin/levels.tsx'),
		route('levels/new', 'routes/admin/level-new.tsx'),
		route('levels/:id', 'routes/admin/level.tsx'),
		route('bonuses', 'routes/admin/bonuses.tsx')
	])
] satisfies RouteConfig;

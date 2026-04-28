import { Navigate } from 'react-router';

import { useAuthStore } from '~/store/auth.store';

export default function IndexRoute() {
	const accessToken = useAuthStore((s) => s.accessToken);
	const isAdmin = useAuthStore((s) => s.isAdmin());
	const isEmployee = useAuthStore((s) => s.isEmployee());

	if (!accessToken) return <Navigate to="/auth/login" replace />;
	return <Navigate to={isAdmin || isEmployee ? '/admin' : '/cabinet'} replace />;
}

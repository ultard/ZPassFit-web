import { Navigate } from 'react-router';

import { useAuthStore } from '~/store/auth.store';

export default function IndexRoute() {
	const accessToken = useAuthStore((s) => s.accessToken);
	return <Navigate to={accessToken ? '/cabinet' : '/auth/login'} replace />;
}

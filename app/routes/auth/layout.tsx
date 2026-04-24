import { Outlet } from 'react-router';

export default function AuthLayout() {
	return (
		<div className="min-h-dvh flex items-center justify-center p-6">
			<div className="w-full max-w-md">
				<Outlet />
			</div>
		</div>
	);
}

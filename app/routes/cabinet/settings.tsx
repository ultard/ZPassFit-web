import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import $api from '~/lib/api.client';
import queryClient from '~/lib/query.client';

import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';

import { clearTokens, getRefreshToken } from '~/store/auth.store';

export default function CabinetSettingsRoute() {
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

	return (
		<Card>
			<CardHeader>
				<CardTitle>Настройки</CardTitle>
			</CardHeader>
			<CardContent className="grid gap-3">
				<Button
					variant="destructive"
					disabled={logout.isPending}
					onClick={() => {
						const refreshToken = getRefreshToken();
						logout.mutate({ body: refreshToken ? { refreshToken } : null });
					}}
				>
					{logout.isPending ? 'Выходим…' : 'Выйти'}
				</Button>
			</CardContent>
		</Card>
	);
}

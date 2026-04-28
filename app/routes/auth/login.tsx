import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';

import $api from '~/lib/api.client';
import { getErrorMessage } from '~/lib/error-message';

import { Button } from '~/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';

import { setTokens, useAuthStore } from '~/store/auth.store';

export default function LoginRoute() {
	const navigate = useNavigate();
	const location = useLocation();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');

	const from = (location.state as { from?: string } | null)?.from;

	function resolvePostLoginRedirect() {
		const state = useAuthStore.getState();
		const home = state.isAdmin() || state.isEmployee() ? '/admin' : '/cabinet';

		if (typeof from !== 'string' || !from.startsWith('/')) return home;

		if (from.startsWith('/admin')) return home === '/admin' ? from : home;
		if (from.startsWith('/cabinet')) return home === '/cabinet' ? from : home;

		return from;
	}

	const login = $api.useMutation('post', '/auth/login', {
		onSuccess: (data) => {
			setTokens({
				accessToken: data.accessToken,
				refreshToken: data.refreshToken
			});
			toast.success('Вы вошли в систему');
			navigate(resolvePostLoginRedirect(), { replace: true });
		},
		onError: (err) => {
			toast.error(getErrorMessage(err, 'Не удалось войти'));
		}
	});

	return (
		<Card>
			<CardHeader>
				<CardTitle>Вход</CardTitle>
				<CardDescription>Используйте email и пароль</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					className="grid gap-4"
					onSubmit={(e) => {
						e.preventDefault();
						login.mutate({ body: { email, password } });
					}}
				>
					<div className="grid gap-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							autoComplete="email"
							value={email}
							onChange={(e) => setEmail(e.currentTarget.value)}
							required
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="password">Пароль</Label>
						<Input
							id="password"
							type="password"
							autoComplete="current-password"
							value={password}
							onChange={(e) => setPassword(e.currentTarget.value)}
							required
						/>
					</div>
					<Button type="submit" disabled={login.isPending}>
						{login.isPending ? 'Входим…' : 'Войти'}
					</Button>

					<div className="text-sm text-muted-foreground">
						Нет аккаунта?{' '}
						<Link
							to="/auth/register"
							className="text-primary underline underline-offset-4"
						>
							Зарегистрироваться
						</Link>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}

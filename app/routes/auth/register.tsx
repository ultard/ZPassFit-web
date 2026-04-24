import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';

import $api from '~/lib/api.client';
import { ClientGender, type IdentityError } from '~/lib/api.types';
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

function getRegisterErrors(err: unknown): string[] {
	if (Array.isArray(err)) {
		const items = err as IdentityError[];
		const messages = items
			.map((e) => e.description?.trim())
			.filter((m): m is string => Boolean(m));
		if (messages.length) return messages;
	}

	if (err && typeof err === 'object') {
		const maybe = err as {
			errors?: unknown;
			detail?: string | null;
			title?: string | null;
		};

		if (Array.isArray(maybe.errors)) {
			const items = maybe.errors as IdentityError[];
			const messages = items
				.map((e) => e.description?.trim())
				.filter((m): m is string => Boolean(m));
			if (messages.length) return messages;
		}

		const msg = getErrorMessage(err, '');
		if (msg) return [msg];
	}

	return ['Не удалось зарегистрироваться'];
}

export default function RegisterRoute() {
	const navigate = useNavigate();
	const [lastName, setLastName] = useState('');
	const [firstName, setFirstName] = useState('');
	const [middleName, setMiddleName] = useState('');
	const [phone, setPhone] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [birthDate, setBirthDate] = useState('1990-01-01');
	const [gender, setGender] = useState<ClientGender>(ClientGender.Male);
	const [formError, setFormError] = useState<string[] | null>(null);

	const register = $api.useMutation('post', '/auth/register', {
		onSuccess: () => {
			setFormError(null);
			toast.success(
				'Регистрация отправлена. Дождитесь подтверждения администратора.'
			);
			navigate('/auth/login', { replace: true });
		},
		onError: (err) => {
			const errors = getRegisterErrors(err);
			setFormError(errors);
			toast.error('Не удалось зарегистрироваться', {
				description: errors.join('\n')
			});
		}
	});

	return (
		<Card>
			<CardHeader>
				<CardTitle>Регистрация</CardTitle>
				<CardDescription>Создайте аккаунт клиента</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					className="grid gap-4"
					onSubmit={(e) => {
						e.preventDefault();
						setFormError(null);
						register.mutate({
							body: {
								lastName,
								firstName,
								middleName,
								birthDate: new Date(`${birthDate}T00:00:00.000Z`).toISOString(),
								gender,
								phone,
								email,
								password
							}
						});
					}}
				>
					<div className="grid gap-2">
						<Label htmlFor="lastName">Фамилия</Label>
						<Input
							id="lastName"
							value={lastName}
							onChange={(e) => setLastName(e.currentTarget.value)}
							required
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="firstName">Имя</Label>
						<Input
							id="firstName"
							value={firstName}
							onChange={(e) => setFirstName(e.currentTarget.value)}
							required
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="middleName">Отчество</Label>
						<Input
							id="middleName"
							value={middleName}
							onChange={(e) => setMiddleName(e.currentTarget.value)}
							required
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="birthDate">Дата рождения</Label>
						<Input
							id="birthDate"
							type="date"
							value={birthDate}
							onChange={(e) => setBirthDate(e.currentTarget.value)}
							required
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="gender">Пол</Label>
						<select
							id="gender"
							value={String(gender)}
							onChange={(e) =>
								setGender(Number(e.currentTarget.value) as ClientGender)
							}
							className="h-9 w-full rounded-4xl border border-input bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
						>
							<option value={ClientGender.Male}>Мужчина</option>
							<option value={ClientGender.Female}>Женщина</option>
						</select>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="phone">Телефон</Label>
						<Input
							id="phone"
							value={phone}
							onChange={(e) => setPhone(e.currentTarget.value)}
							required
						/>
					</div>
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
							autoComplete="new-password"
							value={password}
							onChange={(e) => setPassword(e.currentTarget.value)}
							required
						/>
					</div>
					<Button type="submit" disabled={register.isPending}>
						{register.isPending ? 'Создаём…' : 'Зарегистрироваться'}
					</Button>

					{formError?.length ? (
						<div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
							<div className="font-medium">Ошибки</div>
							<ul className="list-disc pl-5 mt-2 grid gap-1">
								{formError.map((e) => (
									<li key={e}>{e}</li>
								))}
							</ul>
						</div>
					) : null}

					<div className="text-sm text-muted-foreground">
						Уже есть аккаунт?{' '}
						<Link
							to="/auth/login"
							className="text-primary underline underline-offset-4"
						>
							Войти
						</Link>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}

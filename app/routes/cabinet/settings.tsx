import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import $api from '~/lib/api.client';
import queryClient from '~/lib/query.client';
import { ClientGender } from '~/lib/api.types';
import { getErrorMessage } from '~/lib/error-message';

import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';

import { clearTokens, getRefreshToken } from '~/store/auth.store';

function birthDateToInputValue(iso: string): string {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '';
	return d.toISOString().slice(0, 10);
}

export default function CabinetSettingsRoute() {
	const navigate = useNavigate();

	const profile = $api.useQuery('get', '/client/profile');

	const [lastName, setLastName] = useState('');
	const [firstName, setFirstName] = useState('');
	const [middleName, setMiddleName] = useState('');
	const [birthDate, setBirthDate] = useState('');
	const [gender, setGender] = useState<ClientGender>(ClientGender.Unknown);

	useEffect(() => {
		if (!profile.data) return;
		setLastName(profile.data.lastName);
		setFirstName(profile.data.firstName);
		setMiddleName(profile.data.middleName);
		setBirthDate(birthDateToInputValue(profile.data.birthDate));
		setGender(profile.data.gender as ClientGender);
	}, [profile.data]);

	const updateProfile = $api.useMutation('put', '/client/profile', {
		onSuccess: async () => {
			toast.success('Профиль сохранён');
			await queryClient.invalidateQueries({
				queryKey: ['get', '/client/profile']
			});
		},
		onError: (e) =>
			toast.error(getErrorMessage(e, 'Не удалось сохранить профиль'))
	});

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

	const canSave =
		Boolean(
			lastName.trim() && firstName.trim() && middleName.trim() && birthDate
		) &&
		!updateProfile.isPending &&
		!profile.isPending;

	return (
		<div className="grid gap-4 max-w-lg">
			<Card>
				<CardHeader>
					<CardTitle>Личные данные</CardTitle>
				</CardHeader>
				<CardContent>
					{profile.isPending ? (
						<p className="text-sm text-muted-foreground">Загрузка…</p>
					) : profile.error ? (
						<p className="text-sm text-destructive">
							{getErrorMessage(profile.error, 'Не удалось загрузить профиль')}
						</p>
					) : (
						<form
							className="grid gap-4"
							onSubmit={(e) => {
								e.preventDefault();
								if (!canSave) return;
								updateProfile.mutate({
									body: {
										lastName: lastName.trim(),
										firstName: firstName.trim(),
										middleName: middleName.trim(),
										birthDate: new Date(
											`${birthDate}T00:00:00.000Z`
										).toISOString(),
										gender
									}
								});
							}}
						>
							<div className="grid gap-2">
								<Label htmlFor="settings-lastName">Фамилия</Label>
								<Input
									id="settings-lastName"
									value={lastName}
									onChange={(e) => setLastName(e.target.value)}
									autoComplete="family-name"
									maxLength={100}
									required
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="settings-firstName">Имя</Label>
								<Input
									id="settings-firstName"
									value={firstName}
									onChange={(e) => setFirstName(e.target.value)}
									autoComplete="given-name"
									maxLength={100}
									required
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="settings-middleName">Отчество</Label>
								<Input
									id="settings-middleName"
									value={middleName}
									onChange={(e) => setMiddleName(e.target.value)}
									autoComplete="additional-name"
									maxLength={100}
									required
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="settings-birthDate">Дата рождения</Label>
								<Input
									id="settings-birthDate"
									type="date"
									value={birthDate}
									onChange={(e) => setBirthDate(e.target.value)}
									required
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="settings-gender">Пол</Label>
								<select
									id="settings-gender"
									value={String(gender)}
									onChange={(e) =>
										setGender(Number(e.target.value) as ClientGender)
									}
									className="h-9 w-full rounded-4xl border border-input bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
								>
									<option value={ClientGender.Male}>Мужчина</option>
									<option value={ClientGender.Female}>Женщина</option>
									<option value={ClientGender.Unknown}>Не указано</option>
								</select>
							</div>
							<Button type="submit" disabled={!canSave}>
								{updateProfile.isPending ? 'Сохраняем…' : 'Сохранить'}
							</Button>
						</form>
					)}
				</CardContent>
			</Card>

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
		</div>
	);
}

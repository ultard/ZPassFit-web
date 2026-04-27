import { useParams } from 'react-router';
import { toast } from 'sonner';

import $api from '~/lib/api.client';
import queryClient from '~/lib/query.client';
import { ClientStatus } from '~/lib/api.types';
import { getErrorMessage } from '~/lib/error-message';

import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';

export default function AdminClientRoute() {
	const params = useParams();
	const id = params.id ?? '';

	const client = $api.useQuery(
		'get',
		'/dashboard/clients/{id}',
		{
			params: { path: { id } }
		},
		{ enabled: Boolean(id) }
	);

	const approve = $api.useMutation('post', '/dashboard/clients/{id}/approve', {
		onSuccess: async () => {
			toast.success('Клиент подтверждён');
			await queryClient.invalidateQueries({
				queryKey: ['get', '/dashboard/clients']
			});
			await queryClient.invalidateQueries({
				queryKey: [
					'get',
					'/dashboard/clients/{id}',
					{ params: { path: { id } } }
				]
			});
		},
		onError: (e) =>
			toast.error(getErrorMessage(e, 'Не удалось подтвердить клиента'))
	});

	const block = $api.useMutation('post', '/dashboard/clients/{id}/block', {
		onSuccess: async () => {
			toast.success('Клиент заблокирован');
			await queryClient.invalidateQueries({
				queryKey: ['get', '/dashboard/clients']
			});
			await queryClient.invalidateQueries({
				queryKey: [
					'get',
					'/dashboard/clients/{id}',
					{ params: { path: { id } } }
				]
			});
		},
		onError: (e) =>
			toast.error(getErrorMessage(e, 'Не удалось заблокировать клиента'))
	});

	const unblock = $api.useMutation('post', '/dashboard/clients/{id}/unblock', {
		onSuccess: async () => {
			toast.success('Клиент разблокирован');
			await queryClient.invalidateQueries({
				queryKey: ['get', '/dashboard/clients']
			});
			await queryClient.invalidateQueries({
				queryKey: [
					'get',
					'/dashboard/clients/{id}',
					{ params: { path: { id } } }
				]
			});
		},
		onError: (e) =>
			toast.error(getErrorMessage(e, 'Не удалось разблокировать клиента'))
	});

	return (
		<Card>
			<CardHeader className="flex-row items-center justify-between gap-4">
				<CardTitle>Клиент</CardTitle>
				<div className="flex flex-wrap gap-2">
					{client.data?.status === ClientStatus.Pending && (
						<Button
							variant="secondary"
							disabled={approve.isPending}
							onClick={() => id && approve.mutate({ params: { path: { id } } })}
						>
							Подтвердить
						</Button>
					)}
					{client.data?.status === ClientStatus.Active && (
						<Button
							variant="destructive"
							disabled={block.isPending}
							onClick={() => id && block.mutate({ params: { path: { id } } })}
						>
							Заблокировать
						</Button>
					)}
					{client.data?.status === ClientStatus.Blocked && (
						<Button
							variant="outline"
							disabled={unblock.isPending}
							onClick={() => id && unblock.mutate({ params: { path: { id } } })}
						>
							Разблокировать
						</Button>
					)}
				</div>
			</CardHeader>
			<CardContent className="grid gap-2 text-sm">
				{client.isPending && (
					<div className="text-muted-foreground">Загрузка…</div>
				)}
				{client.error && (
					<div className="text-destructive">
						{getErrorMessage(client.error, 'Не удалось загрузить клиента')}
					</div>
				)}
				{!client.isPending && !client.data && !client.error && (
					<div className="text-muted-foreground">Клиент не найден</div>
				)}
				{client.data && (
					<div className="grid gap-1">
						<div>
							<span className="text-muted-foreground">ФИО:</span>{' '}
							{client.data.lastName} {client.data.firstName}{' '}
							{client.data.middleName}
						</div>
						<div>
							<span className="text-muted-foreground">Email:</span>{' '}
							{client.data.email}
						</div>
						<div>
							<span className="text-muted-foreground">Телефон:</span>{' '}
							{client.data.phone}
						</div>
						<div>
							<span className="text-muted-foreground">Статус:</span>{' '}
							{String(client.data.status)}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

import { useMemo } from 'react';
import { useSearchParams } from 'react-router';

import $api from '~/lib/api.client';
import { getErrorMessage } from '~/lib/error-message';
import { useAuthStore } from '~/store/auth.store';

import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '~/components/ui/table';

function toIsoOrUndefined(value: string | null) {
	if (!value) return undefined;
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return undefined;
	return d.toISOString();
}

function fmtDate(value: string) {
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return value;
	return d.toLocaleString();
}

export default function AdminAuditRoute() {
	const isAdmin = useAuthStore((s) => s.isAdmin());
	const [searchParams, setSearchParams] = useSearchParams();

	if (!isAdmin) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Нет доступа</CardTitle>
				</CardHeader>
				<CardContent className="text-sm text-muted-foreground">
					У вас нет прав для просмотра журнала аудита.
				</CardContent>
			</Card>
		);
	}

	const from = searchParams.get('from') ?? '';
	const to = searchParams.get('to') ?? '';
	const action = searchParams.get('action') ?? '';
	const entityType = searchParams.get('entityType') ?? '';
	const page = Number(searchParams.get('page') ?? 1);
	const pageSize = Number(searchParams.get('pageSize') ?? 20);

	const query = useMemo(
		() => ({
			fromUtc: toIsoOrUndefined(from),
			toUtc: toIsoOrUndefined(to),
			action: action.trim() ? action.trim() : undefined,
			entityType: entityType.trim() ? entityType.trim() : undefined,
			page: Number.isFinite(page) && page > 0 ? page : 1,
			pageSize:
				Number.isFinite(pageSize) && pageSize > 0 && pageSize <= 200
					? pageSize
					: 20
		}),
		[from, to, action, entityType, page, pageSize]
	);

	const audit = $api.useQuery('get', '/audit', {
		params: { query }
	});

	if (audit.error) {
		const status = (audit.error as { status?: number | string | null }).status;
		if (String(status) === '403') {
			return (
				<Card>
					<CardHeader>
						<CardTitle>Нет доступа</CardTitle>
					</CardHeader>
					<CardContent className="text-sm text-muted-foreground">
						У вас нет прав для просмотра журнала аудита.
					</CardContent>
				</Card>
			);
		}
	}

	const items = audit.data?.items ?? [];
	const totalCount = audit.data?.totalCount ?? 0;
	const totalPages = Math.max(
		1,
		Math.ceil(Number(totalCount) / (query.pageSize ?? 20))
	);

	return (
		<div className="grid gap-4">
			<Card>
				<CardHeader>
					<CardTitle>Аудит</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-4">
					<div className="grid gap-3 md:grid-cols-5">
						<div className="grid gap-2">
							<Label htmlFor="from">С</Label>
							<Input
								id="from"
								type="datetime-local"
								value={from}
								onChange={(e) => {
									const v = e.currentTarget.value;
									setSearchParams((prev) => {
										if (v) prev.set('from', v);
										else prev.delete('from');
										prev.delete('page');
										return prev;
									});
								}}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="to">По</Label>
							<Input
								id="to"
								type="datetime-local"
								value={to}
								onChange={(e) => {
									const v = e.currentTarget.value;
									setSearchParams((prev) => {
										if (v) prev.set('to', v);
										else prev.delete('to');
										prev.delete('page');
										return prev;
									});
								}}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="action">Action</Label>
							<Input
								id="action"
								value={action}
								onChange={(e) => {
									const v = e.currentTarget.value;
									setSearchParams((prev) => {
										if (v) prev.set('action', v);
										else prev.delete('action');
										prev.delete('page');
										return prev;
									});
								}}
								placeholder="Напр. Client.Approve"
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="entityType">EntityType</Label>
							<Input
								id="entityType"
								value={entityType}
								onChange={(e) => {
									const v = e.currentTarget.value;
									setSearchParams((prev) => {
										if (v) prev.set('entityType', v);
										else prev.delete('entityType');
										prev.delete('page');
										return prev;
									});
								}}
								placeholder="Напр. Client"
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="pageSize">Page size</Label>
							<Input
								id="pageSize"
								type="number"
								min={1}
								max={200}
								value={String(pageSize)}
								onChange={(e) => {
									const v = e.currentTarget.value;
									setSearchParams((prev) => {
										if (v) prev.set('pageSize', v);
										else prev.delete('pageSize');
										prev.delete('page');
										return prev;
									});
								}}
							/>
						</div>
					</div>

					{audit.isPending && (
						<div className="text-sm text-muted-foreground">Загрузка…</div>
					)}
					{audit.error && (
						<div className="text-sm text-destructive">
							{getErrorMessage(audit.error, 'Не удалось загрузить аудит')}
						</div>
					)}

					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Дата (UTC)</TableHead>
								<TableHead>Пользователь</TableHead>
								<TableHead>Действие</TableHead>
								<TableHead>Сущность</TableHead>
								<TableHead>ID</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{items.length === 0 && !audit.isPending ? (
								<TableRow>
									<TableCell colSpan={5} className="text-muted-foreground">
										Записей нет
									</TableCell>
								</TableRow>
							) : (
								items.map((it) => (
									<TableRow key={String(it.id)}>
										<TableCell>{fmtDate(String(it.occurredAtUtc))}</TableCell>
										<TableCell>{it.userEmail ?? '—'}</TableCell>
										<TableCell>{it.action}</TableCell>
										<TableCell>{it.entityType}</TableCell>
										<TableCell>{it.entityId ?? '—'}</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>

					<div className="flex flex-wrap items-center justify-between gap-3">
						<div className="text-sm text-muted-foreground">
							Всего: {String(totalCount)} · Страница {String(query.page)} из{' '}
							{String(totalPages)}
						</div>

						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								disabled={(query.page ?? 1) <= 1 || audit.isPending}
								onClick={() =>
									setSearchParams((prev) => {
										prev.set('page', String(Math.max(1, (query.page ?? 1) - 1)));
										return prev;
									})
								}
							>
								Назад
							</Button>
							<Button
								variant="outline"
								disabled={(query.page ?? 1) >= totalPages || audit.isPending}
								onClick={() =>
									setSearchParams((prev) => {
										prev.set(
											'page',
											String(Math.min(totalPages, (query.page ?? 1) + 1))
										);
										return prev;
									})
								}
							>
								Вперёд
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

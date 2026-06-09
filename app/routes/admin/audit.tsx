import { useMemo } from 'react';
import { useSearchParams } from 'react-router';

import $api from '~/lib/api.client';
import {
	actionBadgeVariant,
	actionLabel,
	ACTION_FILTER_OPTIONS,
	entityTypeLabel,
	ENTITY_FILTER_OPTIONS,
	formatAuditDetails
} from '~/lib/audit-labels';
import { getErrorMessage } from '~/lib/error-message';
import { cn } from '~/lib/utils';

import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';

import { useAuthStore } from '~/store/auth.store';

const selectClassName = cn(
	'h-9 w-full min-w-0 rounded-4xl border border-input bg-input/30 px-3 py-1 text-base transition-colors outline-none',
	'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm'
);

function toIsoOrUndefined(value: string | null) {
	if (!value) return undefined;
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return undefined;
	return d.toISOString();
}

function fmtDate(value: string) {
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return value;
	return d.toLocaleString('ru-RU');
}

export default function AdminAuditRoute() {
	const isAdmin = useAuthStore((s) => s.isAdmin());
	const [searchParams, setSearchParams] = useSearchParams();

	const from = searchParams.get('from') ?? '';
	const to = searchParams.get('to') ?? '';
	const action = searchParams.get('action') ?? '';
	const entityType = searchParams.get('entityType') ?? '';
	const page = Number(searchParams.get('page') ?? 1);
	const pageSize = 20;

	const query = useMemo(
		() => ({
			fromUtc: toIsoOrUndefined(from),
			toUtc: toIsoOrUndefined(to),
			action: action.trim() ? action.trim() : undefined,
			entityType: entityType.trim() ? entityType.trim() : undefined,
			page: Number.isFinite(page) && page > 0 ? page : 1,
			pageSize
		}),
		[from, to, action, entityType, page]
	);

	const audit = $api.useQuery('get', '/audit', {
		params: { query }
	});

	if (!isAdmin || audit.error) {
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
	const totalPages = Math.max(1, Math.ceil(Number(totalCount) / pageSize));

	return (
		<Card>
			<CardHeader>
				<CardTitle>Журнал аудита</CardTitle>
			</CardHeader>
			<CardContent className="grid gap-4">
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
					<div className="grid gap-2">
						<Label htmlFor="from">С даты</Label>
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
						<Label htmlFor="to">По дату</Label>
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
						<Label htmlFor="action">Действие</Label>
						<select
							id="action"
							className={selectClassName}
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
						>
							{ACTION_FILTER_OPTIONS.map((opt) => (
								<option key={opt.value || 'all'} value={opt.value}>
									{opt.label}
								</option>
							))}
						</select>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="entityType">Объект</Label>
						<select
							id="entityType"
							className={selectClassName}
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
						>
							{ENTITY_FILTER_OPTIONS.map((opt) => (
								<option key={opt.value || 'all'} value={opt.value}>
									{opt.label}
								</option>
							))}
						</select>
					</div>
				</div>

				{audit.isPending && (
					<div className="text-sm text-muted-foreground">Загрузка…</div>
				)}
				{audit.error && (
					<div className="text-sm text-destructive">
						{getErrorMessage(audit.error, 'Не удалось загрузить журнал')}
					</div>
				)}

				{items.length === 0 && !audit.isPending ? (
					<div className="text-sm text-muted-foreground">Записей нет</div>
				) : (
					<div className="grid gap-2">
						{items.map((it) => {
							const details = formatAuditDetails(it.details);

							return (
								<div
									key={String(it.id)}
									className="rounded-xl border border-border p-3 grid gap-2"
								>
									<div className="flex flex-wrap items-start justify-between gap-3">
										<div className="grid gap-1 min-w-0">
											<div className="font-medium">{fmtDate(String(it.occurredAtUtc))}</div>
											<div className="text-sm text-muted-foreground truncate">
												{it.userEmail ?? 'Система'}
												{it.ipAddress ? ` · ${it.ipAddress}` : ''}
											</div>
										</div>
										<div className="flex flex-wrap items-center gap-2">
											<Badge variant={actionBadgeVariant(String(it.action))}>
												{actionLabel(String(it.action))}
											</Badge>
											<span className="text-sm">
												{entityTypeLabel(String(it.entityType))}
												{it.entityId ? (
													<span className="text-muted-foreground">
														{' '}
														· {it.entityId}
													</span>
												) : null}
											</span>
										</div>
									</div>

									{details ? (
										<details className="text-sm">
											<summary className="cursor-pointer text-muted-foreground hover:text-foreground">
												Подробности
											</summary>
											<pre className="mt-2 overflow-x-auto rounded-lg bg-muted/50 p-2 text-xs whitespace-pre-wrap break-words">
												{details}
											</pre>
										</details>
									) : null}
								</div>
							);
						})}
					</div>
				)}

				{Number(totalCount) > 0 ? (
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div className="text-sm text-muted-foreground">
							Всего {String(totalCount)} · Страница {String(query.page)} из{' '}
							{String(totalPages)}
						</div>

						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								disabled={(query.page ?? 1) <= 1 || audit.isPending}
								onClick={() =>
									setSearchParams((prev) => {
										prev.set(
											'page',
											String(Math.max(1, (query.page ?? 1) - 1))
										);
										return prev;
									})
								}
							>
								Назад
							</Button>
							<Button
								variant="outline"
								size="sm"
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
				) : null}
			</CardContent>
		</Card>
	);
}

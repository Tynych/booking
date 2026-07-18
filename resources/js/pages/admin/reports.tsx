import AdminLayout from '@/layouts/admin-layout';
import { router } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

interface DayStat {
    day: string;
    bookings_count: number;
    guests_count: number;
}

interface TableStat {
    id: number;
    name: string;
    bookings_count: number;
    guests_sum: number | null;
}

interface Totals {
    total_bookings: number;
    total_guests: number;
    total_deposit: number;
    no_show_count: number;
    no_show_rate: number;
    cancelled_count: number;
    cancellation_rate: number;
}

interface ReportsProps {
    from: string;
    to: string;
    dayStats: DayStat[];
    statusBreakdown: Record<string, number>;
    tableStats: TableStat[];
    totals: Totals;
}

const STATUS_LABELS: Record<string, string> = {
    confirmed: 'Подтверждено',
    seated: 'Гости за столом',
    completed: 'Завершено',
    no_show: 'Не пришли',
    cancelled: 'Отменено',
};

function formatDayLabel(iso: string): string {
    return new Date(iso + 'T00:00:00').toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
}

export default function Reports({ from, to, dayStats, statusBreakdown, tableStats, totals }: ReportsProps) {
    const [rangeFrom, setRangeFrom] = useState(from);
    const [rangeTo, setRangeTo] = useState(to);

    const applyRange: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(route('admin.reports.index'), { from: rangeFrom, to: rangeTo }, { preserveState: true });
    };

    const quickRange = (days: number) => {
        const newTo = new Date().toISOString().slice(0, 10);
        const d = new Date();
        d.setDate(d.getDate() - (days - 1));
        const newFrom = d.toISOString().slice(0, 10);
        setRangeFrom(newFrom);
        setRangeTo(newTo);
        router.get(route('admin.reports.index'), { from: newFrom, to: newTo }, { preserveState: true });
    };

    const maxBookings = Math.max(1, ...dayStats.map((d) => d.bookings_count));
    const maxTableBookings = Math.max(1, ...tableStats.map((t) => t.bookings_count));

    return (
        <AdminLayout crumb="Админ-панель" title="Отчёты">
            <form
                onSubmit={applyRange}
                style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'end', gap: 10, marginBottom: 20 }}
            >
                <button type="button" className="admin-btn-ghost-sm" onClick={() => quickRange(7)}>7 дней</button>
                <button type="button" className="admin-btn-ghost-sm" onClick={() => quickRange(30)}>30 дней</button>

                <div className="admin-field">
                    <label htmlFor="from">С</label>
                    <input id="from" type="date" value={rangeFrom} onChange={(e) => setRangeFrom(e.target.value)} style={{ width: 160 }} />
                </div>
                <div className="admin-field">
                    <label htmlFor="to">По</label>
                    <input id="to" type="date" value={rangeTo} onChange={(e) => setRangeTo(e.target.value)} style={{ width: 160 }} />
                </div>

                <button type="submit" className="admin-btn-brass">Показать</button>
            </form>

            <div className="admin-stat-row">
                <div className="admin-stat-card">
                    <div className="admin-stat-label">Всего броней</div>
                    <div className="admin-stat-value">{totals.total_bookings}</div>
                </div>
                <div className="admin-stat-card">
                    <div className="admin-stat-label">Гостей принято</div>
                    <div className="admin-stat-value">{totals.total_guests}</div>
                </div>
                <div className="admin-stat-card">
                    <div className="admin-stat-label">Депозитов собрано</div>
                    <div className="admin-stat-value accent">{totals.total_deposit.toFixed(2)}</div>
                </div>
            </div>

            <div className="admin-stat-row">
                <div className="admin-stat-card">
                    <div className="admin-stat-label">Не пришли</div>
                    <div className="admin-stat-value warn">
                        {totals.no_show_rate}% <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>({totals.no_show_count})</span>
                    </div>
                </div>
                <div className="admin-stat-card">
                    <div className="admin-stat-label">Отменено</div>
                    <div className="admin-stat-value" style={{ color: 'var(--cancelled)' }}>
                        {totals.cancellation_rate}% <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>({totals.cancelled_count})</span>
                    </div>
                </div>
                <div />
            </div>

            <div className="admin-panel">
                <div className="admin-panel-heading">Броней по дням</div>
                <div className="admin-bars">
                    {dayStats.map((d) => (
                        <div key={d.day} className="admin-bar-col">
                            <div className="n">{d.bookings_count || ''}</div>
                            <div className="bar" style={{ height: Math.max(4, (d.bookings_count / maxBookings) * 100) }} />
                            <div className="d">{formatDayLabel(d.day)}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                <div className="admin-panel">
                    <div className="admin-panel-heading">По статусам</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                        {Object.entries(STATUS_LABELS).map(([key, label]) => (
                            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                                <span style={{ fontWeight: 600 }}>{statusBreakdown[key] ?? 0}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="admin-panel">
                    <div className="admin-panel-heading">Загрузка столов</div>
                    {tableStats.map((t) => (
                        <div key={t.id} className="admin-load-row">
                            <div className="top">
                                <span>{t.name}</span>
                                <span className="muted">{t.bookings_count} брон. · {t.guests_sum ?? 0} гост.</span>
                            </div>
                            <div className="admin-load-track">
                                <div className="admin-load-fill" style={{ width: `${(t.bookings_count / maxTableBookings) * 100}%` }} />
                            </div>
                        </div>
                    ))}
                    {tableStats.length === 0 && (
                        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Столов пока нет</p>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}

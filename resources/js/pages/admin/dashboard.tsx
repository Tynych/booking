import AdminLayout from '@/layouts/admin-layout';
import { Link } from '@inertiajs/react';

interface Stats {
    tables_count: number;
    cashiers_count: number;
    bookings_today: number;
    guests_today: number;
    seated_now: number;
    arriving_soon: number;
}

interface UpcomingBooking {
    id: number;
    guest_name: string;
    party_size: number;
    start_time: string;
    status: string;
    table_name: string;
}

interface DashboardProps {
    restaurantName: string;
    stats: Stats;
    upcoming: UpcomingBooking[];
}

const STATUS_LABELS: Record<string, string> = {
    confirmed: 'Подтверждено',
    seated: 'За столом',
};

function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export default function AdminDashboard({ restaurantName, stats, upcoming }: DashboardProps) {
    const today = new Date().toLocaleDateString('ru-RU', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' });

    return (
        <AdminLayout crumb="Дашборд" title={restaurantName} subtitle={today}>
            <div className="admin-stat-row six">
                <div className="admin-stat-card">
                    <div className="admin-stat-label">Столов</div>
                    <div className="admin-stat-value">{stats.tables_count}</div>
                </div>
                <div className="admin-stat-card">
                    <div className="admin-stat-label">Кассиров</div>
                    <div className="admin-stat-value">{stats.cashiers_count}</div>
                </div>
                <div className="admin-stat-card">
                    <div className="admin-stat-label">Броней сегодня</div>
                    <div className="admin-stat-value">{stats.bookings_today}</div>
                </div>
                <div className="admin-stat-card">
                    <div className="admin-stat-label">Гостей сегодня</div>
                    <div className="admin-stat-value">{stats.guests_today}</div>
                </div>
                <div className="admin-stat-card">
                    <div className="admin-stat-label">За столами</div>
                    <div className="admin-stat-value good">{stats.seated_now}</div>
                </div>
                <div className="admin-stat-card">
                    <div className="admin-stat-label">Придут за час</div>
                    <div className="admin-stat-value warn">{stats.arriving_soon}</div>
                </div>
            </div>

            <div className="admin-panel">
                <div className="admin-panel-heading">
                    Ближайшие брони сегодня
                    <Link href={route('bookings.index')}>Открыть календарь →</Link>
                </div>

                {upcoming.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>На сегодня больше нет предстоящих броней</p>
                ) : (
                    <table className="admin-data">
                        <tbody>
                        {upcoming.map((b) => (
                            <tr key={b.id}>
                                <td style={{ fontFamily: "'JetBrains Mono', monospace", width: 60 }}>{formatTime(b.start_time)}</td>
                                <td>{b.guest_name}</td>
                                <td style={{ color: 'var(--text-muted)' }}>
                                    {b.party_size} гост. · {b.table_name}
                                </td>
                                <td style={{ textAlign: 'right', color: b.status === 'seated' ? 'var(--seated)' : 'var(--confirmed)' }}>
                                    {STATUS_LABELS[b.status]}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>
        </AdminLayout>
    );
}

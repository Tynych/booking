import AdminLayout from '@/layouts/admin-layout';
import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface RestaurantData {
    id: number;
    name: string;
    timezone: string;
    work_start: string; // "09:00:00"
    work_end_hour: number;
}

interface SettingsProps {
    restaurant: RestaurantData;
}

export default function RestaurantSettings({ restaurant }: SettingsProps) {
    const { data, setData, patch, processing, errors, recentlySuccessful } = useForm({
        timezone: restaurant.timezone,
        work_start: restaurant.work_start.slice(0, 5), // "09:00:00" -> "09:00"
        work_end_hour: String(restaurant.work_end_hour),
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('admin.restaurant-settings.update'));
    };

    return (
        <AdminLayout crumb="Админ-панель" title="Настройки ресторана" subtitle={restaurant.name}>
            <div className="admin-panel" style={{ maxWidth: 460 }}>
                <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div className="admin-field">
                        <label htmlFor="timezone">Часовой пояс</label>
                        <input
                            id="timezone"
                            value={data.timezone}
                            onChange={(e) => setData('timezone', e.target.value)}
                            placeholder="Europe/Moscow"
                        />
                        {errors.timezone && <div className="admin-field-error">{errors.timezone}</div>}
                    </div>

                    <div className="admin-field">
                        <label htmlFor="work_start">Открытие</label>
                        <input
                            id="work_start"
                            type="time"
                            value={data.work_start}
                            onChange={(e) => setData('work_start', e.target.value)}
                        />
                        {errors.work_start && <div className="admin-field-error">{errors.work_start}</div>}
                    </div>

                    <div className="admin-field">
                        <label htmlFor="work_end_hour">Закрытие</label>
                        <select
                            id="work_end_hour"
                            value={data.work_end_hour}
                            onChange={(e) => setData('work_end_hour', e.target.value)}
                        >
                            {Array.from({ length: 24 }, (_, i) => i + 1).map((h) => (
                                <option key={h} value={h}>
                                    {h === 24 ? '24:00 (полночь)' : `${String(h).padStart(2, '0')}:00`}
                                </option>
                            ))}
                        </select>
                        {errors.work_end_hour && <div className="admin-field-error">{errors.work_end_hour}</div>}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                        <button type="submit" className="admin-btn-brass" disabled={processing}>
                            Сохранить
                        </button>
                        {recentlySuccessful && (
                            <span style={{ fontSize: 13, color: 'var(--seated)' }}>Сохранено</span>
                        )}
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}

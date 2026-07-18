import AdminLayout from '@/layouts/admin-layout';
import { router, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface ManagerItem {
    id: number;
    name: string;
    email: string;
}

interface RestaurantItem {
    id: number;
    name: string;
    timezone: string;
    is_active: boolean;
    tables_count: number;
    manager: ManagerItem | null;
    created_at: string;
}

interface SuperAdminProps {
    restaurants: RestaurantItem[];
}

export default function SuperAdminDashboard({ restaurants }: SuperAdminProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        restaurant_name: '',
        timezone: 'Europe/Moscow',
        manager_name: '',
        manager_email: '',
        manager_password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('super-admin.restaurants.store'), {
            onSuccess: () => reset(),
        });
    };

    const toggleActive = (restaurant: RestaurantItem) => {
        router.patch(
            route('super-admin.restaurants.update', restaurant.id),
            { is_active: !restaurant.is_active },
            { preserveScroll: true },
        );
    };

    return (
        <AdminLayout crumb="Платформа" title="Рестораны">
            <div className="admin-panel">
                <div className="admin-panel-heading">Создать ресторан</div>
                <form onSubmit={submit}>
                    <div className="admin-form-grid" style={{marginBottom: 14}}>
                        <div className="admin-field">
                            <label htmlFor="restaurant_name">Название ресторана</label>
                            <input
                                id="restaurant_name"
                                value={data.restaurant_name}
                                onChange={(e) => setData('restaurant_name', e.target.value)}
                                placeholder="Osh Palace"
                            />
                            {errors.restaurant_name &&
                                <div className="admin-field-error">{errors.restaurant_name}</div>}
                        </div>

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

                        <div/>

                        <div className="admin-field">
                            <label htmlFor="manager_name">Имя менеджера</label>
                            <input
                                id="manager_name"
                                value={data.manager_name}
                                onChange={(e) => setData('manager_name', e.target.value)}
                                placeholder="Иван Петров"
                            />
                            {errors.manager_name && <div className="admin-field-error">{errors.manager_name}</div>}
                        </div>

                        <div className="admin-field">
                            <label htmlFor="manager_email">Email менеджера</label>
                            <input
                                id="manager_email"
                                type="email"
                                value={data.manager_email}
                                onChange={(e) => setData('manager_email', e.target.value)}
                                placeholder="manager@restaurant.com"
                            />
                            {errors.manager_email && <div className="admin-field-error">{errors.manager_email}</div>}
                        </div>

                        <div className="admin-field">
                            <label htmlFor="manager_password">Пароль менеджера</label>
                            <input
                                id="manager_password"
                                type="password"
                                value={data.manager_password}
                                onChange={(e) => setData('manager_password', e.target.value)}
                                placeholder="Минимум 8 символов"
                            />
                            {errors.manager_password && <div className="admin-field-error">{errors.manager_password}</div>}
                        </div>
                    </div>
                    <button type="submit" className="admin-btn-brass" disabled={processing}>
                        Создать ресторан
                    </button>
                </form>
            </div>

            <div className="admin-panel">
                <table className="admin-data">
                    <thead>
                    <tr>
                        <th>Ресторан</th>
                        <th>Менеджер</th>
                        <th>Столов</th>
                        <th>Часовой пояс</th>
                        <th>Статус</th>
                        <th></th>
                    </tr>
                    </thead>
                    <tbody>
                    {restaurants.map((r) => (
                        <tr key={r.id}>
                            <td style={{ fontWeight: 600 }}>{r.name}</td>
                            <td>
                                {r.manager ? (
                                    <div>
                                        <div>{r.manager.name}</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: 11.5 }}>{r.manager.email}</div>
                                    </div>
                                ) : (
                                    <span style={{ color: 'var(--text-muted)' }}>— без менеджера —</span>
                                )}
                            </td>
                            <td>{r.tables_count}</td>
                            <td>{r.timezone}</td>
                            <td>
                                    <span className={`admin-pill ${r.is_active ? 'on' : 'off'}`}>
                                        {r.is_active ? 'Активен' : 'Отключён'}
                                    </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                                <button className="admin-btn-ghost-sm" onClick={() => toggleActive(r)}>
                                    {r.is_active ? 'Отключить' : 'Включить'}
                                </button>
                            </td>
                        </tr>
                    ))}
                    {restaurants.length === 0 && (
                        <tr>
                            <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 16 }}>
                                Ресторанов пока нет
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}

import AdminLayout from '@/layouts/admin-layout';
import { router, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface CashierItem {
    id: number;
    name: string;
    email: string;
    created_at: string;
}

interface CashiersProps {
    cashiers: CashierItem[];
}

export default function CashiersIndex({ cashiers }: CashiersProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('admin.cashiers.store'), {
            onSuccess: () => reset(),
        });
    };

    const handleDelete = (id: number) => {
        if (confirm('Удалить кассира?')) {
            router.delete(route('admin.cashiers.destroy', id));
        }
    };

    return (
        <AdminLayout crumb="Админ-панель" title="Кассиры">
            <div className="admin-panel">
                <div className="admin-panel-heading">Добавить кассира</div>
                <form onSubmit={submit} className="admin-form-grid">
                    <div className="admin-field">
                        <label htmlFor="name">Имя</label>
                        <input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Иван Иванов" />
                        {errors.name && <div className="admin-field-error">{errors.name}</div>}
                    </div>

                    <div className="admin-field">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="cashier@restaurant.com"
                        />
                        {errors.email && <div className="admin-field-error">{errors.email}</div>}
                    </div>

                    <div className="admin-field">
                        <label htmlFor="password">Пароль</label>
                        <input
                            id="password"
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="Минимум 8 символов"
                        />
                        {errors.password && <div className="admin-field-error">{errors.password}</div>}
                    </div>

                    <button type="submit" className="admin-btn-brass" disabled={processing}>
                        Добавить
                    </button>
                </form>
            </div>

            <div className="admin-panel">
                <table className="admin-data">
                    <thead>
                    <tr>
                        <th>Имя</th>
                        <th>Email</th>
                        <th></th>
                    </tr>
                    </thead>
                    <tbody>
                    {cashiers.map((c) => (
                        <tr key={c.id}>
                            <td>{c.name}</td>
                            <td>{c.email}</td>
                            <td style={{ textAlign: 'right' }}>
                                <button className="admin-btn-danger-sm" onClick={() => handleDelete(c.id)}>
                                    Удалить
                                </button>
                            </td>
                        </tr>
                    ))}
                    {cashiers.length === 0 && (
                        <tr>
                            <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 16 }}>
                                Кассиров пока нет
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}

import AdminLayout from '@/layouts/admin-layout';
import { router, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface TableItem {
    id: number;
    name: string;
    capacity: number;
    zone: string | null;
}

interface TablesProps {
    tables: TableItem[];
}

export default function TablesIndex({ tables }: TablesProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        capacity: '',
        zone: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('admin.tables.store'), {
            onSuccess: () => reset(),
        });
    };

    const handleDelete = (id: number) => {
        if (confirm('Удалить стол?')) {
            router.delete(route('admin.tables.destroy', id));
        }
    };

    return (
        <AdminLayout crumb="Админ-панель" title="Столы">
            <div className="admin-panel">
                <div className="admin-panel-heading">Добавить стол</div>
                <form onSubmit={submit} className="admin-form-grid">
                    <div className="admin-field">
                        <label htmlFor="name">Название</label>
                        <input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Стол 9" />
                        {errors.name && <div className="admin-field-error">{errors.name}</div>}
                    </div>

                    <div className="admin-field">
                        <label htmlFor="capacity">Вместимость</label>
                        <input
                            id="capacity"
                            type="number"
                            min={1}
                            value={data.capacity}
                            onChange={(e) => setData('capacity', e.target.value)}
                            placeholder="4"
                        />
                        {errors.capacity && <div className="admin-field-error">{errors.capacity}</div>}
                    </div>

                    <div className="admin-field">
                        <label htmlFor="zone">Зона (необязательно)</label>
                        <input id="zone" value={data.zone} onChange={(e) => setData('zone', e.target.value)} placeholder="Терраса" />
                        {errors.zone && <div className="admin-field-error">{errors.zone}</div>}
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
                        <th>Название</th>
                        <th>Вместимость</th>
                        <th>Зона</th>
                        <th></th>
                    </tr>
                    </thead>
                    <tbody>
                    {tables.map((t) => (
                        <tr key={t.id}>
                            <td>{t.name}</td>
                            <td>{t.capacity} мест</td>
                            <td>{t.zone ?? '—'}</td>
                            <td style={{ textAlign: 'right' }}>
                                <button className="admin-btn-danger-sm" onClick={() => handleDelete(t.id)}>
                                    Удалить
                                </button>
                            </td>
                        </tr>
                    ))}
                    {tables.length === 0 && (
                        <tr>
                            <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 16 }}>
                                Столов пока нет
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}

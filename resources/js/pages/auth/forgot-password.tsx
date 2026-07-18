import { Head, Link, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';
import '../auth/login.css';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <div className="auth-login-page">
            <Head title="Забыли пароль" />

            <div className="auth-login-card">
                <div className="auth-login-brand">
                    <span className="auth-login-brand-dot" />
                    <span className="auth-login-brand-text">BOOKFLOW</span>
                </div>
                <h1 className="auth-login-title">Восстановление пароля</h1>
                <p className="auth-login-subtitle">Пришлём ссылку для сброса на вашу почту</p>

                {status && <div className="auth-login-status">{status}</div>}

                <form onSubmit={submit}>
                    <div className="auth-login-field">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            autoComplete="off"
                            autoFocus
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="you@restaurant.com"
                        />
                        {errors.email && <div className="auth-login-error">{errors.email}</div>}
                    </div>

                    <button type="submit" className="auth-login-btn" disabled={processing} style={{ marginTop: 6 }}>
                        {processing && <LoaderCircle />}
                        Отправить ссылку
                    </button>
                </form>

                <Link href={route('login')} className="auth-login-back">
                    ← Вернуться ко входу
                </Link>
            </div>
        </div>
    );
}

import { Head, Link, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';
import './login.css';

interface LoginForm {
    email: string;
    password: string;
    remember: boolean;
}

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="auth-login-page">
            <Head title="Вход" />

            <div className="auth-login-card">
                <div className="auth-login-brand">
                    <span className="auth-login-brand-dot" />
                    <span className="auth-login-brand-text">BOOKFLOW</span>
                </div>
                <h1 className="auth-login-title">Вход в систему</h1>
                <p className="auth-login-subtitle">Панель бронирования столов</p>

                {status && <div className="auth-login-status">{status}</div>}

                <form onSubmit={submit}>
                    <div className="auth-login-field">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="you@restaurant.com"
                        />
                        {errors.email && <div className="auth-login-error">{errors.email}</div>}
                    </div>

                    <div className="auth-login-field">
                        <label htmlFor="password">Пароль</label>
                        <input
                            id="password"
                            type="password"
                            required
                            tabIndex={2}
                            autoComplete="current-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="••••••••"
                        />
                        {errors.password && <div className="auth-login-error">{errors.password}</div>}
                    </div>

                    <div className="auth-login-row">
                        <label className="auth-login-remember">
                            <input
                                type="checkbox"
                                tabIndex={3}
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                            />
                            Запомнить меня
                        </label>
                        {canResetPassword && (
                            <Link href={route('password.request')} className="auth-login-forgot" tabIndex={5}>
                                Забыли пароль?
                            </Link>
                        )}
                    </div>

                    <button type="submit" className="auth-login-btn" tabIndex={4} disabled={processing}>
                        {processing && <LoaderCircle />}
                        Войти
                    </button>
                </form>

                <Link href={route('home')} className="auth-login-back">
                    ← На главную
                </Link>
            </div>
        </div>
    );
}

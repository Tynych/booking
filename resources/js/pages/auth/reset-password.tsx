import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';
import '../auth/login.css';

interface ResetPasswordProps {
    token: string;
    email: string;
}

interface ResetPasswordForm {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
}

export default function ResetPassword({ token, email }: ResetPasswordProps) {
    const { data, setData, post, processing, errors, reset } = useForm<ResetPasswordForm>({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <div className="auth-login-page">
            <Head title="Новый пароль" />

            <div className="auth-login-card">
                <div className="auth-login-brand">
                    <span className="auth-login-brand-dot" />
                    <span className="auth-login-brand-text">BOOKFLOW</span>
                </div>
                <h1 className="auth-login-title">Новый пароль</h1>
                <p className="auth-login-subtitle">Придумайте новый пароль для входа</p>

                <form onSubmit={submit}>
                    <div className="auth-login-field">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            autoComplete="email"
                            value={data.email}
                            readOnly
                            onChange={(e) => setData('email', e.target.value)}
                            style={{ opacity: 0.6, cursor: 'default' }}
                        />
                        {errors.email && <div className="auth-login-error">{errors.email}</div>}
                    </div>

                    <div className="auth-login-field">
                        <label htmlFor="password">Новый пароль</label>
                        <input
                            id="password"
                            type="password"
                            name="password"
                            autoComplete="new-password"
                            autoFocus
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="Минимум 8 символов"
                        />
                        {errors.password && <div className="auth-login-error">{errors.password}</div>}
                    </div>

                    <div className="auth-login-field">
                        <label htmlFor="password_confirmation">Повторите пароль</label>
                        <input
                            id="password_confirmation"
                            type="password"
                            name="password_confirmation"
                            autoComplete="new-password"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            placeholder="Ещё раз новый пароль"
                        />
                        {errors.password_confirmation && <div className="auth-login-error">{errors.password_confirmation}</div>}
                    </div>

                    <button type="submit" className="auth-login-btn" disabled={processing} style={{ marginTop: 6 }}>
                        {processing && <LoaderCircle />}
                        Сохранить пароль
                    </button>
                </form>
            </div>
        </div>
    );
}

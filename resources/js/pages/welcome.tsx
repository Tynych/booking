import { Head, Link, usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import './landing.css';

function dashboardRouteForRole(role?: string): string {
    switch (role) {
        case 'super_admin':
            return route('super-admin.dashboard');
        case 'manager':
            return route('admin.dashboard');
        case 'cashier':
            return route('bookings.index');
        default:
            return route('dashboard');
    }
}

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;
    const primaryHref = auth.user ? dashboardRouteForRole(auth.user.role) : route('login');
    const primaryLabel = auth.user ? 'В панель' : 'Войти в систему';

    return (
        <div className="landing-page">
            <Head title="BOOKFLOW — Бронирование столов для ресторанов" />

            <nav className="landing-nav">
                <Link href={route('home')} className="landing-brand">
                    <span className="landing-brand-dot" />
                    BOOKFLOW
                </Link>
                <Link href={primaryHref} className="landing-login-btn">
                    {auth.user ? 'В панель' : 'Войти'}
                </Link>
            </nav>

            <div className="hero">
                <span className="hero-eyebrow">Для ресторанов и кафе</span>
                <h1>Бронирование столов без путаницы в тетради</h1>
                <p>
                    Один экран для всей смены: кто, куда и во сколько посадить гостя — без двойных записей и забытых
                    броней.
                </p>
                <div className="hero-ctas">
                    <Link href={primaryHref} className="btn-primary">
                        {primaryLabel}
                    </Link>
                    <a href="#features" className="btn-ghost">
                        Как это работает
                    </a>
                </div>

                <div className="timeline-art">
                    <div className="timeline-ruler" />
                    <div className="timeline-tick major" style={{ left: '5%' }} />
                    <div className="timeline-tick" style={{ left: '20%' }} />
                    <div className="timeline-tick major" style={{ left: '35%' }} />
                    <div className="timeline-tick" style={{ left: '50%' }} />
                    <div className="timeline-tick major" style={{ left: '65%' }} />
                    <div className="timeline-tick" style={{ left: '80%' }} />
                    <div className="timeline-tick major" style={{ left: '95%' }} />
                    <div className="timeline-now" style={{ left: '58%' }} />

                    <div className="timeline-chip" style={{ left: '20%' }}>
                        <div className="name">Иванов</div>
                        <div className="meta">Стол 2 · 19:00</div>
                    </div>
                    <div className="timeline-chip seated" style={{ left: '47%' }}>
                        <div className="name">Каримова</div>
                        <div className="meta">Стол 4 · 19:45</div>
                    </div>
                    <div className="timeline-chip" style={{ left: '76%' }}>
                        <div className="name">Юсупова</div>
                        <div className="meta">Стол 1 · 20:30</div>
                    </div>
                </div>
            </div>

            <div className="features" id="features">
                <div className="feature-card">
                    <div className="feature-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 11l3 3L22 4" />
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                        </svg>
                    </div>
                    <div className="feature-title">Ни одной потерянной брони</div>
                    <div className="feature-desc">
                        Двойное бронирование одного стола технически невозможно — система проверяет пересечения
                        автоматически.
                    </div>
                </div>
                <div className="feature-card">
                    <div className="feature-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" />
                            <path d="M16 2v4M8 2v4M3 10h18" />
                        </svg>
                    </div>
                    <div className="feature-title">Всё видно на одном экране</div>
                    <div className="feature-desc">
                        Столы и время — в одной таблице. Кто скоро придёт и кто уже опаздывает — подсвечивается само.
                    </div>
                </div>
                <div className="feature-card">
                    <div className="feature-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="5" y="11" width="14" height="9" rx="2" />
                            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                        </svg>
                    </div>
                    <div className="feature-title">Разграничение доступа</div>
                    <div className="feature-desc">
                        Менеджер настраивает зал и сотрудников, кассир — только вносит брони. Ничего лишнего.
                    </div>
                </div>
            </div>

            <div className="landing-footer">
                <div className="landing-footer-brand">
                    <span className="landing-brand-dot" />
                    BOOKFLOW © {new Date().getFullYear()}
                </div>
                <Link href={primaryHref} className="landing-footer-link">
                    {primaryLabel} →
                </Link>
            </div>
        </div>
    );
}

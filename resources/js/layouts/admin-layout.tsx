import { Head, Link, usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { type ReactNode } from 'react';
import './admin-theme.css';


interface AdminLayoutProps {
    crumb: string;
    title: string;
    subtitle?: string;
    children: ReactNode;
}

interface NavItem {
    label: string;
    href: string;
    match: string; // префикс пути, по которому определяем активный пункт
    icon: ReactNode;
}

const iconProps = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
};

const managerNav: NavItem[] = [
    {
        label: 'Дашборд',
        href: '/admin',
        match: '/admin',
        icon: (
            <svg {...iconProps}>
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
        ),
    },
    {
        label: 'Столы',
        href: '/admin/tables',
        match: '/admin/tables',
        icon: (
            <svg {...iconProps}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9" />
            </svg>
        ),
    },
    {
        label: 'Кассиры',
        href: '/admin/cashiers',
        match: '/admin/cashiers',
        icon: (
            <svg {...iconProps}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
            </svg>
        ),
    },
    {
        label: 'Брони',
        href: '/bookings',
        match: '/bookings',
        icon: (
            <svg {...iconProps}>
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
        ),
    },
    {
        label: 'Отчёты',
        href: '/admin/reports',
        match: '/admin/reports',
        icon: (
            <svg {...iconProps}>
                <path d="M3 3v18h18" />
                <path d="M18 17V9M13 17V5M8 17v-4" />
            </svg>
        ),
    },
    {
        label: 'Настройки ресторана',
        href: '/admin/restaurant-settings',
        match: '/admin/restaurant-settings',
        icon: (
            <svg {...iconProps}>
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
        ),
    },
];

const superAdminNav: NavItem[] = [
    {
        label: 'Рестораны',
        href: '/super-admin',
        match: '/super-admin',
        icon: (
            <svg {...iconProps}>
                <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
            </svg>
        ),
    },
];

const ROLE_LABELS: Record<string, string> = {
    manager: 'Менеджер',
    super_admin: 'Платформа',
    cashier: 'Кассир',
};

export default function AdminLayout({ crumb, title, subtitle, children }: AdminLayoutProps) {
    const page = usePage<SharedData>();
    const auth = page.props.auth;
    const currentUrl = page.url;

    const isSuperAdmin = auth.user?.role === 'super_admin';
    const navItems = isSuperAdmin ? superAdminNav : managerNav;
    const homeUrl = isSuperAdmin ? '/super-admin' : '/admin';

    const initial = auth.user?.name?.charAt(0).toUpperCase() ?? '?';
    const roleLabel = auth.user ? (ROLE_LABELS[auth.user.role] ?? auth.user.role) : '';

    return (
        <div className="admin-shell">
            <Head title={title} />

            <aside className="admin-sidebar">
                <Link href={homeUrl} className="admin-sidebar-brand">
                    <span className="admin-sidebar-brand-dot" />
                    BOOKFLOW
                </Link>

                <nav className="admin-sidebar-nav">
                    {navItems.map((item) => {
                        const isActive =
                            item.match === '/admin' ? currentUrl === '/admin' : currentUrl.startsWith(item.match);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`admin-sidebar-item${isActive ? ' active' : ''}`}
                            >
                                {item.icon}
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="admin-sidebar-footer">
                    <div className="admin-sidebar-avatar">{initial}</div>
                    <div>
                        <div className="admin-sidebar-user-name">{auth.user?.name}</div>
                        <div className="admin-sidebar-user-role">{roleLabel}</div>
                    </div>
                    <Link href={route('logout')} method="post" as="button" className="admin-sidebar-logout" aria-label="Выйти">
                        <svg {...iconProps}>
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <path d="M16 17l5-5-5-5M21 12H9" />
                        </svg>
                    </Link>
                </div>
            </aside>

            <main className="admin-main">
                <div className="admin-topbar">
                    <div className="admin-crumb">{crumb}</div>
                    <h1>{title}</h1>
                    {subtitle && <div className="admin-sub">{subtitle}</div>}
                </div>
                <div className="admin-body">{children}</div>
            </main>
        </div>
    );
}

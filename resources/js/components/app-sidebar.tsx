import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BarChart3, Building2, CalendarClock, LayoutGrid, Settings2, Table2, Users } from 'lucide-react';
import AppLogo from './app-logo';

const managerNavItems: NavItem[] = [
    { title: 'Дашборд', url: '/admin', icon: LayoutGrid },
    { title: 'Столы', url: '/admin/tables', icon: Table2 },
    { title: 'Кассиры', url: '/admin/cashiers', icon: Users },
    { title: 'Брони', url: '/bookings', icon: CalendarClock },
    { title: 'Отчёты', url: '/admin/reports', icon: BarChart3 },
    { title: 'Настройки ресторана', url: '/admin/restaurant-settings', icon: Settings2 },
];

const superAdminNavItems: NavItem[] = [
    { title: 'Рестораны', url: '/super-admin', icon: Building2 },
];

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    const role = auth.user?.role;

    const navItems = role === 'super_admin' ? superAdminNavItems : managerNavItems;
    const homeUrl = role === 'super_admin' ? '/super-admin' : '/admin';

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={homeUrl}>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={navItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

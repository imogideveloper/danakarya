import React from 'react';
import { LayoutDashboard, Users, FileText, CheckCircle, Banknote, CalendarClock, CreditCard, HandshakeIcon, ArrowLeftRight, BarChart3, UserCog, Settings, LogOut, ChevronUp, Moon, Sun, Wallet, ArrowLeft, UserCircle } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail, SidebarSeparator, SidebarTrigger, useSidebar, } from '@/components/ui/sidebar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAppStore } from '@/lib/store';
import { useTheme } from 'next-themes';
import { getInitials } from '@/lib/format';
const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'finance', 'employee'] },
    { key: 'employees', label: 'Karyawan', icon: Users, roles: ['admin', 'finance', 'manager', 'employee'] },
    // Loan Group
    { key: 'loan-application', label: 'Pengajuan Pinjaman', icon: FileText, roles: ['employee'] },
    { key: 'loan-approval', label: 'Persetujuan Pinjaman', icon: CheckCircle, roles: ['admin', 'manager', 'finance'] },
    { key: 'disbursement', label: 'Pencairan', icon: Banknote, roles: ['admin', 'finance'] },
    { key: 'installments', label: 'Jadwal Angsuran', icon: CalendarClock, roles: ['admin', 'finance', 'employee'] },
    { key: 'payments', label: 'Pembayaran', icon: CreditCard, roles: ['admin', 'finance'] },
    { key: 'settlement', label: 'Pelunasan Dini', icon: HandshakeIcon, roles: ['admin', 'finance', 'employee'] },
    { key: 'reconciliation', label: 'Rekonsiliasi', icon: ArrowLeftRight, roles: ['finance'] },
    { key: 'reports', label: 'Laporan', icon: BarChart3, roles: ['admin', 'finance', 'manager'] },
    { key: 'user-management', label: 'Manajemen User', icon: UserCog, roles: ['admin'] },
    { key: 'settings', label: 'Pengaturan', icon: Settings, roles: ['admin'] },
];
// Short labels for mobile bottom nav
const mobileNavLabels = {
    'dashboard': 'Home',
    'loan-application': 'Pengajuan',
    'installments': 'Angsuran',
    'payments': 'Bayar',
    'reports': 'Laporan',
};
export function AppSidebar() {
    const { currentPage, navigate, currentUser, logout } = useAppStore();
    const { setOpenMobile } = useSidebar();
    const role = currentUser?.role || 'employee';
    const filteredItems = navItems.filter(item => item.roles.includes(role));
    const mainNav = filteredItems.map(item => ({
        ...item,
        label: item.key === 'employees' && role === 'employee' ? 'Profil Saya' : item.label,
    })).filter(item => role === 'employee'
        ? ['dashboard'].includes(item.key) // Employee: no separate profile menu, it's in footer
        : ['dashboard', 'employees'].includes(item.key));
    const loanNav = filteredItems.filter(item => ['loan-application', 'loan-approval', 'disbursement', 'installments', 'payments', 'settlement', 'reconciliation'].includes(item.key));
    const systemNav = filteredItems.filter(item => ['reports', 'user-management', 'settings'].includes(item.key));
    const handleNavigate = (key) => {
        navigate(key);
        setOpenMobile(false); // Close mobile sheet after navigation
    };
    return (<Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="hover:bg-sidebar-accent/50">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Wallet className="size-4"/>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-bold tracking-wide">DANAKARYA</span>
                <span className="truncate text-[10px] text-sidebar-foreground/60">Pinjaman Karyawan</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="custom-scrollbar">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-widest">Menu Utama</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (<SidebarMenuItem key={item.key}>
                  <SidebarMenuButton isActive={currentPage === item.key} onClick={() => handleNavigate(item.key)} tooltip={item.label} className="transition-all duration-200">
                    <item.icon className="size-4"/>
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {loanNav.length > 0 && (<SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-widest">Pinjaman</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {loanNav.map((item) => (<SidebarMenuItem key={item.key}>
                    <SidebarMenuButton isActive={currentPage === item.key} onClick={() => handleNavigate(item.key)} tooltip={item.label} className="transition-all duration-200">
                      <item.icon className="size-4"/>
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>)}

        {systemNav.length > 0 && (<SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-widest">Sistem</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {systemNav.map((item) => (<SidebarMenuItem key={item.key}>
                    <SidebarMenuButton isActive={currentPage === item.key} onClick={() => handleNavigate(item.key)} tooltip={item.label} className="transition-all duration-200">
                      <item.icon className="size-4"/>
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>)}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="hover:bg-sidebar-accent/50">
                  <Avatar className="size-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-primary/20 text-primary text-xs">
                      {currentUser ? getInitials(currentUser.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-semibold">{currentUser?.name}</span>
                    <span className="truncate text-[10px] text-sidebar-foreground/60 capitalize">{currentUser?.role}</span>
                  </div>
                  <ChevronUp className="ml-auto size-4 group-data-[collapsible=icon]:hidden"/>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-56" align="end">
                {role === 'employee' && (<DropdownMenuItem onClick={() => handleNavigate('employees')}>
                    <UserCircle className="mr-2 size-4"/>
                    Profil Saya
                  </DropdownMenuItem>)}
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 size-4"/>
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>);
}
export function AppHeader() {
    const { currentUser, currentPage, pageHistory, goBack } = useAppStore();
    const { theme, setTheme } = useTheme();
    const canGoBack = pageHistory.length > 0;
    const pageTitle = {
        'dashboard': 'Dashboard',
        'employees': 'Manajemen Karyawan',
        'employee-detail': 'Detail Karyawan',
        'loan-application': 'Pengajuan Pinjaman',
        'loan-approval': 'Persetujuan Pinjaman',
        'loan-detail': 'Detail Pinjaman',
        'disbursement': 'Pencairan Pinjaman',
        'installments': 'Jadwal Angsuran',
        'payments': 'Pembayaran',
        'settlement': 'Pelunasan Dini',
        'reconciliation': 'Rekonsiliasi',
        'reports': 'Laporan',
        'user-management': 'Manajemen User',
        'settings': 'Pengaturan',
        'socket-demo': 'WebSocket Demo',
    };
    return (<header className="flex h-14 items-center gap-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
      <SidebarTrigger className="-ml-1 md:-ml-1"/>

      {canGoBack && (<button onClick={goBack} className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors text-sm font-medium" aria-label="Kembali" title="Kembali ke halaman sebelumnya">
          <ArrowLeft className="size-3.5"/>
          <span className="hidden sm:inline">Kembali</span>
        </button>)}

      <div className="flex-1">
        <h1 className="text-base sm:text-lg font-semibold">{pageTitle[currentPage]}</h1>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="inline-flex items-center justify-center rounded-md size-8 hover:bg-accent transition-colors" aria-label="Toggle theme">
          <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"/>
          <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"/>
        </button>

        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
          <Avatar className="size-7">
            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
              {currentUser ? getInitials(currentUser.name) : 'U'}
            </AvatarFallback>
          </Avatar>
          <span>{currentUser?.name}</span>
        </div>
      </div>
    </header>);
}
// ==========================================
// Mobile Bottom Navigation
// ==========================================
export function MobileBottomNav() {
    const { currentPage, navigate, currentUser } = useAppStore();
    const role = currentUser?.role || 'employee';
    // Determine which items to show in bottom nav (max 5)
    const bottomNavItems = React.useMemo(() => {
        const allItems = navItems.filter(item => item.roles.includes(role));
        if (role === 'employee') {
            // Employee: Home, Pengajuan, Angsuran, Pelunasan
            return allItems.filter(item => ['dashboard', 'loan-application', 'installments', 'settlement'].includes(item.key));
        }
        if (role === 'finance') {
            return allItems.filter(item => ['dashboard', 'loan-approval', 'payments', 'installments'].includes(item.key));
        }
        if (role === 'manager') {
            return allItems.filter(item => ['dashboard', 'loan-approval', 'employees', 'reports'].includes(item.key));
        }
        // admin
        return allItems.filter(item => ['dashboard', 'loan-approval', 'installments', 'employees', 'settings'].includes(item.key));
    }, [role]);
    return (<nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-area-pb">
      <div className="flex items-center justify-around h-14">
        {bottomNavItems.map((item) => {
            const isActive = currentPage === item.key;
            const shortLabel = mobileNavLabels[item.key] || item.label.split(' ')[0];
            return (<button key={item.key} onClick={() => navigate(item.key)} className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'}`}>
              <item.icon className={`size-5 ${isActive ? 'text-primary' : ''}`}/>
              <span className={`text-[10px] leading-tight ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {shortLabel}
              </span>
            </button>);
        })}
      </div>
    </nav>);
}

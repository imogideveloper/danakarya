import React from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar, AppHeader, MobileBottomNav } from '@/components/layout/app-shell';
import { LoginPage } from '@/components/pages/login';
import { DashboardPage } from '@/components/pages/dashboard';
import { EmployeesPage } from '@/components/pages/employees';
import { EmployeeDetailPage } from '@/components/pages/employee-detail';
import { LoanApplicationPage } from '@/components/pages/loan-application';
import { LoanApprovalPage } from '@/components/pages/loan-approval';
import { LoanDetailPage } from '@/components/pages/loan-detail';
import { DisbursementPage } from '@/components/pages/disbursement';
import { InstallmentsPage } from '@/components/pages/installments';
import { PaymentsPage } from '@/components/pages/payments';
import { SettlementPage } from '@/components/pages/settlement';
import { ReconciliationPage } from '@/components/pages/reconciliation';
import { ReportsPage } from '@/components/pages/reports';
import { UserManagementPage } from '@/components/pages/user-management';
import { SettingsPage } from '@/components/pages/settings';
import { SocketDemoPage } from '@/components/pages/socket-demo';
import { useAppStore } from '@/lib/store';
function PageRouter({ page }) {
    switch (page) {
        case 'dashboard': return <DashboardPage />;
        case 'employees': return <EmployeesPage />;
        case 'employee-detail': return <EmployeeDetailPage />;
        case 'loan-application': return <LoanApplicationPage />;
        case 'loan-approval': return <LoanApprovalPage />;
        case 'loan-detail': return <LoanDetailPage />;
        case 'disbursement': return <DisbursementPage />;
        case 'installments': return <InstallmentsPage />;
        case 'payments': return <PaymentsPage />;
        case 'settlement': return <SettlementPage />;
        case 'reconciliation': return <ReconciliationPage />;
        case 'reports': return <ReportsPage />;
        case 'user-management': return <UserManagementPage />;
        case 'settings': return <SettingsPage />;
        case 'socket-demo': return <SocketDemoPage />;
        default: return <DashboardPage />;
    }
}
function AppContent() {
    const { isAuthenticated, currentPage, goBack, pageHistory, initAuth, logout } = useAppStore();
    React.useEffect(() => {
        initAuth();
    }, []);
    React.useEffect(() => {
        const handler = () => logout();
        window.addEventListener('auth:expired', handler);
        return () => window.removeEventListener('auth:expired', handler);
    }, [logout]);
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if (pageHistory.length === 0)
                return;
            if (e.altKey && e.key === 'ArrowLeft') {
                e.preventDefault();
                goBack();
                return;
            }
            if (e.key === 'Backspace') {
                const target = e.target;
                const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
                if (!isInput) {
                    e.preventDefault();
                    goBack();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [goBack, pageHistory.length]);
    if (!isAuthenticated) {
        return <LoginPage />;
    }
    return (<SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col min-h-screen">
        <AppHeader />
        <main className="flex-1 p-4 lg:p-6 overflow-auto pb-20 md:pb-6">
          <PageRouter page={currentPage}/>
        </main>
        <footer className="border-t py-3 px-4 text-center text-xs text-muted-foreground mt-auto hidden md:block">
          &copy; 2026 DANAKARYA - Dana untuk Karyawan Sejahtera
        </footer>
      </SidebarInset>
      <MobileBottomNav />
    </SidebarProvider>);
}
export default function App() {
    return (<ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AppContent />
      <Toaster richColors position="top-right" />
    </ThemeProvider>);
}

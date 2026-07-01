import React, { useMemo, useState, useEffect } from 'react';
import api from '@/lib/api';
import {
    Wallet, TrendingUp, Users, AlertTriangle, Banknote, CreditCard,
    CalendarClock, PlusCircle, FileText, CheckCircle2, HandCoins,
    ShieldCheck, ArrowRight, Clock, XCircle, Building2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/lib/store';
import { formatCurrency, formatCompactCurrency, formatDate, getStatusColor, getStatusLabel, getRelativeTime, formatAdminFee } from '@/lib/format';

const mapLoan = (l) => ({
    id: l.id,
    loanNo: l.loan_no,
    employeeId: l.employee,
    employeeName: l.employee_name || '',
    principalAmount: l.principal_amount,
    adminFeeType: l.admin_fee_type,
    adminFee: parseFloat(l.admin_fee),
    adminFeeAmount: l.admin_fee_amount,
    disbursedAmount: l.disbursed_amount,
    tenor: l.tenor,
    monthlyPayment: l.monthly_payment,
    totalPayment: l.total_payment,
    outstandingBalance: l.outstanding_balance,
    status: l.status,
    disbursementDate: l.disbursement_date,
    maturityDate: l.maturity_date,
    installments: (l.installments || []).map(i => ({
        id: i.id,
        loanId: l.id,
        installmentNo: i.installment_no,
        dueDate: i.due_date,
        amount: i.amount,
        remainingBalance: i.remaining_balance,
        status: i.status,
        paidAmount: i.paid_amount,
        paidDate: i.paid_date,
    })),
});

const mapApplication = (a) => ({
    id: a.id,
    applicationNo: a.application_no,
    employeeId: a.employee,
    employeeName: a.employee_name || '',
    loanAmount: a.loan_amount,
    loanPurpose: a.loan_purpose,
    tenor: a.tenor,
    adminFeeType: a.admin_fee_type,
    adminFee: parseFloat(a.admin_fee),
    adminFeeAmount: a.admin_fee_amount,
    disbursedAmount: a.disbursed_amount,
    status: a.status,
    notes: a.notes,
    applicationDate: a.application_date,
    reviewedAt: a.reviewed_at,
    createdAt: a.created_at,
    updatedAt: a.updated_at,
});

const mapPayment = (p) => ({
    id: p.id,
    loanId: p.loan,
    paymentNo: p.payment_no,
    amount: p.amount,
    paymentDate: p.payment_date,
    paymentMethod: p.payment_method,
    status: p.status,
    createdAt: p.created_at,
});

const mapActivityLog = (l) => ({
    id: l.id,
    userId: l.user,
    userName: l.user_name || '',
    action: l.action,
    entity: l.entity,
    entityId: l.entity_id,
    details: l.details,
    createdAt: l.created_at,
});

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
}

function getTodayString() {
    return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    }).format(new Date());
}

export function DashboardPage() {
    const { navigate, currentUser } = useAppStore();
    const role = currentUser?.role || 'employee';
    const isEmployee = role === 'employee';

    const [apiLoans, setApiLoans] = useState([]);
    const [apiApplications, setApiApplications] = useState([]);
    const [apiPayments, setApiPayments] = useState([]);
    const [apiActivityLogs, setApiActivityLogs] = useState([]);
    const [apiEmployeeCount, setApiEmployeeCount] = useState(0);
    const [apiCompanies, setApiCompanies] = useState([]);
    const [apiEmployees, setApiEmployees] = useState([]);
    const [apiSettlements, setApiSettlements] = useState([]);

    const fetchDashboardData = React.useCallback(() => {
        api.get('/loans/?page_size=200')
            .then(({ data }) => setApiLoans((data.results ?? data).map(mapLoan)))
            .catch(() => { });
        api.get('/applications/?page_size=200')
            .then(({ data }) => setApiApplications((data.results ?? data).map(mapApplication)))
            .catch(() => { });
        api.get('/payments/?page_size=200')
            .then(({ data }) => setApiPayments((data.results ?? data).map(mapPayment)))
            .catch(() => { });
        api.get('/activity-logs/')
            .then(({ data }) => setApiActivityLogs((data.results ?? data).map(mapActivityLog)))
            .catch(() => { });
        if (!isEmployee) {
            api.get('/employees/?page_size=1')
                .then(({ data }) => setApiEmployeeCount(data.count ?? (data.results ?? data).length))
                .catch(() => { });
            api.get('/companies/?page_size=200')
                .then(({ data }) => setApiCompanies((data.results ?? data).map(c => ({
                    id: String(c.id),
                    name: c.name,
                    code: c.abbreviation || c.code || '',
                    mouExpiryDate: c.mou_end_date || null,
                }))))
                .catch(() => { });
            api.get('/employees/?page_size=200')
                .then(({ data }) => setApiEmployees((data.results ?? data).map(e => ({
                    id: String(e.id),
                    companyId: String(e.company),
                }))))
                .catch(() => { });
            api.get('/settlements/?page_size=200')
                .then(({ data }) => setApiSettlements((data.results ?? data).map(s => ({
                    id: String(s.id),
                    settlementNo: s.settlement_no || '',
                    loanId: String(s.loan),
                    employeeName: s.employee_name || '',
                    amount: parseFloat(s.amount) || 0,
                    requestDate: s.request_date || s.created_at,
                    status: s.status,
                }))))
                .catch(() => { });
        }
    }, [isEmployee]);

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 30000);
        return () => clearInterval(interval);
    }, [fetchDashboardData]);

    const myLoans = useMemo(() => {
        if (!isEmployee) return apiLoans;
        const eid = String(currentUser?.employeeId);
        return apiLoans.filter(l => String(l.employeeId) === eid);
    }, [apiLoans, isEmployee, currentUser]);
    const myApplications = useMemo(() => {
        if (!isEmployee) return apiApplications;
        const eid = String(currentUser?.employeeId);
        return apiApplications.filter(a => String(a.employeeId) === eid);
    }, [apiApplications, isEmployee, currentUser]);
    const myPayments = useMemo(() => {
        if (!isEmployee) return apiPayments;
        const loanIds = new Set(myLoans.map(l => l.id));
        return apiPayments.filter(p => loanIds.has(p.loanId));
    }, [apiPayments, myLoans, isEmployee]);
    const myInstallments = useMemo(() => myLoans.flatMap(l => l.installments), [myLoans]);

    // ===== EMPLOYEE =====
    const activeLoans = useMemo(() => myLoans.filter(l => l.status === 'active'), [myLoans]);
    const paidOffLoans = useMemo(() =>
        myLoans.filter(l => l.status === 'paid_off')
            .map(loan => {
                const paidDates = loan.installments.map(i => i.paidDate).filter(Boolean).sort();
                return { ...loan, paidOffDate: paidDates[paidDates.length - 1] || loan.maturityDate };
            })
            .sort((a, b) => new Date(b.paidOffDate) - new Date(a.paidOffDate)),
        [myLoans]);
    const canApplyNewLoan = activeLoans.length === 0;

    const nextInstallment = useMemo(() => {
        if (!isEmployee) return null;
        return myInstallments
            .filter(i => i.status === 'unpaid' || i.status === 'overdue')
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0] || null;
    }, [isEmployee, myInstallments]);

    const overdueInstallments = useMemo(() =>
        isEmployee ? myInstallments.filter(i => i.status === 'overdue').length : 0,
        [isEmployee, myInstallments]);

    const activeLoanIds = useMemo(() => new Set(activeLoans.map(l => String(l.id))), [activeLoans]);
    const totalActivePrincipal = useMemo(() => activeLoans.reduce((s, l) => s + l.principalAmount, 0), [activeLoans]);
    const totalOutstanding = useMemo(() => activeLoans.reduce((s, l) => s + l.outstandingBalance, 0), [activeLoans]);
    const totalPaid = useMemo(() =>
        myPayments
            .filter(p => p.status === 'confirmed' && activeLoanIds.has(String(p.loanId)))
            .reduce((s, p) => s + p.amount, 0),
        [myPayments, activeLoanIds]);

    const loanProgressMap = useMemo(() => {
        if (!isEmployee) return {};
        const map = {};
        myLoans.forEach(loan => {
            const inst = myInstallments.filter(i => i.loanId === loan.id);
            map[loan.id] = { paid: inst.filter(i => i.status === 'paid').length, total: inst.length };
        });
        return map;
    }, [isEmployee, myLoans, myInstallments]);

    const recentPayments = useMemo(() =>
        isEmployee ? [...myPayments].sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)).slice(0, 5) : [],
        [isEmployee, myPayments]);

    const upcomingInstallments = useMemo(() =>
        isEmployee
            ? myInstallments.filter(i => i.status === 'unpaid' || i.status === 'overdue')
                .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
            : [],
        [isEmployee, myInstallments]);

    const recentApplications = useMemo(() =>
        [...myApplications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
        [myApplications]);

    const filteredActivityLogs = useMemo(() => apiActivityLogs, [apiActivityLogs]);

    // ===== ADMIN =====
    const stats = useMemo(() => {
        if (isEmployee) return null;
        const activeLoansData = apiLoans.filter(l => l.status === 'active');
        return {
            totalActiveLoans: activeLoansData.length,
            totalOutstandingBalance: activeLoansData.reduce((s, l) => s + l.outstandingBalance, 0),
            totalDisbursedAmount: apiLoans.reduce((s, l) => s + l.disbursedAmount, 0),
            totalCollections: apiPayments.filter(p => p.status === 'confirmed').reduce((s, p) => s + p.amount, 0),
            overdueLoans: apiLoans.filter(l => l.installments.some(i => i.status === 'overdue')).length,
            totalEmployees: apiEmployeeCount,
        };
    }, [isEmployee, apiLoans, apiPayments, apiEmployeeCount]);

    const pendingApplications = useMemo(() => {
        if (isEmployee) return [];
        // Admin/manager: pengajuan yang perlu diverifikasi. Finance: pengajuan yang sudah diverifikasi & menunggu persetujuan.
        if (role === 'finance') return apiApplications.filter(a => a.status === 'verified');
        return apiApplications.filter(a => ['submitted', 'under_review'].includes(a.status));
    }, [isEmployee, role, apiApplications]);

    const pendingSettlements = useMemo(() =>
        apiSettlements.filter(s => s.status === 'pending'),
        [apiSettlements]);

    const recentSettlements = useMemo(() =>
        isEmployee ? [] : [...apiSettlements].sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate)).slice(0, 5),
        [isEmployee, apiSettlements]);

    const overdueRate = useMemo(() => {
        if (!stats || stats.totalActiveLoans === 0) return 0;
        return Math.round((stats.overdueLoans / stats.totalActiveLoans) * 100);
    }, [stats]);

    const companyBreakdown = useMemo(() => {
        if (isEmployee || apiCompanies.length === 0) return [];
        return apiCompanies.map(company => {
            const employeeIds = new Set(
                apiEmployees.filter(e => String(e.companyId) === String(company.id)).map(e => e.id)
            );
            const companyLoans = apiLoans.filter(l => employeeIds.has(String(l.employeeId)));
            const activeCompanyLoans = companyLoans.filter(l => l.status === 'active');
            const loanIds = new Set(companyLoans.map(l => String(l.id)));
            return {
                ...company,
                employeeCount: employeeIds.size,
                activeLoans: activeCompanyLoans.length,
                totalOutstanding: activeCompanyLoans.reduce((s, l) => s + l.outstandingBalance, 0),
                overdueCount: activeCompanyLoans.filter(l => l.installments.some(i => i.status === 'overdue')).length,
                totalCollections: apiPayments.filter(p => p.status === 'confirmed' && loanIds.has(String(p.loanId))).reduce((s, p) => s + p.amount, 0),
            };
        });
    }, [isEmployee, apiCompanies, apiEmployees, apiLoans, apiPayments]);

    // ===== EMPLOYEE DASHBOARD =====
    if (isEmployee) {
        const hasOverdue = overdueInstallments > 0;
        const isAlert = nextInstallment && hasOverdue;
        const hasAnyLoan = myLoans.length > 0;

        return (
            <div className="space-y-5">
                {/* Greeting */}
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                    <div>
                        <h2 className="text-2xl font-bold">{getGreeting()}, {currentUser?.name?.split(' ')[0]}! 👋</h2>
                        <p className="text-sm text-muted-foreground">{getTodayString()}</p>
                    </div>
                    <Button onClick={() => navigate('loan-application')} disabled={!canApplyNewLoan} className="shrink-0">
                        <PlusCircle className="size-4 mr-1.5" />Ajukan Pinjaman
                    </Button>
                </div>

                {/* 3 Stat Cards */}
                <div className="flex flex-col sm:grid sm:gap-3 sm:grid-cols-3 gap-2">
                    <div className="flex items-center gap-3 px-3.5 py-2.5 sm:p-5 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20 border border-emerald-200/60 dark:border-emerald-800/30">
                        <div className="rounded-xl p-2 sm:p-2.5 bg-emerald-500 text-white shadow-sm shrink-0">
                            <Wallet className="size-4 sm:size-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] sm:text-xs text-emerald-700/70 dark:text-emerald-400/70 font-semibold uppercase tracking-wider leading-tight">Pinjaman</p>
                            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight text-emerald-900 dark:text-emerald-100 truncate">{formatCurrency(totalActivePrincipal)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 px-3.5 py-2.5 sm:p-5 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100/50 dark:from-teal-950/40 dark:to-teal-900/20 border border-teal-200/60 dark:border-teal-800/30">
                        <div className="rounded-xl p-2 sm:p-2.5 bg-teal-500 text-white shadow-sm shrink-0">
                            <CheckCircle2 className="size-4 sm:size-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] sm:text-xs text-teal-700/70 dark:text-teal-400/70 font-semibold uppercase tracking-wider leading-tight">Terbayar</p>
                            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight text-teal-900 dark:text-teal-100 truncate">{formatCurrency(totalPaid)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 px-3.5 py-2.5 sm:p-5 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/20 border border-amber-200/60 dark:border-amber-800/30">
                        <div className="rounded-xl p-2 sm:p-2.5 bg-amber-500 text-white shadow-sm shrink-0">
                            <TrendingUp className="size-4 sm:size-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] sm:text-xs text-amber-700/70 dark:text-amber-400/70 font-semibold uppercase tracking-wider leading-tight">Sisa Hutang</p>
                            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight text-amber-900 dark:text-amber-100 truncate">{formatCurrency(totalOutstanding)}</p>
                        </div>
                    </div>
                </div>

                {/* Empty State */}
                {!hasAnyLoan && myApplications.length === 0 && (
                    <Card className="border-dashed border-2">
                        <CardContent className="py-12 text-center">
                            <div className="mx-auto size-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                                <Wallet className="size-8 text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold">Belum Ada Pinjaman</h3>
                            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                                Anda belum memiliki riwayat pinjaman. Ajukan pinjaman untuk kebutuhan renovasi, pendidikan, atau keperluan lainnya.
                            </p>
                            <Button className="mt-4" onClick={() => navigate('loan-application')}>
                                <PlusCircle className="size-4 mr-1.5" />Ajukan Pinjaman
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Pinjaman Aktif */}
                {(activeLoans.length > 0 || nextInstallment) && (
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Pinjaman Aktif</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-3">
                            {nextInstallment && (
                                <div className={`rounded-xl p-3.5 flex items-center gap-3 ${isAlert ? 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800' : 'bg-primary/5 border border-primary/20'}`}>
                                    <div className={`rounded-xl p-2.5 shrink-0 ${isAlert ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400' : 'bg-primary/15 text-primary'}`}>
                                        {isAlert ? <AlertTriangle className="size-5" /> : <CalendarClock className="size-5" />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            {isAlert ? `${overdueInstallments} Angsuran Terlambat` : 'Angsuran Berikutnya'}
                                        </p>
                                        <p className="text-2xl sm:text-4xl font-bold mt-0.5 tabular-nums">{formatCurrency(nextInstallment.amount)}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            ke-{nextInstallment.installmentNo} · <span className={isAlert ? 'text-red-600 dark:text-red-400 font-medium' : 'font-medium'}>{formatDate(nextInstallment.dueDate)}</span>
                                        </p>
                                    </div>
                                </div>
                            )}
                            {activeLoans.map(loan => {
                                const progress = loanProgressMap[loan.id];
                                if (!progress) return null;
                                const percent = progress.total > 0 ? Math.round((progress.paid / progress.total) * 100) : 0;
                                const hasOverdueInst = myInstallments.some(i => i.loanId === loan.id && i.status === 'overdue');
                                return (
                                    <div key={loan.id} className={`rounded-xl border p-4 sm:p-5 space-y-3 ${hasOverdueInst ? 'border-red-200 bg-red-50/20 dark:border-red-800/40 dark:bg-red-950/10' : ''}`}>
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                                                <span className="font-bold text-base sm:text-lg">{loan.loanNo}</span>
                                                <Badge variant="secondary" className={`text-xs ${getStatusColor(loan.status)}`}>{getStatusLabel(loan.status)}</Badge>
                                                {hasOverdueInst && <Badge variant="secondary" className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Terlambat</Badge>}
                                                <span className="text-sm text-muted-foreground truncate">{formatCurrency(loan.principalAmount)} · {loan.tenor}bln</span>
                                            </div>
                                            <span className="text-3xl font-bold text-primary shrink-0">{percent}%</span>
                                        </div>
                                        <Progress value={percent} className={`h-3 ${hasOverdueInst ? '[&>div]:bg-red-500' : ''}`} />
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-sm">
                                            <span className="text-muted-foreground">{progress.paid}/{progress.total} angsuran · {formatCompactCurrency(loan.monthlyPayment)}/bln</span>
                                            <span className="font-bold">Sisa {formatCurrency(loan.outstandingBalance)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                )}

                {/* Riwayat & Pengajuan */}
                <Card>
                    <Tabs defaultValue="upcoming">
                        <CardHeader className="pb-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <CardTitle className="text-base">Riwayat & Pengajuan</CardTitle>
                                <TabsList className="h-10 sm:h-16 w-full sm:w-auto">
                                    <TabsTrigger value="upcoming" className="text-sm sm:text-base px-3 sm:px-6 h-8 sm:h-12 flex-1 sm:flex-initial">Tagihan</TabsTrigger>
                                    <TabsTrigger value="history" className="text-sm sm:text-base px-3 sm:px-6 h-8 sm:h-12 flex-1 sm:flex-initial">Riwayat</TabsTrigger>
                                    <TabsTrigger value="applications" className="text-sm sm:text-base px-3 sm:px-6 h-8 sm:h-12 flex-1 sm:flex-initial">Pengajuan</TabsTrigger>
                                </TabsList>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <TabsContent value="upcoming" className="mt-0">
                                {upcomingInstallments.length > 0 ? (
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                                        {upcomingInstallments.map((inst) => {
                                            const loan = myLoans.find(l => l.id === inst.loanId);
                                            const isOverdue = inst.status === 'overdue';
                                            const daysUntil = Math.ceil((new Date(inst.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
                                            return (
                                                <div key={inst.id} className={`p-3 sm:p-4 rounded-lg border cursor-pointer ${isOverdue ? 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20' : 'hover:bg-accent/50'} transition-colors`} onClick={() => navigate('installments', { loanId: inst.loanId })}>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2.5 sm:gap-3">
                                                            <div className={`size-8 sm:size-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${isOverdue ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-primary/10 text-primary'}`}>
                                                                {inst.installmentNo}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm sm:text-lg font-medium">{loan?.loanNo}</p>
                                                                <p className="text-xs sm:text-sm text-muted-foreground">{formatDate(inst.dueDate)}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm sm:text-lg font-semibold">{formatCurrency(inst.amount)}</p>
                                                            {isOverdue
                                                                ? <Badge variant="secondary" className={`text-xs ${getStatusColor('overdue')}`}>Terlambat</Badge>
                                                                : <span className="text-xs sm:text-sm text-muted-foreground">{daysUntil > 0 ? `${daysUntil} hari lagi` : 'Hari ini'}</span>
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground text-sm">
                                        <CheckCircle2 className="size-8 mx-auto mb-2 text-emerald-500 opacity-50" />
                                        <p>Tidak ada tagihan mendatang</p>
                                    </div>
                                )}
                            </TabsContent>
                            <TabsContent value="history" className="mt-0">
                                {recentPayments.length > 0 ? (
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                                        {recentPayments.map((pay) => {
                                            const loan = myLoans.find(l => l.id === pay.loanId);
                                            return (
                                                <div key={pay.id} className="p-3 sm:p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2.5 sm:gap-3">
                                                            <div className="size-8 sm:size-10 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                                <CheckCircle2 className="size-4 sm:size-5" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm sm:text-lg font-medium">{pay.paymentNo}</p>
                                                                <p className="text-xs sm:text-sm text-muted-foreground">{formatDate(pay.paymentDate)} · {loan?.loanNo}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm sm:text-lg font-semibold text-emerald-600 dark:text-emerald-400">+{formatCurrency(pay.amount)}</p>
                                                            <Badge variant="secondary" className={`text-xs sm:text-sm ${getStatusColor(pay.status)}`}>{getStatusLabel(pay.status)}</Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground text-sm">
                                        <CreditCard className="size-8 mx-auto mb-2 opacity-50" /><p>Belum ada pembayaran</p>
                                    </div>
                                )}
                            </TabsContent>
                            <TabsContent value="applications" className="mt-0">
                                {recentApplications.length > 0 ? (
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                                        {recentApplications.map((app) => (
                                            <div key={app.id} className="flex items-center justify-between p-3 sm:p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                                                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                                                    <div className="size-8 sm:size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                        <FileText className="size-4 sm:size-5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm sm:text-lg font-medium truncate">{app.loanPurpose}</p>
                                                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{app.applicationNo} · {app.tenor}bln · {formatAdminFee(app.adminFeeType, app.adminFee)}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0 ml-3">
                                                    <p className="text-sm sm:text-lg font-semibold">{formatCompactCurrency(app.loanAmount)}</p>
                                                    <Badge variant="secondary" className={`text-xs sm:text-sm ${getStatusColor(app.status)}`}>{getStatusLabel(app.status)}</Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground text-sm">
                                        <FileText className="size-8 mx-auto mb-2 opacity-50" /><p>Belum ada pengajuan</p>
                                    </div>
                                )}
                            </TabsContent>
                        </CardContent>
                    </Tabs>
                </Card>

                {/* Pinjaman Lunas */}
                {paidOffLoans.length > 0 && (
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between gap-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <CheckCircle2 className="size-4 text-emerald-500" />Pinjaman Lunas
                                </CardTitle>
                                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs">{paidOffLoans.length} lunas</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-3">
                            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/40 overflow-hidden overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20">
                                            <TableHead className="text-xs">No. Pinjaman</TableHead>
                                            <TableHead className="text-xs">Pokok</TableHead>
                                            <TableHead className="text-xs">Tenor</TableHead>
                                            <TableHead className="text-xs hidden sm:table-cell">Tanggal Lunas</TableHead>
                                            <TableHead className="text-xs text-right">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paidOffLoans.map(loan => (
                                            <TableRow key={loan.id}>
                                                <TableCell className="font-semibold text-sm whitespace-nowrap">{loan.loanNo}</TableCell>
                                                <TableCell className="text-sm whitespace-nowrap">{formatCurrency(loan.principalAmount)}</TableCell>
                                                <TableCell className="text-sm whitespace-nowrap">{loan.tenor} bln</TableCell>
                                                <TableCell className="text-sm text-muted-foreground hidden sm:table-cell whitespace-nowrap">{loan.paidOffDate ? formatDate(loan.paidOffDate) : '-'}</TableCell>
                                                <TableCell className="text-right">
                                                    <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Lunas</Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="rounded-xl border-2 border-dashed border-emerald-300 dark:border-emerald-700/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 text-center">
                                <HandCoins className="size-8 text-emerald-500 mx-auto mb-2" />
                                {canApplyNewLoan ? (
                                    <>
                                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-2">Pinjaman lunas! Anda bisa mengajukan pinjaman baru.</p>
                                        <Button onClick={() => navigate('loan-application')} className="bg-emerald-600 hover:bg-emerald-700">
                                            <PlusCircle className="size-4 mr-1.5" />Ajukan Pinjaman Baru
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-1">Anda masih memiliki pinjaman aktif.</p>
                                        <p className="text-xs text-muted-foreground">Lunasi pinjaman aktif terlebih dahulu untuk mengajukan pinjaman baru.</p>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        );
    }

    // ===== ADMIN / FINANCE / MANAGER DASHBOARD =====
    return (
        <div className="space-y-5">
            {/* Greeting */}
            <div>
                <h2 className="text-2xl font-bold">{getGreeting()}, {currentUser?.name?.split(' ')[0]}! 👋</h2>
                <p className="text-sm text-muted-foreground">{getTodayString()}</p>
            </div>

            {/* Alert Banners */}
            {(pendingApplications.length > 0 || pendingSettlements.length > 0 || (stats?.overdueLoans ?? 0) > 0) && (
                <div className="space-y-2">
                    {pendingApplications.length > 0 && (
                        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800/50">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg p-2 bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
                                    <FileText className="size-4" />
                                </div>
                                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                                    {pendingApplications.length} pengajuan menunggu persetujuan
                                </p>
                            </div>
                            <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-400 shrink-0" onClick={() => navigate('loan-approval')}>
                                Tinjau <ArrowRight className="size-3.5 ml-1" />
                            </Button>
                        </div>
                    )}
                    {pendingSettlements.length > 0 && (
                        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30 border border-teal-200 dark:border-teal-800/50">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg p-2 bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400">
                                    <ShieldCheck className="size-4" />
                                </div>
                                <p className="text-sm font-medium text-teal-800 dark:text-teal-300">
                                    {pendingSettlements.length} pelunasan dini menunggu verifikasi
                                </p>
                            </div>
                            <Button variant="outline" size="sm" className="border-teal-300 text-teal-700 hover:bg-teal-100 dark:border-teal-700 dark:text-teal-400 shrink-0" onClick={() => navigate('settlement')}>
                                Verifikasi <ArrowRight className="size-3.5 ml-1" />
                            </Button>
                        </div>
                    )}
                    {(stats?.overdueLoans ?? 0) > 0 && (
                        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border border-red-200 dark:border-red-800/50">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg p-2 bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400">
                                    <AlertTriangle className="size-4" />
                                </div>
                                <p className="text-sm font-medium text-red-800 dark:text-red-300">
                                    {stats.overdueLoans} pinjaman terlambat
                                </p>
                            </div>
                            <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-400 shrink-0" onClick={() => navigate('installments')}>
                                Cek <ArrowRight className="size-3.5 ml-1" />
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Stats — single card with grid dividers */}
            <Card className="overflow-hidden">
                <div className="grid grid-cols-2 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-border">
                    <div className="px-4 py-3.5 sm:px-5 sm:py-4">
                        <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total Outstanding</p>
                        <p className="text-xl sm:text-2xl font-extrabold tracking-tight mt-0.5">{formatCompactCurrency(stats?.totalOutstandingBalance ?? 0)}</p>
                        <div className="flex items-center gap-1 mt-1">
                            <TrendingUp className="size-3 text-amber-500" />
                            <span className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-400 font-medium">Saldo aktif</span>
                        </div>
                    </div>
                    <div className="px-4 py-3.5 sm:px-5 sm:py-4">
                        <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase tracking-wider">Pinjaman Aktif</p>
                        <p className="text-xl sm:text-2xl font-extrabold tracking-tight mt-0.5">{stats?.totalActiveLoans ?? 0}</p>
                        <div className="flex items-center gap-1 mt-1">
                            <Wallet className="size-3 text-emerald-500" />
                            <span className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-medium">dari {stats?.totalEmployees ?? 0} karyawan</span>
                        </div>
                    </div>
                    <div className="px-4 py-3.5 sm:px-5 sm:py-4">
                        <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total Disbursemen</p>
                        <p className="text-xl sm:text-2xl font-extrabold tracking-tight mt-0.5">{formatCompactCurrency(stats?.totalDisbursedAmount ?? 0)}</p>
                        <div className="flex items-center gap-1 mt-1">
                            <Banknote className="size-3 text-teal-500" />
                            <span className="text-[10px] sm:text-xs text-teal-600 dark:text-teal-400 font-medium">Dicairkan</span>
                        </div>
                    </div>
                    <div className="px-4 py-3.5 sm:px-5 sm:py-4">
                        <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total Koleksi</p>
                        <p className="text-xl sm:text-2xl font-extrabold tracking-tight mt-0.5">{formatCompactCurrency(stats?.totalCollections ?? 0)}</p>
                        <div className="flex items-center gap-1 mt-1">
                            <CreditCard className="size-3 text-cyan-500" />
                            <span className="text-[10px] sm:text-xs text-cyan-600 dark:text-cyan-400 font-medium">Terkumpul</span>
                        </div>
                    </div>
                    <div className="px-4 py-3.5 sm:px-5 sm:py-4 col-span-2 lg:col-span-1">
                        <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase tracking-wider">Tingkat Terlambat</p>
                        <div className="flex items-center gap-2 mt-0.5">
                            <p className={`text-xl sm:text-2xl font-extrabold tracking-tight ${overdueRate > 30 ? 'text-red-600' : overdueRate > 10 ? 'text-amber-600' : 'text-emerald-600'}`}>{overdueRate}%</p>
                            <Badge variant="secondary" className={`text-[10px] ${overdueRate > 30 ? 'bg-red-100 text-red-700' : overdueRate > 10 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                {stats?.overdueLoans ?? 0}/{stats?.totalActiveLoans ?? 0}
                            </Badge>
                        </div>
                        <Progress value={overdueRate} className={`h-1.5 mt-1.5 ${overdueRate > 30 ? '[&>div]:bg-red-500' : overdueRate > 10 ? '[&>div]:bg-amber-500' : '[&>div]:bg-emerald-500'}`} />
                    </div>
                </div>
            </Card>

            {/* Ringkasan Perusahaan */}
            <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Building2 className="size-4 text-primary" />Ringkasan Perusahaan
                        </CardTitle>
                        <Badge variant="secondary" className="text-xs">{companyBreakdown.length} perusahaan</Badge>
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Perusahaan</th>
                                    <th className="text-center py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Karyawan</th>
                                    <th className="text-center py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pinjaman Aktif</th>
                                    <th className="text-right py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Outstanding</th>
                                    <th className="text-center py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Terlambat</th>
                                    <th className="text-right py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Koleksi</th>
                                    <th className="text-right py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">MOU S/D</th>
                                </tr>
                            </thead>
                            <tbody>
                                {companyBreakdown.map((company) => {
                                    const mouDate = company.mouExpiryDate ? new Date(company.mouExpiryDate) : null;
                                    const now = new Date();
                                    const daysLeft = mouDate ? Math.ceil((mouDate - now) / (1000 * 60 * 60 * 24)) : null;
                                    const isMouExpired = daysLeft !== null && daysLeft <= 0;
                                    const isMouExpiring = daysLeft !== null && daysLeft > 0 && daysLeft < 90;
                                    return (
                                        <tr key={company.id} className="border-b last:border-0 hover:bg-accent/50 transition-colors">
                                            <td className="py-3 px-3">
                                                <p className="font-semibold text-sm">{company.name}</p>
                                                {company.code && <p className="text-xs text-muted-foreground">{company.code}</p>}
                                            </td>
                                            <td className="py-3 px-3 text-center font-semibold">{company.employeeCount}</td>
                                            <td className="py-3 px-3 text-center">
                                                {company.activeLoans > 0
                                                    ? <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs">{company.activeLoans}</Badge>
                                                    : <span className="text-muted-foreground">0</span>
                                                }
                                            </td>
                                            <td className="py-3 px-3 text-right font-semibold tabular-nums">
                                                {company.totalOutstanding > 0 ? formatCompactCurrency(company.totalOutstanding) : <span className="text-muted-foreground">-</span>}
                                            </td>
                                            <td className="py-3 px-3 text-center">
                                                {company.overdueCount > 0
                                                    ? <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs">{company.overdueCount}</Badge>
                                                    : <CheckCircle2 className="size-4 text-emerald-500 mx-auto" />
                                                }
                                            </td>
                                            <td className="py-3 px-3 text-right tabular-nums">
                                                {company.totalCollections > 0 ? formatCompactCurrency(company.totalCollections) : <span className="text-muted-foreground">-</span>}
                                            </td>
                                            <td className="py-3 px-3 text-right">
                                                <span className={`text-xs ${isMouExpired ? 'text-red-600 font-semibold' : isMouExpiring ? 'text-amber-600 font-semibold' : 'text-muted-foreground'}`}>
                                                    {company.mouExpiryDate ? formatDate(company.mouExpiryDate) : '-'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {companyBreakdown.length === 0 && (
                                    <tr><td colSpan={7} className="py-8 text-center text-muted-foreground text-sm">Belum ada data perusahaan</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile card view */}
                    <div className="md:hidden space-y-3">
                        {companyBreakdown.map((company) => {
                            const mouDate = company.mouExpiryDate ? new Date(company.mouExpiryDate) : null;
                            const now = new Date();
                            const daysLeft = mouDate ? Math.ceil((mouDate - now) / (1000 * 60 * 60 * 24)) : null;
                            const isMouExpired = daysLeft !== null && daysLeft <= 0;
                            const isMouExpiring = daysLeft !== null && daysLeft > 0 && daysLeft < 90;
                            return (
                                <div key={company.id} className="rounded-xl border p-3.5 space-y-2.5">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                                <Building2 className="size-4 text-primary" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-sm truncate">{company.name}</p>
                                                {company.code && <p className="text-xs text-muted-foreground">{company.code}</p>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {company.overdueCount > 0
                                                ? <Badge variant="secondary" className="bg-red-100 text-red-700 text-[10px]">{company.overdueCount} terlambat</Badge>
                                                : company.activeLoans > 0 && <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-[10px]">Sehat</Badge>
                                            }
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="rounded-lg bg-accent/50 p-2">
                                            <p className="text-lg font-bold">{company.employeeCount}</p>
                                            <p className="text-[10px] text-muted-foreground">Karyawan</p>
                                        </div>
                                        <div className="rounded-lg bg-accent/50 p-2">
                                            <p className="text-lg font-bold">{company.activeLoans}</p>
                                            <p className="text-[10px] text-muted-foreground">Pinjaman</p>
                                        </div>
                                        <div className="rounded-lg bg-accent/50 p-2">
                                            <p className="text-lg font-bold">{company.totalOutstanding > 0 ? formatCompactCurrency(company.totalOutstanding) : '-'}</p>
                                            <p className="text-[10px] text-muted-foreground">Outstanding</p>
                                        </div>
                                    </div>
                                    {company.mouExpiryDate && (
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">MOU s/d</span>
                                            <span className={isMouExpired ? 'text-red-600 font-semibold' : isMouExpiring ? 'text-amber-600 font-semibold' : ''}>
                                                {formatDate(company.mouExpiryDate)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {companyBreakdown.length === 0 && (
                            <p className="text-center py-6 text-muted-foreground text-sm">Belum ada data perusahaan</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Aktivitas & Pengajuan */}
            <Card>
                <Tabs defaultValue="pengajuan">
                    <CardHeader className="pb-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <CardTitle className="text-base">Aktivitas & Pengajuan</CardTitle>
                            <TabsList className="h-10 sm:h-12 w-full sm:w-auto">
                                <TabsTrigger value="pengajuan" className="text-xs sm:text-sm px-3 sm:px-5 h-8 sm:h-9 flex-1 sm:flex-initial">Pengajuan</TabsTrigger>
                                <TabsTrigger value="pelunasan" className="text-xs sm:text-sm px-3 sm:px-5 h-8 sm:h-9 flex-1 sm:flex-initial">Pelunasan</TabsTrigger>
                                <TabsTrigger value="aktivitas" className="text-xs sm:text-sm px-3 sm:px-5 h-8 sm:h-9 flex-1 sm:flex-initial">Aktivitas</TabsTrigger>
                            </TabsList>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <TabsContent value="pengajuan" className="mt-0">
                            {recentApplications.length > 0 ? (
                                <div className="space-y-3 max-h-[360px] overflow-y-auto custom-scrollbar">
                                    {recentApplications.map((app) => {
                                        const isPending = ['submitted', 'under_review'].includes(app.status);
                                        return (
                                            <div key={app.id} className="flex items-center justify-between p-3 sm:p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                                                onClick={() => isPending ? navigate('loan-approval') : navigate('loan-application', { applicationId: app.id })}>
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={`size-9 sm:size-10 rounded-full flex items-center justify-center shrink-0 ${isPending ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-primary/10 text-primary'}`}>
                                                        {isPending ? <Clock className="size-4 sm:size-5" /> : <FileText className="size-4 sm:size-5" />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm sm:text-base font-medium truncate">{app.employeeName}</p>
                                                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{app.applicationNo} · {app.loanPurpose}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0 ml-3">
                                                    <p className="text-sm sm:text-base font-semibold">{formatCompactCurrency(app.loanAmount)}</p>
                                                    <Badge variant="secondary" className={`text-[10px] sm:text-xs ${getStatusColor(app.status)}`}>{getStatusLabel(app.status)}</Badge>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-muted-foreground">
                                    <Wallet className="size-10 mx-auto mb-2 opacity-50" /><p className="text-sm">Belum ada pengajuan pinjaman</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="pelunasan" className="mt-0">
                            {recentSettlements.length > 0 ? (
                                <div className="space-y-3 max-h-[360px] overflow-y-auto custom-scrollbar">
                                    {recentSettlements.map((s) => (
                                        <div key={s.id} className="p-3 sm:p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => navigate('settlement')}>
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="size-8 sm:size-10 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 flex items-center justify-center shrink-0">
                                                        <ShieldCheck className="size-4 sm:size-5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm sm:text-base font-medium truncate">{s.employeeName || '-'}</p>
                                                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{s.settlementNo}</p>
                                                    </div>
                                                </div>
                                                <Badge variant="secondary" className={`text-[10px] sm:text-xs shrink-0 ${getStatusColor(s.status)}`}>{getStatusLabel(s.status)}</Badge>
                                            </div>
                                            <div className="mt-2 flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
                                                <span className="font-semibold text-foreground">{formatCurrency(s.amount)}</span>
                                                <span>{formatDate(s.requestDate)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-muted-foreground">
                                    <ShieldCheck className="size-10 mx-auto mb-2 opacity-50" /><p className="text-sm">Tidak ada pelunasan dini menunggu verifikasi</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="aktivitas" className="mt-0">
                            {filteredActivityLogs.length > 0 ? (
                                <div className="space-y-3 max-h-[360px] overflow-y-auto custom-scrollbar">
                                    {filteredActivityLogs.slice(0, 10).map((log) => {
                                        const iconMap = {
                                            submit_application: { icon: FileText, bg: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
                                            approve_application: { icon: CheckCircle2, bg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
                                            reject_application: { icon: XCircle, bg: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
                                            disburse_loan: { icon: Banknote, bg: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400' },
                                            record_payment: { icon: CreditCard, bg: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400' },
                                            add_employee: { icon: Users, bg: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400' },
                                        };
                                        const entry = iconMap[log.action] || { icon: Clock, bg: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' };
                                        const IconComp = entry.icon;
                                        return (
                                            <div key={log.id} className="flex gap-3 p-1">
                                                <div className={`size-8 sm:size-9 rounded-full flex items-center justify-center shrink-0 ${entry.bg}`}>
                                                    <IconComp className="size-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm sm:text-base">{log.details}</p>
                                                    <p className="text-xs sm:text-sm text-muted-foreground">{log.userName} · {getRelativeTime(log.createdAt)}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-muted-foreground text-sm">Belum ada aktivitas</div>
                            )}
                        </TabsContent>
                    </CardContent>
                </Tabs>
            </Card>
        </div>
    );
}

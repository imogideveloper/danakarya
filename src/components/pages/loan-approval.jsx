import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CheckCircle, XCircle, Clock, ShieldCheck, Download, Loader2, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/lib/store';
import api from '@/lib/api';
import { formatCurrency, formatDate, formatDateTime, getStatusColor, getStatusLabel, calculateMonthlyPayment, formatAdminFee, getInitials } from '@/lib/format';
import { toast } from 'sonner';
import { generateLoanApprovalPdf } from '@/lib/loan-document';

function mapApp(a) {
  return {
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
    signatureDocumentUrl: a.signature_document_url || null,
    selfieDocumentUrl: a.selfie_document_url || null,
    applicationDate: a.application_date,
    reviewedBy: a.reviewed_by_name || null,
    reviewedAt: a.reviewed_at,
    createdAt: a.created_at,
  };
}

export function LoanApprovalPage() {
  const { currentUser } = useAppStore();
  const role = currentUser?.role || '';
  const isAdmin = role === 'admin' || role === 'manager';
  const isFinance = role === 'finance';

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  const [actionType, setActionType] = useState('verify'); // 'verify' | 'approve' | 'rejected'
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [employeeLoans, setEmployeeLoans] = useState([]);
  const [loadingLoanCycle, setLoadingLoanCycle] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const fetchApplications = useCallback(async () => {
    try {
      const { data } = await api.get('/applications/?page_size=200');
      setApplications((data.results ?? data).map(mapApp));
    } catch {
      toast.error('Gagal memuat data pengajuan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  // Admin: acts on submitted/under_review. Finance: acts on verified.
  const pendingApps = isAdmin
    ? applications.filter(a => ['submitted', 'under_review'].includes(a.status))
    : applications.filter(a => a.status === 'verified');

  const verifiedApps = applications.filter(a => a.status === 'verified');
  const approvedApps = applications.filter(a => a.status === 'approved');
  const rejectedApps = applications.filter(a => a.status === 'rejected');

  const handleAction = (app, type) => {
    setSelectedApp(app);
    setActionType(type);
    setActionNotes('');
    setShowActionDialog(true);
  };

  const confirmAction = async () => {
    if (!selectedApp) return;
    setSubmitting(true);
    try {
      let endpoint, successMsg;
      if (actionType === 'verify') {
        endpoint = `/applications/${selectedApp.id}/verify/`;
        successMsg = 'Dokumen berhasil diverifikasi';
      } else if (actionType === 'approve') {
        endpoint = `/applications/${selectedApp.id}/approve/`;
        successMsg = 'Pinjaman berhasil disetujui';
      } else {
        endpoint = `/applications/${selectedApp.id}/reject/`;
        successMsg = 'Pinjaman berhasil ditolak';
      }
      const res = await api.post(endpoint, actionType === 'rejected' ? { notes: actionNotes } : {});
      const updated = mapApp(res.data);
      setApplications(prev => prev.map(a => a.id === updated.id ? updated : a));
      setShowActionDialog(false);
      toast.success(successMsg);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Gagal memproses pengajuan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetail = async (app) => {
    setSelectedApp(app);
    setShowDetailDialog(true);
    setEmployeeLoans([]);
    setSelectedEmployee(null);
    setSelectedCompany(null);
    setLoadingLoanCycle(true);
    try {
      const [loansRes, employeeRes] = await Promise.all([
        api.get(`/loans/?employee=${app.employeeId}&page_size=200`),
        api.get(`/employees/${app.employeeId}/`),
      ]);
      setEmployeeLoans(loansRes.data.results ?? loansRes.data);
      setSelectedEmployee(employeeRes.data);
      if (employeeRes.data?.company) {
        try {
          const { data: companyData } = await api.get(`/companies/${employeeRes.data.company}/`);
          setSelectedCompany(companyData);
        } catch { /* silent */ }
      }
    } catch { /* silent */ }
    finally { setLoadingLoanCycle(false); }
  };

  const loanCycleStats = useMemo(() => {
    const installments = employeeLoans.flatMap(l => l.installments || []);
    return {
      totalLoans: employeeLoans.length,
      paidOffCount: employeeLoans.filter(l => l.status === 'paid_off').length,
      overdueCount: installments.filter(i => i.status === 'overdue').length,
    };
  }, [employeeLoans]);

  const paymentHealth = useMemo(() => {
    if (loanCycleStats.overdueCount > 0) return { label: 'Perlu Perhatian', badgeClass: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
    if (loanCycleStats.totalLoans === 0) return { label: 'Belum Ada Riwayat', badgeClass: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' };
    return { label: 'Sehat', badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' };
  }, [loanCycleStats]);

  const handleDownloadPdf = async () => {
    if (!selectedApp) return;
    setGeneratingPdf(true);
    try {
      await generateLoanApprovalPdf({
        app: selectedApp,
        employee: selectedEmployee ? { employeeId: selectedEmployee.employee_id, position: selectedEmployee.position, department: selectedEmployee.department, employmentStatus: selectedEmployee.employment_status } : null,
        company: selectedCompany ? { name: selectedCompany.name, address: selectedCompany.address } : null,
        loanCycleStats,
        paymentHealth,
      });
    } catch {
      toast.error('Gagal membuat dokumen PDF');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const ApplicationRow = ({ app }) => (
    <TableRow className="cursor-pointer" onClick={() => handleViewDetail(app)}>
      <TableCell className="font-mono text-xs">{app.applicationNo}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Avatar className="size-7">
            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{getInitials(app.employeeName)}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{app.employeeName}</span>
        </div>
      </TableCell>
      <TableCell className="font-semibold">{formatCurrency(app.loanAmount)}</TableCell>
      <TableCell className="hidden md:table-cell text-sm">{app.loanPurpose}</TableCell>
      <TableCell className="hidden lg:table-cell text-sm">{app.tenor} bulan</TableCell>
      <TableCell>
        <Badge variant="secondary" className={`text-[10px] ${getStatusColor(app.status)}`}>
          {getStatusLabel(app.status)}
        </Badge>
      </TableCell>
    </TableRow>
  );

  const ApplicationCard = ({ app }) => (
    <div className="rounded-xl border p-3.5 space-y-2.5 cursor-pointer active:bg-muted/50 transition-colors" onClick={() => handleViewDetail(app)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar className="size-8 shrink-0">
            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{getInitials(app.employeeName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{app.employeeName}</p>
            <p className="font-mono text-[10px] text-muted-foreground">{app.applicationNo}</p>
          </div>
        </div>
        <Badge variant="secondary" className={`text-[10px] shrink-0 ${getStatusColor(app.status)}`}>
          {getStatusLabel(app.status)}
        </Badge>
      </div>
      <div className="flex items-center justify-between gap-2 pt-2 border-t text-sm">
        <span className="text-muted-foreground text-xs truncate">{app.loanPurpose} · {app.tenor} bulan</span>
        <span className="font-semibold shrink-0">{formatCurrency(app.loanAmount)}</span>
      </div>
    </div>
  );

  const ApplicationCardList = ({ apps, emptyText, EmptyIcon }) => (
    <div className="md:hidden p-3 space-y-2.5">
      {apps.map(app => <ApplicationCard key={app.id} app={app} />)}
      {apps.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          {EmptyIcon && <EmptyIcon className="size-10 mx-auto mb-2 opacity-50" />}
          <p>{emptyText}</p>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 grid-cols-3">
          {[1, 2, 3].map(i => <Card key={i}><CardContent className="p-4"><div className="h-8 bg-muted rounded animate-pulse" /></CardContent></Card>)}
        </div>
        <Card><CardContent className="p-4"><div className="h-40 bg-muted rounded animate-pulse" /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats — role-specific */}
      <div className="grid gap-2 sm:gap-4 grid-cols-3">
        <Card>
          <CardContent className="p-2.5 sm:p-4 flex flex-col items-center text-center gap-1 sm:flex-row sm:text-left sm:gap-3">
            <div className="rounded-lg bg-yellow-100 text-yellow-700 p-1.5 sm:p-2 dark:bg-yellow-900/30 dark:text-yellow-400">
              <Clock className="size-4 sm:size-5" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold leading-tight">{pendingApps.length}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{isAdmin ? 'Menunggu Verifikasi' : 'Menunggu Persetujuan'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2.5 sm:p-4 flex flex-col items-center text-center gap-1 sm:flex-row sm:text-left sm:gap-3">
            <div className={`rounded-lg p-1.5 sm:p-2 ${isAdmin ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
              {isAdmin ? <ShieldCheck className="size-4 sm:size-5" /> : <CheckCircle className="size-4 sm:size-5" />}
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold leading-tight">{isAdmin ? verifiedApps.length : approvedApps.length}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{isAdmin ? 'Terverifikasi' : 'Disetujui'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2.5 sm:p-4 flex flex-col items-center text-center gap-1 sm:flex-row sm:text-left sm:gap-3">
            <div className="rounded-lg bg-red-100 text-red-700 p-1.5 sm:p-2 dark:bg-red-900/30 dark:text-red-400">
              <XCircle className="size-4 sm:size-5" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold leading-tight">{rejectedApps.length}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">Ditolak</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="w-max">
            <TabsTrigger value="pending" className="gap-1">
              <Clock className="size-3" /> {isAdmin ? 'Menunggu' : 'Perlu Persetujuan'} ({pendingApps.length})
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="verified" className="gap-1">
                <ShieldCheck className="size-3" /> Terverifikasi ({verifiedApps.length})
              </TabsTrigger>
            )}
            <TabsTrigger value="approved" className="gap-1">
              <CheckCircle className="size-3" /> Disetujui ({approvedApps.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-1">
              <XCircle className="size-3" /> Ditolak ({rejectedApps.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Pending tab */}
        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No. Pengajuan</TableHead>
                      <TableHead>Pemohon</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead className="hidden md:table-cell">Tujuan</TableHead>
                      <TableHead className="hidden lg:table-cell">Tenor</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingApps.map(app => <ApplicationRow key={app.id} app={app} />)}
                  </TableBody>
                </Table>
                {pendingApps.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground">
                    <CheckCircle className="size-10 mx-auto mb-2 opacity-50" />
                    <p>Tidak ada pengajuan yang menunggu</p>
                  </div>
                )}
              </div>
              <ApplicationCardList apps={pendingApps} emptyText="Tidak ada pengajuan yang menunggu" EmptyIcon={CheckCircle} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Verified tab — admin only */}
        {isAdmin && (
          <TabsContent value="verified" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No. Pengajuan</TableHead>
                        <TableHead>Pemohon</TableHead>
                        <TableHead>Jumlah</TableHead>
                        <TableHead className="hidden md:table-cell">Tujuan</TableHead>
                        <TableHead className="hidden lg:table-cell">Tenor</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {verifiedApps.map(app => <ApplicationRow key={app.id} app={app} />)}
                    </TableBody>
                  </Table>
                  {verifiedApps.length === 0 && <div className="text-center py-10 text-muted-foreground"><p>Belum ada pengajuan terverifikasi</p></div>}
                </div>
                <ApplicationCardList apps={verifiedApps} emptyText="Belum ada pengajuan terverifikasi" />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Approved tab */}
        <TabsContent value="approved" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No. Pengajuan</TableHead>
                      <TableHead>Pemohon</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead className="hidden md:table-cell">Tujuan</TableHead>
                      <TableHead className="hidden lg:table-cell">Tenor</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvedApps.map(app => <ApplicationRow key={app.id} app={app} />)}
                  </TableBody>
                </Table>
                {approvedApps.length === 0 && <div className="text-center py-10 text-muted-foreground"><p>Belum ada pengajuan disetujui</p></div>}
              </div>
              <ApplicationCardList apps={approvedApps} emptyText="Belum ada pengajuan disetujui" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rejected tab */}
        <TabsContent value="rejected" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No. Pengajuan</TableHead>
                      <TableHead>Pemohon</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead className="hidden md:table-cell">Tujuan</TableHead>
                      <TableHead className="hidden lg:table-cell">Tenor</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rejectedApps.map(app => <ApplicationRow key={app.id} app={app} />)}
                  </TableBody>
                </Table>
                {rejectedApps.length === 0 && <div className="text-center py-10 text-muted-foreground"><p>Belum ada pengajuan ditolak</p></div>}
              </div>
              <ApplicationCardList apps={rejectedApps} emptyText="Belum ada pengajuan ditolak" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Confirmation Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === 'verify' && <><ShieldCheck className="size-5 text-blue-500" /> Verifikasi Dokumen</>}
              {actionType === 'approve' && <><CheckCircle className="size-5 text-emerald-500" /> Setujui Pinjaman</>}
              {actionType === 'rejected' && <><XCircle className="size-5 text-red-500" /> Tolak Pinjaman</>}
            </DialogTitle>
            <DialogDescription>
              {selectedApp && `${selectedApp.applicationNo} · ${selectedApp.employeeName} · ${formatCurrency(selectedApp.loanAmount)}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedApp && (
              <div className="grid grid-cols-2 gap-3 text-sm p-3 bg-muted rounded-lg">
                <div><span className="text-muted-foreground">Pemohon:</span><p className="font-medium">{selectedApp.employeeName}</p></div>
                <div><span className="text-muted-foreground">Jumlah:</span><p className="font-semibold">{formatCurrency(selectedApp.loanAmount)}</p></div>
                <div><span className="text-muted-foreground">Tenor:</span><p>{selectedApp.tenor} bulan</p></div>
                <div><span className="text-muted-foreground">Angsuran:</span><p className="font-semibold">{formatCurrency(calculateMonthlyPayment(selectedApp.loanAmount, selectedApp.tenor))}</p></div>
                <div><span className="text-muted-foreground">Biaya Admin:</span><p>{formatAdminFee(selectedApp.adminFeeType, selectedApp.adminFee)} ({formatCurrency(selectedApp.adminFeeAmount)})</p></div>
                <div><span className="text-muted-foreground">Diterima (Nett):</span><p className="font-semibold">{formatCurrency(selectedApp.disbursedAmount)}</p></div>
              </div>
            )}
            {actionType === 'verify' && (
              <p className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
                Dokumen telah diperiksa dan dinyatakan valid. Pengajuan akan diteruskan ke Finance untuk persetujuan.
              </p>
            )}
            <div className="space-y-2">
              <Label>Catatan {actionType === 'rejected' ? '(wajib)' : '(opsional)'}</Label>
              <Textarea value={actionNotes} onChange={e => setActionNotes(e.target.value)} placeholder="Tambahkan catatan..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionDialog(false)} disabled={submitting}>Batal</Button>
            <Button
              onClick={confirmAction}
              disabled={submitting || (actionType === 'rejected' && !actionNotes.trim())}
              className={actionType === 'verify' ? 'bg-blue-600 hover:bg-blue-700' : actionType === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}>
              {submitting ? 'Memproses...' : actionType === 'verify' ? 'Verifikasi' : actionType === 'approve' ? 'Setujui' : 'Tolak'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden max-h-[90vh]">
          <DialogTitle className="sr-only">Detail Pengajuan Pinjaman</DialogTitle>
          <DialogDescription className="sr-only">Detail pengajuan pinjaman karyawan</DialogDescription>
          {selectedApp && (
            <div className="flex flex-col sm:flex-row sm:h-[480px] max-h-[90vh] overflow-hidden">
              {/* Panel kiri */}
              <div className="sm:w-[45%] bg-gradient-to-b from-slate-700 to-slate-800 dark:from-slate-800 dark:to-slate-900 p-4 sm:px-6 sm:py-7 text-white flex flex-col gap-4 sm:h-full overflow-y-auto">
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarFallback className="bg-white/20 text-white text-sm font-bold">{getInitials(selectedApp.employeeName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-semibold leading-tight truncate">{selectedApp.employeeName}</p>
                    <p className="text-[11px] opacity-70">{selectedApp.applicationNo}</p>
                  </div>
                  <Badge variant="secondary" className={`ml-auto shrink-0 text-[10px] ${getStatusColor(selectedApp.status)}`}>
                    {getStatusLabel(selectedApp.status)}
                  </Badge>
                </div>
                <div className="bg-white/15 rounded-lg px-4 py-3">
                  <p className="text-[11px] opacity-75">Jumlah Pinjaman</p>
                  <p className="text-2xl font-bold tracking-tight">{formatCurrency(selectedApp.loanAmount)}</p>
                  <p className="text-[11px] opacity-70">{selectedApp.tenor} bulan · {selectedApp.loanPurpose}</p>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="opacity-75">Angsuran/Bulan</span>
                    <span className="font-semibold">{formatCurrency(calculateMonthlyPayment(selectedApp.loanAmount, selectedApp.tenor))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-75">Biaya Admin</span>
                    <span>{formatAdminFee(selectedApp.adminFeeType, selectedApp.adminFee)} ({formatCurrency(selectedApp.adminFeeAmount)})</span>
                  </div>
                  <div className="border-t border-white/20 pt-2 flex justify-between">
                    <span className="opacity-75">Diterima (Nett)</span>
                    <span className="font-bold text-sm">{formatCurrency(selectedApp.disbursedAmount)}</span>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs mt-auto">
                  <div className="flex justify-between">
                    <span className="opacity-75">Tanggal Pengajuan</span>
                    <span>{formatDate(selectedApp.applicationDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-75">Siklus Pinjaman</span>
                    <span>{loadingLoanCycle ? '...' : loanCycleStats.totalLoans === 0 ? 'Pertama' : `Ke-${loanCycleStats.paidOffCount + 1}`}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="opacity-75">Payment Health</span>
                    {loadingLoanCycle ? <span className="opacity-50">...</span> : <Badge variant="secondary" className={`text-[10px] ${paymentHealth.badgeClass}`}>{paymentHealth.label}</Badge>}
                  </div>
                </div>
              </div>

              {/* Panel kanan */}
              <div className="sm:flex-1 p-4 sm:p-6 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-3">
                  {selectedApp.notes && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1 uppercase tracking-wide">Catatan Pengajuan</p>
                      <p className="text-sm">{selectedApp.notes}</p>
                    </div>
                  )}
                  {(selectedApp.reviewedAt || selectedApp.reviewedBy) && (
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Riwayat Review</p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><p className="text-xs text-muted-foreground">Direview oleh</p><p className="font-medium">{selectedApp.reviewedBy || '-'}</p></div>
                        <div><p className="text-xs text-muted-foreground">Tanggal</p><p className="font-medium">{selectedApp.reviewedAt ? formatDateTime(selectedApp.reviewedAt) : '-'}</p></div>
                      </div>
                    </div>
                  )}
                  {(selectedApp.signatureDocumentUrl || selectedApp.selfieDocumentUrl) && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dokumen</p>
                      {selectedApp.signatureDocumentUrl && (
                        <a href={selectedApp.signatureDocumentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs px-3 py-2 rounded-md bg-muted hover:bg-accent transition-colors">
                          <FileText className="size-3.5 shrink-0" /> Tanda Tangan Digital
                        </a>
                      )}
                      {selectedApp.selfieDocumentUrl && (
                        <a href={selectedApp.selfieDocumentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs px-3 py-2 rounded-md bg-muted hover:bg-accent transition-colors">
                          <FileText className="size-3.5 shrink-0" /> Foto Selfie
                        </a>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 pt-4 border-t mt-4">
                  {isAdmin && ['submitted', 'under_review'].includes(selectedApp.status) && (
                    <Button variant="outline" className="gap-1 text-blue-600" onClick={() => { setShowDetailDialog(false); handleAction(selectedApp, 'verify'); }}>
                      <ShieldCheck className="size-4" /> Verifikasi
                    </Button>
                  )}
                  {isFinance && selectedApp.status === 'verified' && (
                    <Button variant="outline" className="gap-1 text-emerald-600" onClick={() => { setShowDetailDialog(false); handleAction(selectedApp, 'approve'); }}>
                      <CheckCircle className="size-4" /> Setujui
                    </Button>
                  )}
                  {(isAdmin || isFinance) && ['submitted', 'under_review', 'verified'].includes(selectedApp.status) && (
                    <Button variant="outline" className="gap-1 text-red-600" onClick={() => { setShowDetailDialog(false); handleAction(selectedApp, 'rejected'); }}>
                      <XCircle className="size-4" /> Tolak
                    </Button>
                  )}
                  <Button variant="default" className="gap-1 bg-gray-800 hover:bg-gray-900 text-white" disabled={generatingPdf || loadingLoanCycle} onClick={handleDownloadPdf}>
                    {generatingPdf ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                    {generatingPdf ? 'Membuat PDF...' : 'Unduh PDF'}
                  </Button>
                  <Button variant="outline" className="ml-auto" onClick={() => setShowDetailDialog(false)}>Tutup</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

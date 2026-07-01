import React, { useState, useEffect, useCallback } from 'react';
import { Banknote, CheckCircle, RefreshCw, Copy, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import api from '@/lib/api';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel, getInitials, formatAdminFee } from '@/lib/format';
import { useAppStore } from '@/lib/store';

const getLoanStatusLabel = (status) => status === 'active' ? 'In Payment' : getStatusLabel(status);

function mapApp(a) {
  return {
    id: String(a.id),
    applicationNo: a.application_no,
    employeeId: String(a.employee),
    employeeName: a.employee_name || '',
    loanAmount: a.loan_amount,
    loanPurpose: a.loan_purpose,
    tenor: a.tenor,
    adminFeeType: a.admin_fee_type,
    adminFee: parseFloat(a.admin_fee),
    adminFeeAmount: a.admin_fee_amount,
    disbursedAmount: a.disbursed_amount,
    status: a.status,
    applicationDate: a.application_date,
  };
}

function mapLoan(l) {
  return {
    id: String(l.id),
    loanNo: l.loan_no,
    employeeName: l.employee_name || '',
    principalAmount: l.principal_amount,
    disbursedAmount: l.disbursed_amount,
    outstandingBalance: l.outstanding_balance,
    monthlyPayment: l.monthly_payment,
    disbursementDate: l.disbursement_date,
    maturityDate: l.maturity_date,
    status: l.status,
  };
}

export function DisbursementPage() {
  const { currentUser } = useAppStore();
  const canDisburse = currentUser?.role === 'finance';
  const [approvedApps, setApprovedApps] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [copied, setCopied] = useState(false);
  const [disbursing, setDisbursing] = useState(false);
  const [disbursementDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [appsRes, loansRes] = await Promise.all([
        api.get('/applications/?status=approved&page_size=200'),
        api.get('/loans/?page_size=200'),
      ]);
      const allApps = (appsRes.data.results ?? appsRes.data).map(mapApp);
      const allLoans = (loansRes.data.results ?? loansRes.data).map(mapLoan);
      const loanAppIds = new Set(
        (loansRes.data.results ?? loansRes.data).map(l => String(l.application))
      );
      setApprovedApps(allApps.filter(a => !loanAppIds.has(a.id)));
      setLoans(allLoans);
    } catch {
      toast.error('Gagal memuat data pencairan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [appsRes, loansRes] = await Promise.all([
          api.get('/applications/?status=approved&page_size=200'),
          api.get('/loans/?page_size=200'),
        ]);
        const loanAppIds = new Set(
          (loansRes.data.results ?? loansRes.data).map(l => String(l.application))
        );
        setApprovedApps((appsRes.data.results ?? appsRes.data).map(mapApp).filter(a => !loanAppIds.has(a.id)));
      } catch { }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleDisburse = async (app) => {
    setSelectedApp(app);
    setSelectedEmployee(null);
    setNotes('');
    setShowDialog(true);
    try {
      const { data } = await api.get(`/employees/${app.employeeId}/`);
      setSelectedEmployee(data);
    } catch { /* silent */ }
  };

  const confirmDisbursement = async () => {
    if (!selectedApp) return;
    setDisbursing(true);
    try {
      await api.post(`/applications/${selectedApp.id}/disburse/`, {
        disbursement_date: disbursementDate,
        notes,
      });
      toast.success(`Pinjaman ${selectedApp.employeeName} berhasil dicairkan`);
      setShowDialog(false);
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Gagal mencairkan pinjaman');
    } finally {
      setDisbursing(false);
    }
  };

  const ongoingLoans = loans.filter(l => l.status !== 'paid_off');
  const totalDisbursed = ongoingLoans.reduce((s, l) => s + l.principalAmount, 0);
  const totalOutstanding = ongoingLoans.reduce((s, l) => s + (l.outstandingBalance ?? l.principalAmount), 0);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 text-amber-700 p-2 dark:bg-amber-900/30 dark:text-amber-400">
                <Banknote className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{approvedApps.length}</p>
                <p className="text-xs text-muted-foreground">Siap Cair</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 text-emerald-700 p-2 dark:bg-emerald-900/30 dark:text-emerald-400">
                <CheckCircle className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{ongoingLoans.length}</p>
                <p className="text-xs text-muted-foreground">Sudah Cair</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Disbursemen</p>
            <p className="text-xl font-bold">{formatCurrency(totalDisbursed)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Outstanding</p>
            <p className="text-xl font-bold">{formatCurrency(totalOutstanding)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Ready to Disburse */}
      {(approvedApps.length > 0 || loading) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Banknote className="size-4" /> Siap Pencairan
            </CardTitle>
            <CardDescription>Pengajuan yang telah disetujui dan siap dicairkan</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map(i => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {approvedApps.map(app => (
                  <div key={app.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="size-10 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary">{getInitials(app.employeeName)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{app.employeeName}</p>
                        <p className="text-xs text-muted-foreground truncate">{app.applicationNo} · {app.loanPurpose}</p>
                        <p className="text-xs text-muted-foreground">Tanggal Pengajuan: {app.applicationDate ? formatDate(app.applicationDate) : '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4 sm:shrink-0">
                      <div className="sm:text-right">
                        <p className="font-bold">{formatCurrency(app.loanAmount)}</p>
                        <p className="text-xs text-muted-foreground">{app.tenor} bulan</p>
                      </div>
                      {canDisburse && (
                        <Button onClick={() => handleDisburse(app)} className="gap-1 shrink-0">
                          <Banknote className="size-4" /> Cairkan
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Disbursed Loans Table */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Riwayat Pencairan</CardTitle>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-1">
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </CardHeader>
        <CardContent className="pt-0 p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Pinjaman</TableHead>
                  <TableHead>Peminjam</TableHead>
                  <TableHead>Pokok</TableHead>
                  <TableHead className="hidden md:table-cell">Angsuran/Bulan</TableHead>
                  <TableHead className="hidden sm:table-cell">Tanggal Pencairan</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Memuat...</TableCell></TableRow>
                ) : ongoingLoans.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Belum ada pinjaman yang dicairkan</TableCell></TableRow>
                ) : (
                  [...ongoingLoans].sort((a, b) => new Date(b.disbursementDate) - new Date(a.disbursementDate)).map(loan => (
                    <TableRow key={loan.id}>
                      <TableCell className="font-mono text-xs">{loan.loanNo}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="size-7">
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{getInitials(loan.employeeName)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{loan.employeeName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">{formatCurrency(loan.principalAmount)}</TableCell>
                      <TableCell className="hidden md:table-cell">{formatCurrency(loan.monthlyPayment)}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{loan.disbursementDate ? formatDate(loan.disbursementDate) : '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-[10px] ${getStatusColor(loan.status)}`}>
                          {getLoanStatusLabel(loan.status)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Disburse Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-5xl p-0 overflow-hidden max-h-[90vh]">
          <DialogTitle className="sr-only">Pencairan Pinjaman</DialogTitle>
          <DialogDescription className="sr-only">Form konfirmasi pencairan pinjaman karyawan</DialogDescription>
          {selectedApp && (
            <div className="flex flex-col sm:flex-row sm:h-[460px] max-h-[90vh] overflow-hidden">
              {/* Panel kiri — ringkasan */}
              <div className="sm:w-[48%] bg-gradient-to-b from-emerald-600 to-emerald-700 dark:from-emerald-800 dark:to-emerald-900 p-4 sm:px-7 sm:py-8 text-white flex flex-col gap-4 sm:gap-5 sm:h-full overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold shrink-0">
                    {getInitials(selectedApp.employeeName)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm leading-tight">{selectedApp.employeeName}</p>
                    <p className="text-[11px] opacity-70">{selectedApp.applicationNo}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1 opacity-70">
                    <Banknote className="size-3.5" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Pencairan</span>
                  </div>
                </div>

                {/* Jumlah pinjaman */}
                <div className="bg-white/15 rounded-lg px-3 py-2.5">
                  <p className="text-[11px] opacity-75">Jumlah Pinjaman</p>
                  <p className="text-xl font-bold tracking-tight leading-tight">{formatCurrency(selectedApp.loanAmount)}</p>
                  <p className="text-[11px] opacity-70">{selectedApp.tenor} bulan · {selectedApp.loanPurpose}</p>
                </div>

                {/* Rincian */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="opacity-75">Biaya Admin</span>
                    <span className="font-medium">{formatAdminFee(selectedApp.adminFeeType, selectedApp.adminFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-75">Potongan Admin</span>
                    <span className="font-medium text-red-200">- {formatCurrency(selectedApp.adminFeeAmount)}</span>
                  </div>
                  <div className="border-t border-white/20 pt-1.5 flex justify-between items-center">
                    <span className="opacity-75">Diterima (Nett)</span>
                    <span className="font-bold text-sm">{formatCurrency(selectedApp.disbursedAmount)}</span>
                  </div>
                </div>

              </div>

              {/* Panel kanan — form */}
              <div className="sm:flex-1 p-4 sm:p-8 flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Rekening tujuan transfer */}
                  <div className="rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-2">Rekening Tujuan Transfer</p>
                    {selectedEmployee?.bank_name || selectedEmployee?.account_number ? (
                      <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-sm">
                        <div><span className="text-xs text-muted-foreground">Bank</span><p className="font-semibold">{selectedEmployee.bank_name || '-'}</p></div>
                        <div>
                          <span className="text-xs text-muted-foreground">No. Rekening</span>
                          <div className="flex items-center gap-1.5">
                            <p className="font-mono font-semibold">{selectedEmployee.account_number || '-'}</p>
                            {selectedEmployee.account_number && (
                              <button type="button" onClick={() => { navigator.clipboard.writeText(selectedEmployee.account_number); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="text-muted-foreground hover:text-violet-600 transition-colors" title="Salin nomor rekening">
                                {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                              </button>
                            )}
                          </div>
                        </div>
                        <div><span className="text-xs text-muted-foreground">Nama Rekening</span><p className="font-semibold">{selectedEmployee.account_name || '-'}</p></div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">{selectedEmployee === null ? 'Memuat...' : 'Data rekening belum diisi.'}</p>
                    )}
                  </div>

                  {/* Form */}
                  <div>
                    <h3 className="font-semibold text-base sm:text-lg mb-1">Konfirmasi Pencairan</h3>
                    <p className="text-xs text-muted-foreground mb-3">Lengkapi detail transaksi sebelum mencairkan</p>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="space-y-2">
                        <Label>Tanggal Pencairan</Label>
                        <Input type="date" value={disbursementDate} disabled className="bg-muted cursor-not-allowed opacity-70" />
                      </div>
                      <div className="space-y-2">
                        <Label>Catatan <span className="text-muted-foreground text-xs">(opsional)</span></Label>
                        <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Catatan tambahan..." />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 pt-4 border-t mt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setShowDialog(false)} disabled={disbursing}>Batal</Button>
                  <Button onClick={confirmDisbursement} disabled={disbursing} className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-1">
                    {disbursing ? 'Mencairkan...' : <><CheckCircle className="size-4" /> Cairkan Pinjaman</>}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

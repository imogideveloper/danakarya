import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  AlertCircle, CheckCircle, FileText,
  Building2, QrCode, Copy, Clock, Upload, ChevronLeft, ChevronDown,
  ShieldCheck, Receipt, Loader2, X, Check, Eye, User
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAppStore } from '@/lib/store';
import api from '@/lib/api';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel, getInitials } from '@/lib/format';
import { toast } from 'sonner';

function mapLoan(l) {
  return {
    id: String(l.id),
    loanNo: l.loan_no,
    employeeId: l.employee,
    employeeName: l.employee_name || '',
    principalAmount: l.principal_amount,
    monthlyPayment: l.monthly_payment,
    outstandingBalance: l.outstanding_balance,
    tenor: l.tenor,
    status: l.status,
    installments: (l.installments || []).map(i => ({
      id: String(i.id),
      installmentNo: i.installment_no,
      dueDate: i.due_date,
      amount: i.amount,
      paidAmount: i.paid_amount || 0,
      remainingBalance: i.remaining_balance,
      status: i.status,
    })),
  };
}

function mapSettlement(s) {
  return {
    id: String(s.id),
    loanId: String(s.loan),
    loanNo: s.loan_no || '',
    employeeName: s.employee_name || '',
    settlementAmount: s.settlement_amount,
    remainingPrincipal: s.remaining_principal,
    penalty: s.penalty || 0,
    settlementDate: s.settlement_date,
    paymentMethod: s.payment_method,
    notes: s.notes || '',
    proofImageUrl: s.proof_image_url || null,
    status: s.status,
    createdAt: s.created_at,
  };
}

export function SettlementPage() {
  const { currentUser, selectedLoanId: navLoanId } = useAppStore();
  const role = currentUser?.role || 'employee';
  const isEmployee = role === 'employee';
  const canVerify = role === 'finance';

  const [loans, setLoans] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());

  const fetchData = useCallback(async () => {
    try {
      const [loansRes, settlementsRes, empRes] = await Promise.all([
        api.get('/loans/?page_size=200'),
        api.get('/settlements/?page_size=200'),
        api.get('/employees/?page_size=200'),
      ]);
      const loanList = (loansRes.data.results ?? loansRes.data).map(mapLoan);
      const settlementList = (settlementsRes.data.results ?? settlementsRes.data).map(mapSettlement);
      const empList = (empRes.data.results ?? empRes.data).map(e => ({
        id: String(e.id),
        employeeId: e.employee_id,
        companyName: e.company_name || '',
        department: e.department || '',
        salary: e.salary || 0,
      }));
      setLoans(loanList);
      setSettlements(settlementList);
      setEmployees(empList);
      if (navLoanId) {
        const target = loanList.find(l => l.id === String(navLoanId) && l.status === 'active');
        if (target) setSelectedLoan(target);
      }
    } catch {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [navLoanId]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useAutoRefresh(fetchData);

  const settledLoanIds = useMemo(() => new Set(settlements.filter(s => s.status !== 'rejected').map(s => s.loanId)), [settlements]);
  const activeLoans = useMemo(() =>
    loans.filter(l => l.status === 'active' && !settledLoanIds.has(l.id)),
    [loans, settledLoanIds]);

  const calculateSettlement = (loan) => {
    const paid = loan.installments.filter(i => i.status === 'paid');
    const unpaid = loan.installments.filter(i => i.status !== 'paid');
    const paidAmount = paid.reduce((s, i) => s + i.amount, 0);
    const remainingPrincipal = unpaid.reduce((s, i) => s + i.amount, 0);
    const penalty = 0;
    const totalSettlement = remainingPrincipal + penalty;
    const totalMonths = loan.installments.length;
    const progressPct = totalMonths > 0 ? (paid.length / totalMonths) * 100 : 0;
    return {
      paidAmount, paidMonths: paid.length,
      remainingPrincipal, remainingMonths: unpaid.length,
      totalMonths, penalty, totalSettlement, progressPct,
    };
  };

  const handleCopyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Berhasil disalin');
    } catch {
      toast.error('Gagal menyalin, silakan salin manual');
    }
  };

  const handleSubmitProof = async () => {
    if (!proofFile) { toast.error('Silakan unggah bukti pembayaran'); return; }
    if (!selectedLoan) return;
    const calc = calculateSettlement(selectedLoan);
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('loan', Number(selectedLoan.id));
      formData.append('settlement_amount', calc.totalSettlement);
      formData.append('remaining_principal', calc.remainingPrincipal);
      formData.append('penalty', 0);
      formData.append('settlement_date', new Date().toISOString().split('T')[0]);
      formData.append('payment_method', 'bank_transfer');
      formData.append('status', 'pending');
      formData.append('proof_image', proofFile);
      await api.post('/settlements/', formData);
      setSelectedLoan(null);
      setProofFile(null);
      toast.success('Bukti pembayaran berhasil dikirim', {
        description: 'Tim keuangan akan memverifikasi pembayaran Anda.',
      });
      await fetchData();
    } catch (err) {
      const msg = err.response?.data ? JSON.stringify(err.response.data) : 'Gagal mengirim bukti';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const settlementCalc = selectedLoan ? calculateSettlement(selectedLoan) : null;

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => (
          <Card key={i}><CardContent className="p-4"><div className="h-32 bg-muted rounded animate-pulse"/></CardContent></Card>
        ))}
      </div>
    );
  }

  // =============================================
  // EMPTY STATE
  // =============================================
  if (isEmployee && activeLoans.length === 0 && settlements.length === 0) {
    return (
      <div className="space-y-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 sm:p-8 text-center">
            <CheckCircle className="size-10 sm:size-16 mx-auto mb-3 text-primary/50" />
            <h3 className="font-semibold text-base sm:text-2xl">Tidak Ada Pinjaman Aktif</h3>
            <p className="text-xs sm:text-base text-muted-foreground mt-1">Anda tidak memiliki pinjaman yang dapat dilunasi dini</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // =============================================
  // PAYMENT SCREEN
  // =============================================
  if (selectedLoan && settlementCalc) {
    return (
      <div className="space-y-3 sm:space-y-6">
        <Button variant="ghost" size="sm" className="gap-1 -ml-2 text-muted-foreground text-xs sm:text-base" onClick={() => setSelectedLoan(null)}>
          <ChevronLeft className="size-4 sm:size-5" /> Kembali
        </Button>

        {/* Ringkasan Pelunasan */}
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-3 sm:p-6 space-y-2 sm:space-y-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center justify-center size-8 sm:size-11 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <Receipt className="size-4 sm:size-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm sm:text-xl">Pelunasan Dini</p>
                <p className="text-[10px] sm:text-base text-muted-foreground">{selectedLoan.loanNo} · {settlementCalc.remainingMonths} bulan tersisa</p>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0 text-[10px] sm:text-sm px-1.5 sm:px-3 py-0.5 sm:py-1">
                Tanpa Denda
              </Badge>
            </div>
            <Separator />
            <div className="space-y-1.5 sm:space-y-3 text-xs sm:text-lg">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sudah Terbayar ({settlementCalc.paidMonths} bulan)</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(settlementCalc.paidAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sisa Pokok ({settlementCalc.remainingMonths} bulan)</span>
                <span className="font-medium">{formatCurrency(settlementCalc.remainingPrincipal)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-semibold">Total Pelunasan</span>
                <span className="text-base sm:text-3xl font-bold text-emerald-600">{formatCurrency(settlementCalc.totalSettlement)}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-1.5 sm:p-3 rounded-md">
              <Clock className="size-3 sm:size-4 shrink-0" />
              <span>Selesaikan pembayaran sebelum batas waktu yang ditentukan</span>
            </div>
          </CardContent>
        </Card>

        {/* Metode Pembayaran */}
        <Card>
          <CardContent className="p-3 sm:p-6 space-y-3 sm:space-y-6">
            <p className="font-semibold text-sm sm:text-xl">Metode Pembayaran</p>
            <div className="p-2.5 sm:p-5 bg-muted/50 rounded-lg space-y-2 sm:space-y-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <Building2 className="size-4 sm:size-6 text-muted-foreground" />
                <span className="text-xs sm:text-lg font-semibold">Transfer Bank</span>
              </div>
              <div className="space-y-1.5 sm:space-y-3">
                {[
                  ['Bank', 'BCA'],
                  ['Nomor Rekening', '8120 3456 7890', '812034567890'],
                  ['Atas Nama', 'PT Danakarya Finance'],
                ].map(([label, value, copyVal]) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-base text-muted-foreground">{label}</span>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="text-xs sm:text-lg font-bold font-mono">{value}</span>
                      {copyVal && (
                        <Button variant="ghost" size="icon" className="size-5 sm:size-8" onClick={() => handleCopyText(copyVal)}>
                          <Copy className="size-3 sm:size-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-base text-muted-foreground">Jumlah</span>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="text-xs sm:text-lg font-bold text-emerald-600">{formatCurrency(settlementCalc.totalSettlement)}</span>
                    <Button variant="ghost" size="icon" className="size-5 sm:size-8" onClick={() => handleCopyText(String(settlementCalc.totalSettlement))}>
                      <Copy className="size-3 sm:size-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-1.5 sm:gap-2 text-[10px] sm:text-sm text-muted-foreground">
                <AlertCircle className="size-3 sm:size-4 mt-0.5 shrink-0" />
                <span>Pastikan nominal transfer sesuai. Transfer dari bank manapun diterima.</span>
              </div>
            </div>

            <div className="p-2.5 sm:p-5 bg-muted/50 rounded-lg space-y-2 sm:space-y-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <QrCode className="size-4 sm:size-6 text-muted-foreground" />
                <span className="text-xs sm:text-lg font-semibold">QRIS</span>
              </div>
              <div className="flex justify-center">
                <div className="w-36 h-36 sm:w-52 sm:h-52 bg-white rounded-xl border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                  <QrCode className="size-14 sm:size-20 text-muted-foreground/30" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-base text-muted-foreground">Jumlah</span>
                <span className="text-xs sm:text-lg font-bold text-emerald-600">{formatCurrency(settlementCalc.totalSettlement)}</span>
              </div>
              <div className="flex items-start gap-1.5 sm:gap-2 text-[10px] sm:text-sm text-muted-foreground">
                <AlertCircle className="size-3 sm:size-4 mt-0.5 shrink-0" />
                <span>Scan dengan GoPay, OVO, DANA, ShopeePay, atau mobile banking yang mendukung QRIS.</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload Bukti */}
        <Card>
          <CardContent className="p-3 sm:p-6 space-y-3 sm:space-y-5">
            <p className="font-semibold text-sm sm:text-xl">Konfirmasi Pembayaran</p>
            <div className="space-y-1 sm:space-y-2">
              <Label className="text-[10px] sm:text-base">Unggah Bukti Pembayaran</Label>
              <label className="block border-2 border-dashed rounded-lg p-3 sm:p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <Upload className="size-6 sm:size-12 mx-auto text-muted-foreground/50 mb-1 sm:mb-3" />
                <p className="text-[10px] sm:text-base text-muted-foreground">
                  {proofFile ? proofFile.name : 'Klik untuk unggah foto atau screenshot bukti bayar'}
                </p>
                <input type="file" accept="image/*" className="hidden" onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) setProofFile(file);
                }} />
              </label>
            </div>
            <div className="flex items-start gap-1.5 sm:gap-3 p-2 sm:p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <ShieldCheck className="size-4 sm:size-6 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
              <p className="text-[10px] sm:text-sm text-emerald-700 dark:text-emerald-300">
                Pembayaran Anda akan diverifikasi oleh tim keuangan dalam 1×24 jam. Setelah terverifikasi, status pinjaman akan diperbarui secara otomatis.
              </p>
            </div>
            <Button onClick={handleSubmitProof} disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2 text-sm sm:text-lg py-2 sm:py-5">
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4 sm:size-5" />}
              Kirim Bukti Pembayaran
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // =============================================
  // ADMIN / FINANCE VIEW
  // =============================================
  if (!isEmployee) {
    const pending = settlements.filter(s => s.status === 'pending');
    const all = [...settlements].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const handleConfirm = async (id) => {
      try {
        await api.post(`/settlements/${id}/confirm/`);
        toast.success('Pelunasan dikonfirmasi, pinjaman ditandai Lunas');
        await fetchData();
      } catch {
        toast.error('Gagal mengkonfirmasi');
      }
    };

    const handleReject = async (id) => {
      try {
        await api.post(`/settlements/${id}/reject/`);
        toast.success('Pelunasan ditolak');
        await fetchData();
      } catch {
        toast.error('Gagal menolak');
      }
    };

    const toggleExpand = (id) => {
      setExpandedIds(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
    };

    const statusStyle = (status) => ({
      'completed': 'bg-emerald-100 text-emerald-700',
      'pending': 'bg-amber-100 text-amber-700',
      'rejected': 'bg-red-100 text-red-700',
    }[status] || 'bg-muted text-muted-foreground');

    const statusLabel = (status) => ({ completed: 'Selesai', pending: 'Menunggu', rejected: 'Ditolak' }[status] || status);

    const SettlementCard = ({ st }) => {
      const loan = loans.find(l => l.id === st.loanId);
      const emp = employees.find(e => loan && String(e.id) === String(loan.employeeId));
      const isExpanded = expandedIds.has(st.id);
      const proofImageUrl = st.proofImageUrl || null;
      const proofFilename = proofImageUrl
        ? proofImageUrl.split('/').pop()
        : (st.notes?.startsWith('Bukti: ') ? st.notes.replace('Bukti: ', '') : null);

      return (
        <div className="border rounded-lg overflow-hidden bg-background">
          {/* Header row — clickable */}
          <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => toggleExpand(st.id)}>
            <Avatar className="size-10 shrink-0">
              <AvatarFallback className="bg-teal-100 text-teal-700 font-semibold text-sm">
                {getInitials(st.employeeName || '')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm">{st.employeeName || '-'}</p>
                <Badge className={`text-[10px] border-0 px-2 py-0.5 ${statusStyle(st.status)}`}>
                  {statusLabel(st.status)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {st.loanNo} · {emp?.companyName || '-'} · {formatCurrency(st.settlementAmount)}
              </p>
            </div>
            <div className="text-right shrink-0 mr-1">
              <p className="text-[10px] text-muted-foreground">Diajukan</p>
              <p className="text-xs font-medium">{formatDate(st.settlementDate)}</p>
            </div>
            <ChevronDown className={`size-4 text-muted-foreground transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`}/>
          </div>

          {/* Expanded detail */}
          {isExpanded && (
            <div className="border-t px-4 pb-4 space-y-4 pt-4">
              {/* Info Karyawan & Detail Pinjaman */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Info Karyawan</p>
                  <div className="space-y-2 text-sm">
                    {[
                      ['Nama', st.employeeName || '-'],
                      ['ID Karyawan', emp?.employeeId || '-'],
                      ['Perusahaan', emp?.companyName || '-'],
                      ['Departemen', emp?.department || '-'],
                      ['Gaji', formatCurrency(emp?.salary || 0)],
                    ].map(([label, val]) => (
                      <div key={label} className="flex justify-between gap-4">
                        <span className="text-muted-foreground shrink-0">{label}</span>
                        <span className="font-semibold text-right">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Detail Pinjaman</p>
                  <div className="space-y-2 text-sm">
                    {[
                      ['No Pinjaman', st.loanNo],
                      ['Pokok Pinjaman', formatCurrency(loan?.principalAmount || 0)],
                      ['Sisa Outstanding', formatCurrency(loan?.outstandingBalance || 0)],
                      ['Tenor', `${loan?.tenor || '-'} bulan`],
                      ['Angsuran/Bln', formatCurrency(loan?.monthlyPayment || 0)],
                    ].map(([label, val]) => (
                      <div key={label} className="flex justify-between gap-4">
                        <span className="text-muted-foreground shrink-0">{label}</span>
                        <span className="font-semibold text-right">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Rincian Pelunasan */}
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Rincian Pelunasan</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sisa Pokok</span>
                    <span>{formatCurrency(st.remainingPrincipal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Denda</span>
                    <span className="text-emerald-600 font-medium">{st.penalty > 0 ? formatCurrency(st.penalty) : 'Tanpa Denda'}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total Pelunasan</span>
                    <span className="text-emerald-600 text-base">{formatCurrency(st.settlementAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Bukti Pembayaran */}
              {proofFilename && (
                <>
                  <Separator />
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Bukti Pembayaran</p>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="size-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <FileText className="size-5 text-muted-foreground"/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{proofFilename}</p>
                        <p className="text-xs text-muted-foreground">Transfer Bank</p>
                      </div>
                      {proofImageUrl ? (
                        <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={() => window.open(proofImageUrl, '_blank')}>
                          <Eye className="size-3.5"/>Lihat
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" className="gap-1.5 shrink-0" disabled>
                          <Eye className="size-3.5"/>Lihat
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Action buttons */}
              {canVerify && st.status === 'pending' && (
                <div className="flex gap-2 pt-1">
                  <Button className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleConfirm(st.id)}>
                    <Check className="size-4"/>Konfirmasi
                  </Button>
                  <Button variant="outline" className="flex-1 gap-1.5 text-red-600 border-red-300 hover:bg-red-50" onClick={() => handleReject(st.id)}>
                    <X className="size-4"/>Tolak
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="space-y-4">
        <Tabs defaultValue="pending">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="pending" className="flex-1 sm:flex-none gap-2">
              Menunggu Verifikasi
              {pending.length > 0 && (
                <Badge className="size-5 rounded-full p-0 flex items-center justify-center text-[10px] bg-amber-500 text-white">{pending.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all" className="flex-1 sm:flex-none">Semua Riwayat</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            {pending.length > 0 ? (
              <div className="space-y-3">
                {pending.map(st => <SettlementCard key={st.id} st={st} />)}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <CheckCircle className="size-10 mx-auto mb-2 text-emerald-500 opacity-50" />
                  <p>Tidak ada pengajuan pelunasan yang menunggu</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="all" className="mt-4">
            {all.length > 0 ? (
              <div className="space-y-3">
                {all.map(st => <SettlementCard key={st.id} st={st} />)}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Receipt className="size-10 mx-auto mb-2 opacity-50" />
                  <p>Belum ada riwayat pelunasan</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // =============================================
  // MAIN VIEW
  // =============================================
  return (
    <div className="space-y-3 sm:space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-3 sm:p-5">
          <div className="flex items-start gap-2 sm:gap-4">
            <AlertCircle className="size-4 sm:size-7 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-xs sm:text-xl">Pelunasan Dini Tanpa Denda</p>
              <p className="text-[10px] sm:text-base text-muted-foreground mt-0.5 sm:mt-2">
                Anda dapat melunasi sisa pinjaman lebih cepat dari jadwal tanpa denda. Jumlah pelunasan dihitung berdasarkan sisa pokok yang belum terbayar.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {activeLoans.map(loan => {
        const calc = calculateSettlement(loan);
        return (
          <Card key={loan.id}>
            <CardContent className="p-3 sm:p-6 space-y-3 sm:space-y-5">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm sm:text-2xl">{loan.loanNo}</p>
                <Badge variant="outline" className="text-[10px] sm:text-sm">Aktif</Badge>
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between text-[10px] sm:text-base text-muted-foreground">
                  <span>Progress Pembayaran</span>
                  <span className="font-bold text-primary">{Math.round(calc.progressPct)}%</span>
                </div>
                <Progress value={calc.progressPct} className="h-2 sm:h-4" />
                <div className="flex items-center justify-between text-[10px] sm:text-base text-muted-foreground">
                  <span>{calc.paidMonths} bulan terbayar</span>
                  <span>{calc.remainingMonths} bulan tersisa</span>
                </div>
              </div>
              <Separator />
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between text-xs sm:text-lg">
                  <span className="text-muted-foreground">Total Pinjaman</span>
                  <span className="font-medium">{formatCurrency(loan.principalAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-lg">
                  <span className="text-muted-foreground">Sudah Terbayar ({calc.paidMonths} bulan)</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">− {formatCurrency(calc.paidAmount)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs sm:text-lg">Total Pelunasan Dini</span>
                  <div className="flex items-center gap-1.5 sm:gap-3">
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0 text-[10px] sm:text-xs px-1.5 sm:px-2.5 py-0.5 sm:py-1">
                      Tanpa Denda
                    </Badge>
                    <span className="text-base sm:text-3xl font-bold text-primary">{formatCurrency(calc.totalSettlement)}</span>
                  </div>
                </div>
              </div>
              <Button onClick={() => setSelectedLoan(loan)} className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-xs sm:text-lg py-2 sm:py-5">
                <FileText className="size-4 sm:size-5" />
                Ajukan Pelunasan Dini
              </Button>
            </CardContent>
          </Card>
        );
      })}

      {settlements.length > 0 && (
        <Card>
          <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-sm sm:text-2xl">Riwayat Pelunasan</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6 pt-0 space-y-2 sm:space-y-4">
            {settlements.map(st => {
              const loan = loans.find(l => l.id === st.loanId);
              return (
                <div key={st.id} className="flex items-center gap-1.5 sm:gap-3 border rounded-lg px-3 sm:px-4 py-2 sm:py-3 overflow-hidden">
                  <Receipt className="size-4 sm:size-5 shrink-0 text-muted-foreground" />
                  <span className="text-xs sm:text-xl font-semibold shrink-0">{loan?.loanNo || st.loanId}</span>
                  <span className="text-xs sm:text-base text-muted-foreground shrink-0">·</span>
                  <span className="text-xs sm:text-base text-muted-foreground shrink-0">{formatCurrency(st.settlementAmount)}</span>
                  <span className="hidden sm:inline text-base text-muted-foreground shrink-0">·</span>
                  <span className="hidden sm:inline text-base text-muted-foreground shrink-0">{st.paymentMethod === 'bank_transfer' ? 'Transfer' : st.paymentMethod === 'qris' ? 'QRIS' : st.paymentMethod}</span>
                  <div className="flex-1 min-w-0" />
                  <Badge variant="secondary" className={`text-[10px] sm:text-sm px-1.5 sm:px-3 py-0.5 shrink-0 whitespace-nowrap ${
                    st.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    st.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                    getStatusColor(st.status)
                  }`}>
                    {st.status === 'completed' ? 'Selesai' : st.status === 'pending' ? 'Menunggu' : getStatusLabel(st.status)}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

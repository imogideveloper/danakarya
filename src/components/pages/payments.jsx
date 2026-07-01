import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CreditCard, Plus, Search, CheckCircle, Loader2, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/lib/store';
import api from '@/lib/api';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel, getInitials } from '@/lib/format';
import { toast } from 'sonner';

function mapPayment(p) {
  return {
    id: String(p.id),
    loanId: String(p.loan),
    loanNo: p.loan_no || '',
    employeeName: p.employee_name || '',
    paymentNo: p.payment_no,
    amount: p.amount,
    paymentDate: p.payment_date,
    paymentMethod: p.payment_method,
    referenceNo: p.reference_no || '',
    notes: p.notes || '',
    status: p.status,
    proofImageUrl: p.proof_image_url || null,
    createdAt: p.created_at,
  };
}

function mapLoan(l) {
  return {
    id: String(l.id),
    loanNo: l.loan_no,
    employeeId: l.employee,
    employeeName: l.employee_name || '',
    principalAmount: l.principal_amount,
    monthlyPayment: l.monthly_payment,
    outstandingBalance: l.outstanding_balance,
    disbursementDate: l.disbursement_date,
    status: l.status,
  };
}

function mapSettlement(s) {
  return {
    id: String(s.id),
    loanId: String(s.loan),
    settlementAmount: s.settlement_amount,
    status: s.status,
  };
}

export function PaymentsPage() {
  const { currentUser } = useAppStore();
  const role = currentUser?.role || 'employee';
  const isEmployee = role === 'employee';

  const [payments, setPayments] = useState([]);
  const [loans, setLoans] = useState([]);
  const [paidOffLoans, setPaidOffLoans] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('payments');
  const [showRecordDialog, setShowRecordDialog] = useState(false);
  const [form, setForm] = useState({
    loanId: '',
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer',
    referenceNo: '',
    notes: '',
  });

  const fetchData = useCallback(async () => {
    try {
      const [paymentsRes, loansRes, paidOffRes, settlementsRes] = await Promise.all([
        api.get('/payments/?page_size=500'),
        api.get('/loans/?status=active&page_size=200'),
        api.get('/loans/?status=paid_off&page_size=200'),
        api.get('/settlements/?status=completed&page_size=200'),
      ]);
      setPayments((paymentsRes.data.results ?? paymentsRes.data).map(mapPayment));
      setLoans((loansRes.data.results ?? loansRes.data).map(mapLoan));
      setPaidOffLoans((paidOffRes.data.results ?? paidOffRes.data).map(mapLoan));
      setSettlements((settlementsRes.data.results ?? settlementsRes.data).map(mapSettlement));
    } catch {
      toast.error('Gagal memuat data pembayaran');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useAutoRefresh(fetchData);

  const activeLoans = useMemo(() => loans.filter(l => l.status === 'active'), [loans]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return [...payments]
      .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
      .filter(p =>
        p.paymentNo.toLowerCase().includes(q) ||
        p.employeeName.toLowerCase().includes(q) ||
        p.loanNo.toLowerCase().includes(q) ||
        p.referenceNo.toLowerCase().includes(q)
      );
  }, [payments, search]);

  const totalPaid = useMemo(() =>
    payments.filter(p => p.status === 'confirmed').reduce((s, p) => s + p.amount, 0),
    [payments]);

  const totalPaidByLoan = useMemo(() => {
    const map = {};
    payments.forEach(p => {
      if (p.status === 'confirmed') {
        map[p.loanId] = (map[p.loanId] || 0) + p.amount;
      }
    });
    settlements.forEach(s => {
      map[s.loanId] = (map[s.loanId] || 0) + s.settlementAmount;
    });
    return map;
  }, [payments, settlements]);

  const handleRecordPayment = async () => {
    if (!form.loanId || !form.amount) return;
    setSubmitting(true);
    try {
      await api.post('/payments/', {
        loan: Number(form.loanId),
        amount: form.amount,
        payment_date: form.paymentDate,
        payment_method: form.paymentMethod,
        reference_no: form.referenceNo,
        notes: form.notes,
        status: 'confirmed',
      });
      setShowRecordDialog(false);
      toast.success('Pembayaran berhasil dicatat');
      await fetchData();
    } catch (err) {
      const msg = err.response?.data ? JSON.stringify(err.response.data) : 'Gagal mencatat pembayaran';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedLoan = loans.find(l => l.id === form.loanId);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}><CardContent className="p-4"><div className="h-12 bg-muted rounded animate-pulse"/></CardContent></Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 text-emerald-700 p-2 dark:bg-emerald-900/30 dark:text-emerald-400">
                <CheckCircle className="size-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{isEmployee ? 'Total Pembayaran Saya' : 'Total Pembayaran'}</p>
                <p className="text-xl font-bold">{formatCurrency(totalPaid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Jumlah Transaksi</p>
            <p className="text-2xl font-bold">{payments.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Auto Debit</p>
            <p className="text-2xl font-bold">{payments.filter(p => p.paymentMethod === 'auto_debit').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Transfer Manual</p>
            <p className="text-2xl font-bold">{payments.filter(p => p.paymentMethod === 'bank_transfer').length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="payments">Riwayat Pembayaran</TabsTrigger>
          <TabsTrigger value="paid-off">Pinjaman Lunas</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-4 mt-4">
      {/* Search & Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Cari pembayaran..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        {!isEmployee && (
          <Button onClick={() => {
            setForm({ loanId: '', amount: 0, paymentDate: new Date().toISOString().split('T')[0], paymentMethod: 'bank_transfer', referenceNo: '', notes: '' });
            setShowRecordDialog(true);
          }}>
            <Plus className="size-4 mr-2" />Catat Pembayaran
          </Button>
        )}
      </div>

      {/* Payments Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Pembayaran</TableHead>
                  {!isEmployee && <TableHead>Peminjam</TableHead>}
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="hidden md:table-cell">Metode</TableHead>
                  {!isEmployee && <TableHead className="hidden lg:table-cell">Referensi</TableHead>}
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">Memuat...</TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      <CreditCard className="size-8 mx-auto mb-2 opacity-40" />
                      <p>{search ? 'Tidak ada hasil pencarian' : isEmployee ? 'Anda belum memiliki riwayat pembayaran' : 'Belum ada data pembayaran'}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-xs">{payment.paymentNo}</TableCell>
                      {!isEmployee && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="size-7">
                              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                {getInitials(payment.employeeName)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{payment.employeeName}</span>
                          </div>
                        </TableCell>
                      )}
                      <TableCell className="font-semibold">{formatCurrency(payment.amount)}</TableCell>
                      <TableCell className="text-sm">{formatDate(payment.paymentDate)}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="text-[10px]">{getStatusLabel(payment.paymentMethod)}</Badge>
                      </TableCell>
                      {!isEmployee && (
                        <TableCell className="hidden lg:table-cell font-mono text-xs text-muted-foreground">
                          {payment.referenceNo || '-'}
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className={`text-[10px] ${getStatusColor(payment.status)}`}>
                            {getStatusLabel(payment.status)}
                          </Badge>
                          {payment.proofImageUrl && (
                            <a href={payment.proofImageUrl} target="_blank" rel="noopener noreferrer" title="Lihat bukti pembayaran">
                              <FileText className="size-3.5 text-muted-foreground hover:text-primary" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="paid-off" className="mt-4">
          {/* Paid Off Loans Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No. Pinjaman</TableHead>
                      {!isEmployee && <TableHead>Peminjam</TableHead>}
                      <TableHead>Pokok</TableHead>
                      <TableHead className="hidden md:table-cell">Total Pembayaran</TableHead>
                      <TableHead className="hidden sm:table-cell">Tanggal Pencairan</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Memuat...</TableCell>
                      </TableRow>
                    ) : paidOffLoans.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                          <CheckCircle className="size-8 mx-auto mb-2 opacity-40" />
                          <p>{isEmployee ? 'Belum ada pinjaman Anda yang lunas' : 'Belum ada pinjaman yang lunas'}</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      [...paidOffLoans].sort((a, b) => new Date(b.disbursementDate) - new Date(a.disbursementDate)).map((loan) => (
                        <TableRow key={loan.id}>
                          <TableCell className="font-mono text-xs">{loan.loanNo}</TableCell>
                          {!isEmployee && (
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="size-7">
                                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                    {getInitials(loan.employeeName)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium">{loan.employeeName}</span>
                              </div>
                            </TableCell>
                          )}
                          <TableCell className="font-semibold">{formatCurrency(loan.principalAmount)}</TableCell>
                          <TableCell className="hidden md:table-cell">{formatCurrency(totalPaidByLoan[loan.id] || 0)}</TableCell>
                          <TableCell className="hidden sm:table-cell text-sm">{loan.disbursementDate ? formatDate(loan.disbursementDate) : '-'}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`text-[10px] ${getStatusColor(loan.status)}`}>
                              {loan.status === 'paid_off' ? 'Payment' : getStatusLabel(loan.status)}
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
        </TabsContent>
      </Tabs>

      {/* Record Payment Dialog */}
      {!isEmployee && (
        <Dialog open={showRecordDialog} onOpenChange={setShowRecordDialog}>
          <DialogContent className="sm:max-w-3xl p-0 overflow-hidden max-h-[90vh]">
            <DialogTitle className="sr-only">Catat Pembayaran</DialogTitle>
            <DialogDescription className="sr-only">Form pencatatan pembayaran angsuran pinjaman</DialogDescription>
            <div className="flex flex-col sm:flex-row sm:h-[440px] max-h-[90vh] overflow-hidden">
              {/* Panel kiri */}
              <div className="sm:w-[42%] bg-gradient-to-b from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 p-4 sm:px-6 sm:py-7 text-white flex flex-col gap-4 sm:h-full overflow-y-auto">
                <div className="flex items-center gap-2">
                  <CreditCard className="size-5 opacity-80" />
                  <h2 className="font-bold text-base">Catat Pembayaran</h2>
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] opacity-75 font-semibold uppercase tracking-wide">Pilih Pinjaman</p>
                  <Select value={form.loanId} onValueChange={v => {
                    const loan = loans.find(l => l.id === v);
                    setForm({ ...form, loanId: v, amount: loan?.monthlyPayment || 0 });
                  }}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white [&>span]:text-white focus:ring-white/30">
                      <SelectValue placeholder="Pilih pinjaman..." />
                    </SelectTrigger>
                    <SelectContent>
                      {activeLoans.map(loan => (
                        <SelectItem key={loan.id} value={loan.id}>
                          {loan.loanNo} — {loan.employeeName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedLoan ? (
                  <div className="space-y-3 text-xs">
                    <div className="bg-white/15 rounded-lg px-4 py-3">
                      <p className="opacity-75 mb-1">Angsuran/Bulan</p>
                      <p className="text-xl font-bold">{formatCurrency(selectedLoan.monthlyPayment)}</p>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-75">Peminjam</span>
                      <span className="font-medium">{selectedLoan.employeeName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-75">No. Pinjaman</span>
                      <span className="font-mono">{selectedLoan.loanNo}</span>
                    </div>
                    <div className="border-t border-white/20 pt-2 flex justify-between">
                      <span className="opacity-75">Sisa Pokok</span>
                      <span className="font-semibold">{formatCurrency(selectedLoan.outstandingBalance)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center opacity-40">
                    <p className="text-sm text-center">Pilih pinjaman untuk melihat detail</p>
                  </div>
                )}
              </div>

              {/* Panel kanan */}
              <div className="sm:flex-1 p-4 sm:p-6 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Jumlah Pembayaran (Rp)</Label>
                    <Input type="number" value={form.amount || ''} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Tanggal Pembayaran</Label>
                      <Input type="date" value={form.paymentDate} onChange={e => setForm({ ...form, paymentDate: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Metode</Label>
                      <Select value={form.paymentMethod} onValueChange={v => setForm({ ...form, paymentMethod: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bank_transfer">Transfer Bank</SelectItem>
                          <SelectItem value="cash">Tunai</SelectItem>
                          <SelectItem value="auto_debit">Auto Debit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>No. Referensi <span className="text-muted-foreground text-xs">(opsional)</span></Label>
                    <Input value={form.referenceNo} onChange={e => setForm({ ...form, referenceNo: e.target.value })} placeholder="No. referensi transfer" />
                  </div>
                  <div className="space-y-2">
                    <Label>Catatan <span className="text-muted-foreground text-xs">(opsional)</span></Label>
                    <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Catatan tambahan..." />
                  </div>
                </div>
                <div className="flex gap-3 pt-4 border-t mt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setShowRecordDialog(false)}>Batal</Button>
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleRecordPayment} disabled={!form.loanId || !form.amount || submitting}>
                    {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
                    Simpan Pembayaran
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

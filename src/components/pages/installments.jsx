import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppStore } from '@/lib/store';
import api from '@/lib/api';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/format';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';

export function InstallmentsPage() {
  const { navigate, currentUser, selectedLoanId: navLoanId } = useAppStore();
  const role = currentUser?.role || 'employee';
  const isEmployee = role === 'employee';

  const [loans, setLoans] = useState([]);
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoanId, setSelectedLoanId] = useState('');

  const fetchLoans = useCallback(() => {
    api.get('/loans/?page_size=200')
      .then(({ data }) => {
        const list = (data.results ?? data).map(l => ({
          id: String(l.id),
          loanNo: l.loan_no,
          employeeId: l.employee,
          employeeName: l.employee_name || '',
          principalAmount: l.principal_amount,
          monthlyPayment: l.monthly_payment,
          tenor: l.tenor,
          status: l.status,
          installments: (l.installments || []).map(i => ({
            id: String(i.id),
            loanId: String(l.id),
            installmentNo: i.installment_no,
            dueDate: i.due_date,
            amount: i.amount,
            paidAmount: i.paid_amount || 0,
            paidDate: i.paid_date || null,
            remainingBalance: i.remaining_balance,
            status: i.status,
          })),
        }));
        setLoans(list);
        setInstallments(list.flatMap(l => l.installments));
        const fromNav = navLoanId ? list.find(l => l.id === String(navLoanId)) : null;
        const firstActive = list.find(l => l.status === 'active');
        setSelectedLoanId(prev => prev || fromNav?.id || firstActive?.id || '');
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [navLoanId]);

  useEffect(() => { fetchLoans(); }, [fetchLoans]);
  useAutoRefresh(fetchLoans);

  const activeLoans = useMemo(() => loans.filter(l => l.status === 'active'), [loans]);
  const loanInstallments = useMemo(() => installments.filter(i => i.loanId === selectedLoanId), [installments, selectedLoanId]);
  const selectedLoan = useMemo(() => loans.find(l => l.id === selectedLoanId), [loans, selectedLoanId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Card><CardContent className="p-4"><div className="h-10 bg-muted rounded animate-pulse" /></CardContent></Card>
        <Card><CardContent className="p-4"><div className="h-60 bg-muted rounded animate-pulse" /></CardContent></Card>
      </div>
    );
  }

  if (isEmployee && activeLoans.length === 0) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6 text-center">
          <Calendar className="size-12 mx-auto mb-3 text-primary/50" />
          <h3 className="font-semibold text-lg">Tidak Ada Pinjaman Aktif</h3>
          <p className="text-sm text-muted-foreground mt-1">Anda belum memiliki pinjaman yang sedang berjalan</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('loan-application')}>
            Ajukan Pinjaman
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Loan Selector — admin/finance only */}
      {!isEmployee && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <Label className="text-sm font-medium shrink-0">Pilih Pinjaman:</Label>
              <Select value={selectedLoanId} onValueChange={setSelectedLoanId}>
                <SelectTrigger className="w-full sm:w-[400px]">
                  <SelectValue placeholder="Pilih pinjaman" />
                </SelectTrigger>
                <SelectContent>
                  {activeLoans.map(loan => (
                    <SelectItem key={loan.id} value={loan.id}>
                      {loan.loanNo} · {loan.employeeName} · {formatCurrency(loan.principalAmount)} · {formatCurrency(loan.monthlyPayment)}/bln
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedLoan && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Jadwal Angsuran — {selectedLoan.loanNo}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0 p-0">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary/10 hover:bg-primary/10 border-b-2 border-primary/20">
                    <TableHead className="w-[50px] text-primary font-bold">No</TableHead>
                    <TableHead className="text-primary font-bold">Jatuh Tempo</TableHead>
                    <TableHead className="text-primary font-bold">Angsuran</TableHead>
                    <TableHead className="text-primary font-bold">Dibayar</TableHead>
                    <TableHead className="hidden lg:table-cell text-primary font-bold">Sisa Pokok</TableHead>
                    <TableHead className="text-primary font-bold">Tgl Bayar</TableHead>
                    <TableHead className="text-primary font-bold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loanInstallments.map((inst) => (
                    <TableRow key={inst.id} className={inst.status === 'overdue' ? 'bg-red-50/50 dark:bg-red-900/10' : ''}>
                      <TableCell className="font-mono text-xs font-medium">{inst.installmentNo}</TableCell>
                      <TableCell className="text-sm">{formatDate(inst.dueDate)}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(inst.amount)}</TableCell>
                      <TableCell className={`text-sm ${inst.paidAmount > 0 ? 'font-semibold text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                        {inst.paidAmount > 0 ? formatCurrency(inst.paidAmount) : '-'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">{formatCurrency(inst.remainingBalance)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {inst.paidDate ? formatDate(inst.paidDate) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-[10px] ${getStatusColor(inst.status)}`}>
                          {getStatusLabel(inst.status)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {loanInstallments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                        Belum ada data angsuran
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile card view */}
            <div className="md:hidden space-y-3 p-4">
              {loanInstallments.map((inst) => (
                <div
                  key={inst.id}
                  className={`rounded-xl border p-3.5 space-y-2.5 ${inst.status === 'overdue' ? 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-xs font-medium text-muted-foreground shrink-0">#{inst.installmentNo}</span>
                      <span className="text-sm font-semibold truncate">{formatDate(inst.dueDate)}</span>
                    </div>
                    <Badge variant="secondary" className={`text-[10px] shrink-0 ${getStatusColor(inst.status)}`}>
                      {getStatusLabel(inst.status)}
                    </Badge>
                  </div>
                  <div className="text-sm divide-y divide-border/60">
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-muted-foreground">Angsuran</span>
                      <span className="font-semibold">{formatCurrency(inst.amount)}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-muted-foreground">Sisa Pokok</span>
                      <span className="font-medium">{formatCurrency(inst.remainingBalance)}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-muted-foreground">Dibayar</span>
                      <span className={inst.paidAmount > 0 ? 'font-semibold text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}>
                        {inst.paidAmount > 0 ? formatCurrency(inst.paidAmount) : '-'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-muted-foreground">Tgl Bayar</span>
                      <span className={inst.paidDate ? 'font-medium' : 'text-muted-foreground'}>
                        {inst.paidDate ? formatDate(inst.paidDate) : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {loanInstallments.length === 0 && (
                <div className="text-center py-10 text-muted-foreground text-sm">Belum ada data angsuran</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

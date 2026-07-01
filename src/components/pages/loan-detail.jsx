import React from 'react';
import { ArrowLeft, Banknote, CalendarClock, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAppStore } from '@/lib/store';
import { mockLoans, mockLoanApplications, mockInstallments, mockPayments } from '@/lib/mock-data';
import { formatCurrency, formatAdminFee, formatDate, getStatusColor, getStatusLabel, getInitials } from '@/lib/format';
export function LoanDetailPage() {
  const { selectedLoanId, navigate } = useAppStore();
  const loan = mockLoans.find(l => l.id === selectedLoanId) || mockLoans[0];
  const application = mockLoanApplications.find(a => a.id === loan?.applicationId);
  const installments = mockInstallments.filter(i => i.loanId === loan?.id);
  const payments = mockPayments.filter(p => p.loanId === loan?.id);
  if (!loan) {
    return (<div className="text-center py-10 text-muted-foreground">
      <p>Pinjaman tidak ditemukan</p>
      <Button variant="outline" onClick={() => navigate('dashboard')} className="mt-4">Kembali ke Dashboard</Button>
    </div>);
  }
  const paidCount = installments.filter(i => i.status === 'paid').length;
  const totalInstallments = installments.length;
  const progressPct = totalInstallments > 0 ? (paidCount / totalInstallments) * 100 : 0;
  return (<div className="space-y-4">
    {/* Back button */}
    <Button variant="ghost" onClick={() => navigate('dashboard')} className="gap-1 -ml-2">
      <ArrowLeft className="size-4" /> Kembali
    </Button>

    {/* Loan Header */}
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="size-14">
              <AvatarFallback className="text-lg bg-primary/10 text-primary">
                {getInitials(loan.employeeName || '')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{loan.loanNo}</h2>
              <p className="text-muted-foreground">{loan.employeeName}</p>
              <div className="flex gap-2 mt-1">
                <Badge variant="secondary" className={getStatusColor(loan.status)}>{getStatusLabel(loan.status)}</Badge>
                {application && <Badge variant="outline">{application.loanPurpose}</Badge>}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Outstanding</p>
            <p className="text-2xl font-bold">{formatCurrency(loan.outstandingBalance)}</p>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Stats Grid */}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg bg-emerald-100 text-emerald-700 p-2 dark:bg-emerald-900/30 dark:text-emerald-400">
            <Banknote className="size-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Pokok Pinjaman</p>
            <p className="text-lg font-bold">{formatCurrency(loan.principalAmount)}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg bg-amber-100 text-amber-700 p-2 dark:bg-amber-900/30 dark:text-amber-400">
            <CreditCard className="size-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Angsuran/Bulan</p>
            <p className="text-lg font-bold">{formatCurrency(loan.monthlyPayment)}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg bg-teal-100 text-teal-700 p-2 dark:bg-teal-900/30 dark:text-teal-400">
            <CalendarClock className="size-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tenor</p>
            <p className="text-lg font-bold">{loan.tenor} bulan</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between mb-1">
            <p className="text-sm text-muted-foreground">Progress</p>
            <p className="text-sm font-medium">{Math.round(progressPct)}%</p>
          </div>
          <Progress value={progressPct} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">{paidCount}/{totalInstallments} angsuran terbayar</p>
        </CardContent>
      </Card>
    </div>

    {/* Loan Details */}
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Detail Pinjaman</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div><span className="text-muted-foreground">No. Pinjaman:</span><p className="font-mono">{loan.loanNo}</p></div>
            <div><span className="text-muted-foreground">No. Pengajuan:</span><p className="font-mono">{application?.applicationNo}</p></div>
            <div><span className="text-muted-foreground">Biaya Admin:</span><p>{formatAdminFee(loan.adminFeeType, loan.adminFee)}</p></div>
            <div><span className="text-muted-foreground">Total Biaya Admin:</span><p>{formatCurrency(loan.adminFeeAmount)}</p></div>
            <div><span className="text-muted-foreground">Diterima (Nett):</span><p className="font-semibold">{formatCurrency(loan.disbursedAmount)}</p></div>
            <div><span className="text-muted-foreground">Total Pembayaran:</span><p className="font-semibold">{formatCurrency(loan.totalPayment)}</p></div>
            <div><span className="text-muted-foreground">Tanggal Cair:</span><p>{loan.disbursementDate ? formatDate(loan.disbursementDate) : '-'}</p></div>
            <div><span className="text-muted-foreground">Jatuh Tempo:</span><p>{loan.maturityDate ? formatDate(loan.maturityDate) : '-'}</p></div>
          </div>
          {application?.notes && (<>
            <Separator />
            <div><span className="text-muted-foreground">Catatan:</span><p className="mt-1 p-2 bg-muted rounded-md">{application.notes}</p></div>
          </>)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Riwayat Pembayaran</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Metode</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map(p => (<TableRow key={p.id}>
                <TableCell className="font-mono text-xs">{p.paymentNo}</TableCell>
                <TableCell className="text-sm">{formatDate(p.paymentDate)}</TableCell>
                <TableCell className="font-semibold">{formatCurrency(p.amount)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[10px]">{getStatusLabel(p.paymentMethod)}</Badge>
                </TableCell>
              </TableRow>))}
              {payments.length === 0 && (<TableRow>
                <TableCell colSpan={4} className="text-center py-4 text-muted-foreground text-sm">Belum ada pembayaran</TableCell>
              </TableRow>)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>

    {/* Installment Schedule */}
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Jadwal Angsuran</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Jatuh Tempo</TableHead>
                <TableHead>Angsuran</TableHead>
                <TableHead className="hidden lg:table-cell">Sisa Pokok</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {installments.map(inst => (<TableRow key={inst.id} className={inst.status === 'overdue' ? 'bg-red-50/50 dark:bg-red-900/10' : ''}>
                <TableCell className="font-mono text-xs">{inst.installmentNo}</TableCell>
                <TableCell className="text-sm">{formatDate(inst.dueDate)}</TableCell>
                <TableCell className="font-semibold">{formatCurrency(inst.amount)}</TableCell>
                <TableCell className="hidden lg:table-cell text-sm">{formatCurrency(inst.remainingBalance)}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={`text-[10px] ${getStatusColor(inst.status)}`}>
                    {getStatusLabel(inst.status)}
                  </Badge>
                </TableCell>
              </TableRow>))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  </div>);
}

import React from 'react';
import { ArrowLeft, Mail, Phone, Building2, MapPin, Calendar, Wallet, FileText, Cake, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/lib/store';
import { mockEmployees, mockLoans, mockLoanApplications } from '@/lib/mock-data';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel, getInitials, calculateAge, getEmploymentStatusLabel, getEmploymentStatusColor, getMaritalStatusLabel, getMaritalStatusColor } from '@/lib/format';
export function EmployeeDetailPage() {
  const { selectedEmployeeId, navigate } = useAppStore();
  const employee = mockEmployees.find(e => e.id === selectedEmployeeId) || mockEmployees[0];
  const employeeLoans = mockLoans.filter(l => l.employeeId === employee?.id);
  const employeeApplications = mockLoanApplications.filter(a => a.employeeId === employee?.id);
  if (!employee) {
    return (<div className="text-center py-10 text-muted-foreground">
      <p>Karyawan tidak ditemukan</p>
      <Button variant="outline" onClick={() => navigate('employees')} className="mt-4">Kembali</Button>
    </div>);
  }
  const activeLoan = employeeLoans.find(l => l.status === 'active');
  const totalOutstanding = employeeLoans.reduce((s, l) => s + l.outstandingBalance, 0);
  return (<div className="space-y-4">
    <Button variant="ghost" onClick={() => navigate('employees')} className="gap-1 -ml-2">
      <ArrowLeft className="size-4" /> Kembali
    </Button>

    {/* Employee Header */}
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <Avatar className="size-20">
            <AvatarFallback className="text-2xl bg-primary/10 text-primary">
              {getInitials(employee.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">{employee.name}</h2>
              <Badge variant="secondary" className={getEmploymentStatusColor(employee.employmentStatus)}>
                {getEmploymentStatusLabel(employee.employmentStatus)}
              </Badge>
              <Badge variant="secondary" className={getMaritalStatusColor(employee.maritalStatus)}>
                {getMaritalStatusLabel(employee.maritalStatus)}
              </Badge>
              <Badge variant="secondary" className={getStatusColor(employee.status)}>
                {getStatusLabel(employee.status)}
              </Badge>
            </div>
            <p className="text-muted-foreground">{employee.position} · {employee.department}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="size-4" /> {employee.email}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="size-4" /> {employee.phone}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="size-4" /> {employee.employeeId}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="size-4" /> {employee.birthPlace}, {formatDate(employee.birthDate)}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Cake className="size-4" /> {calculateAge(employee.birthDate)} tahun
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <ShieldCheck className="size-4" /> {getEmploymentStatusLabel(employee.employmentStatus)}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="size-4" /> Bergabung {formatDate(employee.joinDate)}
              </div>
            </div>
            {employee.address && (<div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="size-4" /> {employee.address}
            </div>)}
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Gaji</p>
            <p className="text-2xl font-bold">{formatCurrency(employee.salary)}</p>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Loan Summary */}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg bg-emerald-100 text-emerald-700 p-2 dark:bg-emerald-900/30 dark:text-emerald-400">
            <Wallet className="size-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Pinjaman</p>
            <p className="text-xl font-bold">{employeeLoans.length}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg bg-amber-100 text-amber-700 p-2 dark:bg-amber-900/30 dark:text-amber-400">
            <FileText className="size-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Outstanding</p>
            <p className="text-xl font-bold">{formatCurrency(totalOutstanding)}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Pinjaman Aktif</p>
          <p className="text-xl font-bold">{employeeLoans.filter(l => l.status === 'active').length}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Pinjaman Lunas</p>
          <p className="text-xl font-bold">{employeeLoans.filter(l => l.status === 'paid_off' || l.status === 'settled').length}</p>
        </CardContent>
      </Card>
    </div>

    {/* Active Loan Details */}
    {activeLoan && (<Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Pinjaman Aktif - {activeLoan.loanNo}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div><span className="text-muted-foreground">Pokok:</span><p className="font-semibold">{formatCurrency(activeLoan.principalAmount)}</p></div>
          <div><span className="text-muted-foreground">Outstanding:</span><p className="font-semibold text-amber-600">{formatCurrency(activeLoan.outstandingBalance)}</p></div>
          <div><span className="text-muted-foreground">Angsuran:</span><p className="font-semibold">{formatCurrency(activeLoan.monthlyPayment)}</p></div>
          <div><span className="text-muted-foreground">Tenor:</span><p>{activeLoan.tenor} bulan</p></div>
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm">Progress Pembayaran</span>
            <span className="text-sm font-medium">
              {Math.round(((activeLoan.principalAmount - activeLoan.outstandingBalance) / activeLoan.principalAmount) * 100)}%
            </span>
          </div>
          <Progress value={((activeLoan.principalAmount - activeLoan.outstandingBalance) / activeLoan.principalAmount) * 100} className="h-2" />
        </div>
      </CardContent>
    </Card>)}

    {/* Loan History */}
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Riwayat Pinjaman</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {employeeLoans.length === 0 && employeeApplications.length === 0 ? (<p className="text-center py-6 text-muted-foreground">Belum ada riwayat pinjaman</p>) : (<div className="space-y-3">
          {employeeLoans.map(loan => (<div key={loan.id} className="border rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{loan.loanNo}</p>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(loan.principalAmount)} · {loan.tenor} bulan · {loan.disbursementDate ? formatDate(loan.disbursementDate) : '-'}
              </p>
            </div>
            <Badge variant="secondary" className={getStatusColor(loan.status)}>
              {getStatusLabel(loan.status)}
            </Badge>
          </div>))}
          {employeeApplications.filter(a => !employeeLoans.some(l => l.applicationId === a.id)).map(app => (<div key={app.id} className="border rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{app.applicationNo}</p>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(app.loanAmount)} · {app.loanPurpose} · {formatDate(app.applicationDate)}
              </p>
            </div>
            <Badge variant="secondary" className={getStatusColor(app.status)}>
              {getStatusLabel(app.status)}
            </Badge>
          </div>))}
        </div>)}
      </CardContent>
    </Card>
  </div>);
}

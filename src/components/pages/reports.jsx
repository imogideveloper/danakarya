import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AlertTriangle, Building2, Banknote, Download, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppStore } from '@/lib/store';
import api from '@/lib/api';
import { formatCurrency, formatNumber, formatDate, formatDateTime, getStatusColor, getStatusLabel } from '@/lib/format';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function formatMonthLabel(yyyyMM) {
  const [year, month] = yyyyMM.split('-');
  return `${MONTH_NAMES[Number(month) - 1]} ${year}`;
}

function mapLoan(l) {
  return {
    id: String(l.id),
    loanNo: l.loan_no,
    employeeId: String(l.employee),
    employeeName: l.employee_name || '',
    principalAmount: parseFloat(l.principal_amount) || 0,
    outstandingBalance: parseFloat(l.outstanding_balance) || 0,
    adminFeeAmount: parseFloat(l.admin_fee_amount) || 0,
    disbursementDate: l.disbursement_date || null,
    status: l.status,
    installments: l.installments || [],
  };
}

export function ReportsPage() {
  const { currentUser } = useAppStore();
  const isFinance = currentUser?.role === 'finance';

  const [loans, setLoans] = useState([]);
  const [overdueInstallments, setOverdueInstallments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCompanies, setExpandedCompanies] = useState(new Set());

  const toggleCompany = (companyId) => {
    setExpandedCompanies(prev => {
      const next = new Set(prev);
      if (next.has(companyId)) next.delete(companyId);
      else next.add(companyId);
      return next;
    });
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [loansRes, employeesRes, companiesRes] = await Promise.all([
        api.get('/loans/?page_size=500'),
        api.get('/employees/?page_size=500'),
        api.get('/companies/?page_size=500'),
      ]);

      const rawLoans = loansRes.data.results ?? loansRes.data;
      setLoans(rawLoans.map(mapLoan));

      // Extract overdue installments from nested loan data
      const overdue = [];
      rawLoans.forEach(l => {
        (l.installments || []).filter(i => i.status === 'overdue').forEach(i => {
          overdue.push({
            id: String(i.id),
            loanId: String(l.id),
            loanNo: l.loan_no,
            employeeId: String(l.employee),
            employeeName: l.employee_name || '',
            installmentNo: i.installment_no,
            dueDate: i.due_date,
            amount: parseFloat(i.amount) || 0,
          });
        });
      });
      setOverdueInstallments(overdue);

      setEmployees(
        (employeesRes.data.results ?? employeesRes.data).map(e => ({
          id: String(e.id),
          name: e.name,
          companyId: e.company ? String(e.company) : '',
          companyName: e.company_name || '',
        }))
      );

      setCompanies(
        (companiesRes.data.results ?? companiesRes.data).map(c => ({
          id: String(c.id),
          name: c.name,
          status: c.status,
        }))
      );
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const activeLoans = useMemo(() => loans.filter(l => l.status === 'active'), [loans]);

  // Arrears report — overdue installments enriched with company & days late
  const arrearsData = useMemo(() => {
    const today = new Date();
    const employeeMap = {};
    employees.forEach(e => { employeeMap[e.id] = e; });
    return overdueInstallments.map(inst => {
      const emp = employeeMap[inst.employeeId];
      const dueDate = new Date(inst.dueDate);
      const daysLate = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)));
      return {
        ...inst,
        companyName: emp?.companyName || '-',
        daysLate,
      };
    }).sort((a, b) => b.daysLate - a.daysLate);
  }, [overdueInstallments, employees]);

  // Outstanding per company
  const companyOutstandingData = useMemo(() => {
    return companies.map(company => {
      const companyEmployees = employees.filter(e => e.companyId === company.id);
      const employeeIds = new Set(companyEmployees.map(e => e.id));
      const companyActiveLoans = activeLoans.filter(l => employeeIds.has(l.employeeId));
      const totalOutstanding = companyActiveLoans.reduce((s, l) => s + l.outstandingBalance, 0);
      const totalArrears = arrearsData
        .filter(a => employeeIds.has(a.employeeId))
        .reduce((s, a) => s + a.amount, 0);
      return {
        companyId: company.id,
        companyName: company.name,
        totalEmployees: companyEmployees.length,
        activeLoanCount: companyActiveLoans.length,
        totalOutstanding,
        totalArrears,
        mouStatus: company.status,
      };
    });
  }, [companies, employees, activeLoans, arrearsData]);

  // Per-employee loan breakdown for each company (active and non-active loans)
  const companyEmployeeLoans = useMemo(() => {
    const map = {};
    companies.forEach(company => {
      const employeeIds = new Set(employees.filter(e => e.companyId === company.id).map(e => e.id));
      map[company.id] = loans
        .filter(l => employeeIds.has(l.employeeId))
        .map(l => ({
          loanId: l.id,
          loanNo: l.loanNo,
          employeeName: l.employeeName,
          status: l.status,
          principalAmount: l.principalAmount,
          outstandingBalance: l.outstandingBalance,
        }))
        .sort((a, b) => a.employeeName.localeCompare(b.employeeName));
    });
    return map;
  }, [companies, employees, loans]);

  // Monthly admin fee income (from disbursed loans)
  const adminFeeIncomeData = useMemo(() => {
    const map = {};
    loans.forEach(l => {
      if (!l.disbursementDate) return;
      const month = l.disbursementDate.slice(0, 7); // YYYY-MM
      if (!map[month]) map[month] = { month, loanCount: 0, totalPrincipal: 0, totalAdminFee: 0 };
      map[month].loanCount += 1;
      map[month].totalPrincipal += l.principalAmount;
      map[month].totalAdminFee += l.adminFeeAmount;
    });
    return Object.values(map).sort((a, b) => b.month.localeCompare(a.month));
  }, [loans]);

  const adminFeeIncomeTotal = useMemo(() => ({
    loanCount: adminFeeIncomeData.reduce((s, m) => s + m.loanCount, 0),
    totalPrincipal: adminFeeIncomeData.reduce((s, m) => s + m.totalPrincipal, 0),
    totalAdminFee: adminFeeIncomeData.reduce((s, m) => s + m.totalAdminFee, 0),
  }), [adminFeeIncomeData]);

  const exportArrearsToExcel = () => {
    const headers = ['Nama Karyawan', 'Perusahaan', 'No. Pinjaman', 'Jumlah Tertunggak', 'Tanggal Jatuh Tempo', 'Hari Terlambat'];
    const rows = arrearsData.map(a => [
      a.employeeName || '-',
      a.companyName || '-',
      a.loanNo || '-',
      a.amount,
      a.dueDate ? formatDate(a.dueDate) : '-',
      a.daysLate,
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = [{ wch: 24 }, { wch: 22 }, { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tunggakan');
    XLSX.writeFile(wb, 'laporan_tunggakan.xlsx');
  };

  const exportCompanyOutstandingToExcel = () => {
    const headers = [
      'Nama Perusahaan', 'Total Karyawan', 'Jumlah Pinjaman Aktif', 'Total Outstanding', 'Total Tunggakan', 'Status MOU',
      'Nama Karyawan', 'No. Pinjaman', 'Status Pinjaman', 'Jumlah Pinjaman', 'Sisa Outstanding',
    ];
    const rows = [];
    companyOutstandingData.forEach(c => {
      rows.push([
        c.companyName, c.totalEmployees, c.activeLoanCount, c.totalOutstanding, c.totalArrears, getStatusLabel(c.mouStatus),
        '', '', '', '', '',
      ]);
      (companyEmployeeLoans[c.companyId] || []).forEach(l => {
        rows.push([
          '', '', '', '', '', '',
          l.employeeName, l.loanNo, getStatusLabel(l.status), l.principalAmount, l.outstandingBalance,
        ]);
      });
    });
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = [
      { wch: 24 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 14 },
      { wch: 24 }, { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 18 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Outstanding per Perusahaan');
    XLSX.writeFile(wb, 'laporan_outstanding_perusahaan.xlsx');
  };

  const exportAdminFeeIncomeToExcel = () => {
    const headers = ['Bulan', 'Jumlah Pinjaman Cair', 'Total Pokok Pencairan', 'Pendapatan Biaya Admin'];
    const rows = adminFeeIncomeData.map(m => [
      formatMonthLabel(m.month), m.loanCount, m.totalPrincipal, m.totalAdminFee,
    ]);
    rows.push(['TOTAL', adminFeeIncomeTotal.loanCount, adminFeeIncomeTotal.totalPrincipal, adminFeeIncomeTotal.totalAdminFee]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = [{ wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 22 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pendapatan Biaya Admin');
    XLSX.writeFile(wb, 'laporan_pendapatan_biaya_admin.xlsx');
  };

  const exportAdminFeeIncomeToPdf = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const PAGE_W = 210;
    const PAGE_H = 297;
    const MARGIN = 16;
    const CONTENT_W = PAGE_W - MARGIN * 2;
    const INK = [25, 25, 25];
    const MUTED = [115, 115, 115];
    const FAINT = [200, 200, 200];

    const colX = [MARGIN, MARGIN + 60, MARGIN + 100, MARGIN + 139];
    const colW = [60, 40, 39, 39];
    const rowH = 7;

    const drawHeader = () => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(...INK);
      doc.text('PT DANAKARYA FINANCE', PAGE_W / 2, MARGIN, { align: 'center' });
      doc.setFontSize(10.5);
      doc.text('Laporan Pendapatan Biaya Admin per Bulan', PAGE_W / 2, MARGIN + 6, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      doc.text(`Dicetak: ${formatDateTime(new Date().toISOString())}`, PAGE_W / 2, MARGIN + 11, { align: 'center' });
      doc.setDrawColor(...FAINT);
      doc.line(MARGIN, MARGIN + 14.5, PAGE_W - MARGIN, MARGIN + 14.5);
      doc.setTextColor(...INK);
      return MARGIN + 22;
    };

    const drawTableHeader = (y) => {
      doc.setFillColor(...INK);
      doc.rect(MARGIN, y, CONTENT_W, rowH, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.text('Bulan', colX[0] + 3, y + rowH - 2.2);
      doc.text('Jumlah Pinjaman', colX[1] + colW[1] - 3, y + rowH - 2.2, { align: 'right' });
      doc.text('Total Pokok Pencairan', colX[2] + colW[2] - 3, y + rowH - 2.2, { align: 'right' });
      doc.text('Pendapatan Biaya Admin', colX[3] + colW[3] - 3, y + rowH - 2.2, { align: 'right' });
      doc.setTextColor(...INK);
      return y + rowH;
    };

    let y = drawHeader();
    y = drawTableHeader(y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    adminFeeIncomeData.forEach((m, idx) => {
      if (y + rowH > PAGE_H - MARGIN - 12) {
        doc.addPage();
        y = MARGIN;
        y = drawTableHeader(y);
      }
      if (idx % 2 === 1) {
        doc.setFillColor(245, 245, 245);
        doc.rect(MARGIN, y, CONTENT_W, rowH, 'F');
      }
      doc.setTextColor(...INK);
      doc.text(formatMonthLabel(m.month), colX[0] + 3, y + rowH - 2.2);
      doc.text(formatNumber(m.loanCount), colX[1] + colW[1] - 3, y + rowH - 2.2, { align: 'right' });
      doc.text(formatCurrency(m.totalPrincipal), colX[2] + colW[2] - 3, y + rowH - 2.2, { align: 'right' });
      doc.text(formatCurrency(m.totalAdminFee), colX[3] + colW[3] - 3, y + rowH - 2.2, { align: 'right' });
      y += rowH;
    });

    if (adminFeeIncomeData.length === 0) {
      doc.setTextColor(...MUTED);
      doc.text('Belum ada data pencairan pinjaman', PAGE_W / 2, y + rowH, { align: 'center' });
      doc.setTextColor(...INK);
      y += rowH;
    } else {
      // Total row
      if (y + rowH > PAGE_H - MARGIN - 12) {
        doc.addPage();
        y = MARGIN;
        y = drawTableHeader(y);
      }
      doc.setDrawColor(...INK);
      doc.line(MARGIN, y, PAGE_W - MARGIN, y);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL', colX[0] + 3, y + rowH - 2.2);
      doc.text(formatNumber(adminFeeIncomeTotal.loanCount), colX[1] + colW[1] - 3, y + rowH - 2.2, { align: 'right' });
      doc.text(formatCurrency(adminFeeIncomeTotal.totalPrincipal), colX[2] + colW[2] - 3, y + rowH - 2.2, { align: 'right' });
      doc.text(formatCurrency(adminFeeIncomeTotal.totalAdminFee), colX[3] + colW[3] - 3, y + rowH - 2.2, { align: 'right' });
      y += rowH;
    }

    doc.save('laporan_pendapatan_biaya_admin.pdf');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="arrears">
        <TabsList>
          <TabsTrigger value="arrears" className="gap-1"><AlertTriangle className="size-3" /> Tunggakan</TabsTrigger>
          <TabsTrigger value="company-outstanding" className="gap-1"><Building2 className="size-3" /> Outstanding per Perusahaan</TabsTrigger>
          {isFinance && (
            <TabsTrigger value="admin-fee-income" className="gap-1"><Banknote className="size-3" /> Pendapatan Biaya Admin</TabsTrigger>
          )}
        </TabsList>

        {/* Arrears Report */}
        <TabsContent value="arrears" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Laporan Tunggakan</CardTitle>
                  <CardDescription>Daftar cicilan yang terlambat atau belum terbayar</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={exportArrearsToExcel} className="gap-1" disabled={arrearsData.length === 0}>
                  <Download className="size-3.5" /> Export Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Karyawan</TableHead>
                    <TableHead>Perusahaan</TableHead>
                    <TableHead>No. Pinjaman</TableHead>
                    <TableHead>Jumlah Tertunggak</TableHead>
                    <TableHead>Tanggal Jatuh Tempo</TableHead>
                    <TableHead>Hari Terlambat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {arrearsData.map(a => (
                    <TableRow key={a.id} className="bg-red-50/50 dark:bg-red-900/10">
                      <TableCell className="font-medium">{a.employeeName || '-'}</TableCell>
                      <TableCell className="text-sm">{a.companyName}</TableCell>
                      <TableCell className="font-mono text-xs">{a.loanNo || '-'}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(a.amount)}</TableCell>
                      <TableCell className="text-sm">{a.dueDate ? formatDate(a.dueDate) : '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px] bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          {a.daysLate} hari
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {arrearsData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Tidak ada tunggakan</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Outstanding per Company */}
        <TabsContent value="company-outstanding" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Outstanding per Perusahaan</CardTitle>
                  <CardDescription>Rekap total pinjaman berjalan per perusahaan mitra</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={exportCompanyOutstandingToExcel} className="gap-1" disabled={companyOutstandingData.length === 0}>
                  <Download className="size-3.5" /> Export Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead>Nama Perusahaan</TableHead>
                    <TableHead className="text-center">Total Karyawan</TableHead>
                    <TableHead className="text-center">Pinjaman Aktif</TableHead>
                    <TableHead className="text-right">Total Outstanding</TableHead>
                    <TableHead className="text-right">Total Tunggakan</TableHead>
                    <TableHead>Status MOU</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companyOutstandingData.map(c => {
                    const isExpanded = expandedCompanies.has(c.companyId);
                    const employeeLoans = companyEmployeeLoans[c.companyId] || [];
                    return (
                      <React.Fragment key={c.companyId}>
                        <TableRow className="cursor-pointer" onClick={() => toggleCompany(c.companyId)}>
                          <TableCell>
                            {isExpanded ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
                          </TableCell>
                          <TableCell className="font-medium">{c.companyName}</TableCell>
                          <TableCell className="text-center">{c.totalEmployees}</TableCell>
                          <TableCell className="text-center">{c.activeLoanCount}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(c.totalOutstanding)}</TableCell>
                          <TableCell className="text-right font-semibold text-red-600">{formatCurrency(c.totalArrears)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`text-[10px] ${getStatusColor(c.mouStatus)}`}>
                              {getStatusLabel(c.mouStatus)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow className="hover:bg-transparent">
                            <TableCell colSpan={7} className="bg-muted/30 p-0">
                              {employeeLoans.length === 0 ? (
                                <div className="text-center py-4 text-sm text-muted-foreground">Belum ada pinjaman karyawan</div>
                              ) : (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="pl-10">Nama Karyawan</TableHead>
                                      <TableHead>No. Pinjaman</TableHead>
                                      <TableHead>Status</TableHead>
                                      <TableHead className="text-right">Jumlah Pinjaman</TableHead>
                                      <TableHead className="text-right">Sisa Outstanding</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {employeeLoans.map(l => (
                                      <TableRow key={l.loanId}>
                                        <TableCell className="pl-10 font-medium">{l.employeeName}</TableCell>
                                        <TableCell className="font-mono text-xs">{l.loanNo || '-'}</TableCell>
                                        <TableCell>
                                          <Badge variant="secondary" className={`text-[10px] ${getStatusColor(l.status)}`}>
                                            {getStatusLabel(l.status)}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{formatCurrency(l.principalAmount)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(l.outstandingBalance)}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              )}
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {companyOutstandingData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">Belum ada data perusahaan</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin Fee Income — Finance only */}
        {isFinance && (
          <TabsContent value="admin-fee-income" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">Pendapatan Biaya Admin per Bulan</CardTitle>
                    <CardDescription>Rekap pendapatan biaya admin dari pencairan pinjaman setiap bulan</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={exportAdminFeeIncomeToExcel} className="gap-1" disabled={adminFeeIncomeData.length === 0}>
                      <Download className="size-3.5" /> Export Excel
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportAdminFeeIncomeToPdf} className="gap-1" disabled={adminFeeIncomeData.length === 0}>
                      <FileText className="size-3.5" /> Export PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bulan</TableHead>
                      <TableHead className="text-center">Jumlah Pinjaman Cair</TableHead>
                      <TableHead className="text-right">Total Pokok Pencairan</TableHead>
                      <TableHead className="text-right">Pendapatan Biaya Admin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminFeeIncomeData.map(m => (
                      <TableRow key={m.month}>
                        <TableCell className="font-medium">{formatMonthLabel(m.month)}</TableCell>
                        <TableCell className="text-center">{m.loanCount}</TableCell>
                        <TableCell className="text-right">{formatCurrency(m.totalPrincipal)}</TableCell>
                        <TableCell className="text-right font-semibold text-emerald-600">{formatCurrency(m.totalAdminFee)}</TableCell>
                      </TableRow>
                    ))}
                    {adminFeeIncomeData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">Belum ada data pencairan pinjaman</TableCell>
                      </TableRow>
                    )}
                    {adminFeeIncomeData.length > 0 && (
                      <TableRow className="bg-muted/40 font-semibold">
                        <TableCell>TOTAL</TableCell>
                        <TableCell className="text-center">{adminFeeIncomeTotal.loanCount}</TableCell>
                        <TableCell className="text-right">{formatCurrency(adminFeeIncomeTotal.totalPrincipal)}</TableCell>
                        <TableCell className="text-right text-emerald-600">{formatCurrency(adminFeeIncomeTotal.totalAdminFee)}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

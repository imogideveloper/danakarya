import React, { useState, useMemo, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  CheckCircle, AlertTriangle, Clock, Upload, FileText, Check, Landmark,
  ChevronDown, ChevronUp, ArrowUpRight, ArrowDownLeft, Search, Receipt,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { formatCurrency, formatDate } from '@/lib/format';
import {
  detectColumns, detectHeaderRowIndex, detectAccountInfo, buildStatementRows,
  summarizeStatement,
} from '@/lib/reconciliation';
import { toast } from 'sonner';

const COLUMN_ROLES = ['tanggal', 'keterangan', 'debit', 'kredit', 'saldo'];
const NONE = '__none__';
const BANK_OPTIONS = ['BCA', 'Mandiri', 'BNI', 'BRI', 'Lainnya'];
const STATUS_CONFIG = {
  matched: { label: 'Cocok', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  discrepancy: { label: 'Selisih', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
};
const MANUAL_ACCOUNTS = [
  { id: 'admin-fee', name: 'Administrasi Fee', parent: 'Sales' },
  { id: 'admin-bank', name: 'Administrasi Bank', parent: 'Expense' },
  { id: 'interest-income', name: 'Interest Income', parent: 'Other Income' },
  { id: 'operational-expense', name: 'Operasional Expense', parent: 'Expense' },
];
const IMPORT_WIZARD_STEPS = [
  { n: 1, label: 'Pilih File' },
  { n: 2, label: 'Preview' },
  { n: 3, label: 'Selesai' },
];

function WizardStepper({ step, steps }) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 py-1 flex-wrap min-w-0">
      {steps.map((s, i) => (
        <React.Fragment key={s.n}>
          <div className="flex items-center gap-2">
            <div className={`flex items-center justify-center size-6 shrink-0 rounded-full text-xs font-semibold ${step === s.n ? 'bg-primary text-primary-foreground'
              : step > s.n ? 'bg-primary/15 text-primary'
                : 'bg-muted text-muted-foreground'
              }`}>
              {step > s.n ? <Check className="size-3.5" /> : s.n}
            </div>
            <span className={`text-sm whitespace-nowrap ${step === s.n ? 'font-semibold' : 'text-muted-foreground hidden sm:inline'}`}>{s.label}</span>
          </div>
          {i < steps.length - 1 && <div className="w-6 sm:w-10 h-px bg-border" />}
        </React.Fragment>
      ))}
    </div>
  );
}

function TransactionRow({ row, expanded, onToggleExpand, onOpenForm, onUnmatch }) {
  const isKredit = row.type === 'kredit';
  const isPending = row.status === 'pending';
  return (
    <div className="rounded-lg border">
      <div className="flex items-center gap-3 p-2.5 flex-wrap sm:flex-nowrap">
        <div className={`rounded-full p-1.5 shrink-0 ${isKredit ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
          : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
          }`}>
          {isKredit ? <ArrowUpRight className="size-3.5" /> : <ArrowDownLeft className="size-3.5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{row.description || '-'}</p>
          <p className="text-xs text-muted-foreground">{row.date ? formatDate(row.date) : '-'}</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end mt-1.5 sm:mt-0 flex-wrap">
          <p className={`text-sm font-semibold whitespace-nowrap ${isKredit ? 'text-emerald-600' : 'text-red-600'}`}>
            {isKredit ? '+' : '-'}{formatCurrency(row.amount)}
          </p>
          {isPending ? (
            <button
              type="button"
              onClick={onOpenForm}
              className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2.5 py-1 text-xs font-medium hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors shrink-0"
            >
              <Receipt className="size-3" />
              Proses Transaksi
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenForm}
              title="Klik untuk edit transaksi"
              className={`border-0 rounded-full px-2.5 py-1 text-xs font-medium shrink-0 transition-opacity hover:opacity-80 ${STATUS_CONFIG[row.status]?.className || ''}`}
            >
              {STATUS_CONFIG[row.status]?.label || row.status}
            </button>
          )}
          {row.match && (
            <button type="button" onClick={onToggleExpand} className="shrink-0 text-muted-foreground hover:text-foreground">
              {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>
          )}
        </div>
      </div>
      {expanded && row.match && (
        <div className="border-t bg-muted/30 px-3 py-2 text-xs space-y-1.5">
          <p>
            Akun: <span className="font-medium">{row.match.label}</span>
            {' '}<span className="text-muted-foreground">(Parent: {row.match.parent})</span>
          </p>
          <p className="text-muted-foreground">
            {row.match.date ? formatDate(row.match.date) : '-'} • {formatCurrency(row.match.amount)}
          </p>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onUnmatch}>
            Hapus Transaksi
          </Button>
        </div>
      )}
    </div>
  );
}

export function ReconciliationPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [bank, setBank] = useState('BCA');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [headerRowIndex, setHeaderRowIndex] = useState(1);
  const [mapping, setMapping] = useState({ tanggal: '', keterangan: '', debit: '', kredit: '', saldo: '' });
  const [accountInfo, setAccountInfo] = useState(null);
  const [statements, setStatements] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});
  const [txnDialogRow, setTxnDialogRow] = useState(null);
  const [txnDate, setTxnDate] = useState('');
  const [txnDescription, setTxnDescription] = useState('');
  const [txnAmount, setTxnAmount] = useState('');
  const [txnAccount, setTxnAccount] = useState(null);
  const [txnAccountSearchTerm, setTxnAccountSearchTerm] = useState('');

  const buildHeaders = (rows, rowIndex) => (rows[rowIndex - 1] || []).map(h => String(h ?? '').trim());

  const openDialog = () => {
    setStep(1);
    setBank('BCA');
    setFileName('');
    setHeaders([]);
    setRawRows([]);
    setHeaderRowIndex(1);
    setMapping({ tanggal: '', keterangan: '', debit: '', kredit: '', saldo: '' });
    setAccountInfo(null);
    setIsDragging(false);
    setDialogOpen(true);
  };

  const processFile = (file) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true });
        if (!aoa.length) {
          toast.error('File kosong');
          return;
        }
        setRawRows(aoa);
        const rowIndex = detectHeaderRowIndex(aoa);
        setHeaderRowIndex(rowIndex);
        const hdrs = buildHeaders(aoa, rowIndex);
        setHeaders(hdrs);
        setMapping(detectColumns(hdrs));
        setAccountInfo(detectAccountInfo(aoa, rowIndex));
        setStep(2);
      } catch {
        toast.error('Gagal membaca file. Pastikan format CSV/Excel valid.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
    e.target.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleHeaderRowChange = (n) => {
    const rowNum = Math.max(1, n);
    setHeaderRowIndex(rowNum);
    const hdrs = buildHeaders(rawRows, rowNum);
    setHeaders(hdrs);
    setMapping(detectColumns(hdrs));
  };

  const buildObjRows = useCallback(() => {
    const colIndex = (headerName) => headers.indexOf(headerName);
    const dataRows = rawRows.slice(headerRowIndex);
    return dataRows
      .filter(r => r.some(c => String(c ?? '').trim() !== ''))
      .map(r => ({
        tanggal: r[colIndex(mapping.tanggal)],
        keterangan: mapping.keterangan ? r[colIndex(mapping.keterangan)] : '',
        debit: mapping.debit ? r[colIndex(mapping.debit)] : '',
        kredit: mapping.kredit ? r[colIndex(mapping.kredit)] : '',
        saldo: mapping.saldo ? r[colIndex(mapping.saldo)] : '',
      }));
  }, [headers, rawRows, headerRowIndex, mapping]);

  const previewRows = useMemo(() => {
    if (!headers.length || !mapping.tanggal) return [];
    return buildStatementRows(buildObjRows());
  }, [headers, mapping, buildObjRows]);

  const statSummary = useMemo(() => summarizeStatement(previewRows), [previewRows]);

  const handleImport = () => {
    if (!mapping.tanggal || (!mapping.debit && !mapping.kredit)) {
      toast.error('Pemetaan kolom belum lengkap. Pilih minimal kolom Tanggal dan salah satu Debit/Kredit.');
      return;
    }
    if (previewRows.length === 0) {
      toast.error('Tidak ada transaksi yang terdeteksi.');
      return;
    }
    const stmtId = `stmt-${Date.now()}`;
    const rows = previewRows.map((row, i) => ({
      ...row,
      id: `${stmtId}-row-${i}`,
      status: 'pending',
      match: null,
      matchType: null,
    }));
    setStatements(prev => [{ id: stmtId, fileName, bank, importedAt: new Date().toISOString(), open: true, rows }, ...prev]);
    toast.success(`Import berhasil! ${rows.length} transaksi dari ${bank} diimport.`);
    setStep(3);
  };

  const toggleStatement = (id) => {
    setStatements(prev => prev.map(s => s.id === id ? { ...s, open: !s.open } : s));
  };

  const toggleRowDetail = (rowId) => {
    setExpandedRows(prev => ({ ...prev, [rowId]: !prev[rowId] }));
  };

  const openTxnDialog = (statementId, row) => {
    setTxnDialogRow({ statementId, rowId: row.id });
    setTxnDate(row.match?.date || row.date || '');
    setTxnDescription(row.match?.description ?? row.description ?? '');
    setTxnAmount(row.match ? String(row.match.amount) : String(row.amount));
    setTxnAccount(row.match?.accountId ? MANUAL_ACCOUNTS.find(a => a.id === row.match.accountId) || null : null);
    setTxnAccountSearchTerm('');
  };

  const closeTxnDialog = () => {
    setTxnDialogRow(null);
    setTxnDate('');
    setTxnDescription('');
    setTxnAmount('');
    setTxnAccount(null);
    setTxnAccountSearchTerm('');
  };

  const txnDialogContext = useMemo(() => {
    if (!txnDialogRow) return null;
    const stmt = statements.find(s => s.id === txnDialogRow.statementId);
    const row = stmt?.rows.find(r => r.id === txnDialogRow.rowId);
    return row ? { statementId: txnDialogRow.statementId, row } : null;
  }, [txnDialogRow, statements]);

  const txnFilteredAccounts = useMemo(() => {
    const term = txnAccountSearchTerm.trim().toLowerCase();
    if (!term) return MANUAL_ACCOUNTS;
    return MANUAL_ACCOUNTS.filter(a => a.name.toLowerCase().includes(term) || a.parent.toLowerCase().includes(term));
  }, [txnAccountSearchTerm]);

  const handleSaveTransaction = () => {
    if (!txnDialogContext || !txnAccount) return;
    const { statementId, row } = txnDialogContext;
    const amount = Number(txnAmount) || 0;
    const match = {
      accountId: txnAccount.id,
      label: txnAccount.name,
      parent: txnAccount.parent,
      amount,
      date: txnDate,
      description: txnDescription,
    };
    const status = amount === row.amount ? 'matched' : 'discrepancy';
    setStatements(prev => prev.map(s => s.id !== statementId ? s : {
      ...s,
      rows: s.rows.map(r => r.id !== row.id ? r : { ...r, status, match, matchType: 'manual-operation' }),
    }));
    closeTxnDialog();
    toast.success('Transaksi berhasil dicatat.');
  };

  const handleUnmatch = (statementId, rowId) => {
    setStatements(prev => prev.map(s => s.id !== statementId ? s : {
      ...s,
      rows: s.rows.map(r => r.id !== rowId ? r : { ...r, status: 'pending', match: null, matchType: null }),
    }));
  };

  const summary = useMemo(() => {
    const allRows = statements.flatMap(s => s.rows);
    return {
      matched: allRows.filter(r => r.status === 'matched').length,
      discrepancy: allRows.filter(r => r.status === 'discrepancy').length,
      pending: allRows.filter(r => r.status === 'pending').length,
    };
  }, [statements]);

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-emerald-100 text-emerald-700 p-2 dark:bg-emerald-900/30 dark:text-emerald-400">
              <CheckCircle className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cocok (Matched)</p>
              <p className="text-2xl font-bold">{summary.matched}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 text-amber-700 p-2 dark:bg-amber-900/30 dark:text-amber-400">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Selisih</p>
              <p className="text-2xl font-bold">{summary.discrepancy}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-slate-100 text-slate-700 p-2 dark:bg-slate-800 dark:text-slate-400">
              <Clock className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Belum Diproses</p>
              <p className="text-2xl font-bold">{summary.pending}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Import card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <CardTitle>Import Statement Bank</CardTitle>
          <Button onClick={openDialog}>
            <Upload className="size-4 mr-2" />
            Import Statement
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Upload file statement bank (CSV, Excel), lalu catat setiap transaksi secara manual melalui Form Transaksi.
          </p>
        </CardContent>
      </Card>

      {/* Imported statements */}
      {statements.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Statement Terimport</CardTitle>
            <Button variant="outline" size="sm" onClick={openDialog}>
              <Upload className="size-4 mr-2" />
              Import Baru
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {statements.map(stmt => {
              const stats = summarizeStatement(stmt.rows);
              return (
                <div key={stmt.id} className="border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleStatement(stmt.id)}
                    className="w-full flex items-center justify-between gap-3 p-3 hover:bg-muted/40 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="rounded-lg bg-primary/10 text-primary p-2 shrink-0">
                        <FileText className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm truncate">{stmt.fileName}</span>
                          <Badge variant="outline">{stmt.bank}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {stats.periodeStart ? formatDate(stats.periodeStart) : '-'} — {stats.periodeEnd ? formatDate(stats.periodeEnd) : '-'} • {stmt.rows.length} transaksi
                        </p>
                        <p className="text-xs mt-0.5 sm:hidden">
                          <span className="text-emerald-600 font-medium">+{formatCurrency(stats.kreditTotal)}</span>
                          {' / '}
                          <span className="text-red-600 font-medium">-{formatCurrency(stats.debitTotal)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                      <Badge variant="outline" className="hidden sm:inline-flex">{stmt.open ? 'Open' : 'Closed'}</Badge>
                      <div className="text-right text-xs hidden sm:block">
                        <p className="text-emerald-600 font-medium">+{formatCurrency(stats.kreditTotal)}</p>
                        <p className="text-red-600 font-medium">-{formatCurrency(stats.debitTotal)}</p>
                      </div>
                      {stmt.open ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
                    </div>
                  </button>
                  {stmt.open && (
                    <div className="border-t p-3 space-y-2">
                      <p className="text-sm font-medium">Daftar Transaksi ({stmt.rows.length})</p>
                      {stmt.rows.map(row => (
                        <TransactionRow
                          key={row.id}
                          row={row}
                          expanded={!!expandedRows[row.id]}
                          onToggleExpand={() => toggleRowDetail(row.id)}
                          onOpenForm={() => openTxnDialog(stmt.id, row)}
                          onUnmatch={() => handleUnmatch(stmt.id, row.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Import wizard dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="size-5" />
              Import Statement Bank
            </DialogTitle>
            <DialogDescription>
              {step === 1 && 'Pilih bank dan upload file statement bank.'}
              {step === 2 && 'Periksa data yang diparse sebelum diimport.'}
              {step === 3 && 'Statement berhasil diimport dan siap direkonsiliasi.'}
            </DialogDescription>
          </DialogHeader>
          <WizardStepper step={step} steps={IMPORT_WIZARD_STEPS} />
          {/* Step 1: Pilih File */}
          {step === 1 && (
            <div className="space-y-4 min-w-0">
              <div className="space-y-1.5">
                <Label>Bank</Label>
                <Select value={bank} onValueChange={setBank}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BANK_OPTIONS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>File Statement</Label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-8 sm:p-10 text-center transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                    }`}
                >
                  <FileText className="size-10 text-muted-foreground/50" />
                  <p className="font-medium text-sm">{isDragging ? 'Lepas file di sini' : 'Klik atau seret file CSV ke sini'}</p>
                  <p className="text-xs text-muted-foreground">Format: .csv, .xlsx, .xls (Mutasi Rekening Bank)</p>
                </button>
                <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileChange} />
              </div>
            </div>
          )}
          {/* Step 2: Preview */}
          {step === 2 && (
            <div className="space-y-4 min-w-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg border p-3 min-w-0">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total Transaksi</p>
                  <p className="text-xl font-bold mt-1">{statSummary.total}</p>
                </div>
                <div className="rounded-lg border p-3 bg-emerald-50 dark:bg-emerald-900/20 min-w-0">
                  <p className="text-[11px] uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Kredit (Masuk)</p>
                  <p className="text-sm sm:text-base font-bold mt-1 text-emerald-700 dark:text-emerald-400 whitespace-nowrap">{formatCurrency(statSummary.kreditTotal)}</p>
                  <p className="text-xs text-muted-foreground">{statSummary.kreditCount} transaksi</p>
                </div>
                <div className="rounded-lg border p-3 bg-red-50 dark:bg-red-900/20 min-w-0">
                  <p className="text-[11px] uppercase tracking-wide text-red-700 dark:text-red-400">Debit (Keluar)</p>
                  <p className="text-sm sm:text-base font-bold mt-1 text-red-700 dark:text-red-400 whitespace-nowrap">{formatCurrency(statSummary.debitTotal)}</p>
                  <p className="text-xs text-muted-foreground">{statSummary.debitCount} transaksi</p>
                </div>
                <div className="rounded-lg border p-3 min-w-0">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Periode</p>
                  <p className="text-sm font-semibold mt-1.5">
                    {statSummary.periodeStart ? formatDate(statSummary.periodeStart) : '-'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    s/d {statSummary.periodeEnd ? formatDate(statSummary.periodeEnd) : '-'}
                  </p>
                </div>
              </div>
              {accountInfo && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <Landmark className="size-4 text-muted-foreground shrink-0" />
                    {accountInfo.accountNumber ? (
                      <span className="truncate">No. Rekening: <span className="font-medium">{accountInfo.accountNumber}</span></span>
                    ) : (
                      <span className="truncate">{accountInfo.raw}</span>
                    )}
                  </div>
                  {accountInfo.accountName && (
                    <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
                      <span className="shrink-0">a.n.</span>
                      <span className="font-medium text-foreground truncate">{accountInfo.accountName}</span>
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">Preview Data Transaksi</p>
                  <span className="text-xs text-muted-foreground truncate max-w-[50%]">{fileName}</span>
                </div>
                <div className="border rounded-lg overflow-x-auto max-h-72 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Deskripsi</TableHead>
                        <TableHead>Kredit</TableHead>
                        <TableHead>Debit</TableHead>
                        <TableHead>Saldo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewRows.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-4">
                            Tidak ada transaksi terdeteksi. Coba atur pemetaan kolom manual di bawah.
                          </TableCell>
                        </TableRow>
                      )}
                      {previewRows.map(row => (
                        <TableRow key={row.id}>
                          <TableCell className="text-sm whitespace-nowrap">{row.date ? formatDate(row.date) : '-'}</TableCell>
                          <TableCell className="text-sm max-w-[200px] truncate">{row.description || '-'}</TableCell>
                          <TableCell className="text-sm whitespace-nowrap text-emerald-600">{row.type === 'kredit' ? formatCurrency(row.amount) : '-'}</TableCell>
                          <TableCell className="text-sm whitespace-nowrap text-red-600">{row.type === 'debit' ? formatCurrency(row.amount) : '-'}</TableCell>
                          <TableCell className="text-sm whitespace-nowrap">{row.balance !== null ? formatCurrency(row.balance) : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <details className="group">
                <summary className="text-sm text-primary cursor-pointer select-none">Atur pemetaan kolom manual</summary>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mt-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Data mulai dari baris</Label>
                    <Input
                      type="number"
                      min={1}
                      value={headerRowIndex + 1}
                      onChange={e => handleHeaderRowChange(Number(e.target.value) - 1)}
                    />
                  </div>
                  {COLUMN_ROLES.map(role => (
                    <div key={role} className="space-y-1.5">
                      <Label className="text-xs capitalize">
                        {role}{role === 'tanggal' ? ' *' : ''}
                      </Label>
                      <Select
                        value={mapping[role] || NONE}
                        onValueChange={v => setMapping(m => ({ ...m, [role]: v === NONE ? '' : v }))}
                      >
                        <SelectTrigger><SelectValue placeholder="Pilih kolom" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE}>- Tidak dipakai -</SelectItem>
                          {headers.map((h, i) => h && <SelectItem key={i} value={h}>{h}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}
          {/* Step 3: Selesai */}
          {step === 3 && (
            <div className="flex flex-col items-center text-center gap-4 py-6 min-w-0">
              <div className="rounded-full bg-emerald-100 text-emerald-700 p-3 dark:bg-emerald-900/30 dark:text-emerald-400">
                <CheckCircle className="size-8" />
              </div>
              <div>
                <p className="font-semibold text-lg">Import Berhasil!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {previewRows.length} transaksi dari {fileName} ({bank}) berhasil diimport dan siap direkonsiliasi.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            {step === 1 && (
              <>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
                <Button onClick={() => fileInputRef.current?.click()}>
                  <FileText className="size-4 mr-2" />
                  Pilih File CSV
                </Button>
              </>
            )}
            {step === 2 && (
              <>
                <Button variant="outline" onClick={() => setStep(1)}>Kembali</Button>
                <Button onClick={handleImport} disabled={previewRows.length === 0}>
                  <CheckCircle className="size-4 mr-2" />
                  Import {previewRows.length} Transaksi
                </Button>
              </>
            )}
            {step === 3 && (
              <Button onClick={() => setDialogOpen(false)}>Selesai</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Form transaksi dialog */}
      <Dialog open={!!txnDialogRow} onOpenChange={(open) => !open && closeTxnDialog()}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader className="items-center text-center">
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="size-5" />
              Form Transaksi
            </DialogTitle>
            <DialogDescription>
              Catat transaksi ini secara manual untuk keperluan rekonsiliasi.
            </DialogDescription>
          </DialogHeader>
          {txnDialogContext && (
            <div className="space-y-4 min-w-0">
              {/* Transaksi Bank */}
              <div className="rounded-lg border bg-muted/30 p-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Badge variant="outline" className={`shrink-0 ${txnDialogContext.row.type === 'kredit' ? 'text-emerald-600 border-emerald-200' : 'text-red-600 border-red-200'}`}>
                    {txnDialogContext.row.type === 'kredit' ? 'Kredit (Masuk)' : 'Debit (Keluar)'}
                  </Badge>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Statement Bank</p>
                    <p className="text-sm font-medium truncate">{txnDialogContext.row.description || '-'}</p>
                  </div>
                </div>
                <p className={`text-lg font-bold whitespace-nowrap shrink-0 ${txnDialogContext.row.type === 'kredit' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {txnDialogContext.row.type === 'kredit' ? '+' : '-'}{formatCurrency(txnDialogContext.row.amount)}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="txn-date">Tanggal</Label>
                  <Input id="txn-date" type="date" value={txnDate} onChange={e => setTxnDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="txn-amount">Nominal</Label>
                  <Input id="txn-amount" type="number" min="0" value={txnAmount} onChange={e => setTxnAmount(e.target.value)} placeholder="0" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="txn-description">Keterangan</Label>
                <Input id="txn-description" value={txnDescription} onChange={e => setTxnDescription(e.target.value)} placeholder="Keterangan transaksi..." />
              </div>

              <div className="space-y-1.5">
                <Label>Akun</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input
                    value={txnAccountSearchTerm}
                    onChange={e => setTxnAccountSearchTerm(e.target.value)}
                    placeholder="Cari nama akun..."
                    className="pl-8"
                  />
                </div>
                <div className="border rounded-lg max-h-44 overflow-y-auto divide-y">
                  {txnFilteredAccounts.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-6">Akun tidak ditemukan.</p>
                  )}
                  {txnFilteredAccounts.map(acc => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setTxnAccount(acc)}
                      className={`w-full flex items-center justify-between gap-3 p-3 text-left transition-colors ${txnAccount?.id === acc.id ? 'bg-primary/10' : 'hover:bg-muted/50'
                        }`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{acc.name}</p>
                        <p className="text-xs text-muted-foreground">Parent Account: {acc.parent}</p>
                      </div>
                      {txnAccount?.id === acc.id && <Check className="size-4 text-primary shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {txnAmount !== '' && Number(txnAmount) !== txnDialogContext.row.amount && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-900 p-3 text-sm text-amber-700 dark:text-amber-400">
                  Nominal berbeda {formatCurrency(Math.abs(Number(txnAmount) - txnDialogContext.row.amount))} dari nominal statement bank. Transaksi akan ditandai sebagai "Selisih".
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeTxnDialog}>Batal</Button>
            <Button
              onClick={handleSaveTransaction}
              disabled={!txnAccount || !txnDate || !(Number(txnAmount) > 0)}
            >
              <CheckCircle className="size-4 mr-2" />
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
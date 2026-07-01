import React, { useState, useEffect } from 'react';
import { Percent, Bell, Database, Save } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { toast } from 'sonner';
import api from '@/lib/api';

function mapSettings(data) {
  return {
    loan: {
      defaultAdminFeeType: data.default_admin_fee_type,
      defaultAdminFee: parseFloat(data.default_admin_fee),
      adminFeeTier1Max: data.admin_fee_tier1_max,
      adminFeeTier1Amount: data.admin_fee_tier1_amount,
      adminFeeTier2Amount: data.admin_fee_tier2_amount,
      maxLoanAmount: data.max_loan_amount,
      minLoanAmount: data.min_loan_amount,
      maxTenor: data.max_tenor,
      minTenor: data.min_tenor,
      earlySettlementPenalty: parseFloat(data.early_settlement_penalty),
      autoDebitEnabled: data.auto_debit_enabled,
    },
    notification: {
      emailNotification: data.email_notification,
      overdueReminder: data.overdue_reminder,
      paymentConfirmation: data.payment_confirmation,
      loanApproval: data.loan_approval,
      disbursementNotice: data.disbursement_notice,
    },
    system: {
      companyName: data.company_name,
      companyTagline: data.company_tagline,
      currency: data.currency,
      dateFormat: data.date_format,
      timezone: data.timezone,
    },
  };
}

const loanPayload = (s) => ({
  default_admin_fee_type: s.defaultAdminFeeType,
  default_admin_fee: s.defaultAdminFee,
  admin_fee_tier1_max: s.adminFeeTier1Max,
  admin_fee_tier1_amount: s.adminFeeTier1Amount,
  admin_fee_tier2_amount: s.adminFeeTier2Amount,
  max_loan_amount: s.maxLoanAmount,
  min_loan_amount: s.minLoanAmount,
  max_tenor: s.maxTenor,
  min_tenor: s.minTenor,
  early_settlement_penalty: s.earlySettlementPenalty,
  auto_debit_enabled: s.autoDebitEnabled,
});

const notifPayload = (s) => ({
  email_notification: s.emailNotification,
  overdue_reminder: s.overdueReminder,
  payment_confirmation: s.paymentConfirmation,
  loan_approval: s.loanApproval,
  disbursement_notice: s.disbursementNotice,
});

const systemPayload = (s) => ({
  company_name: s.companyName,
  company_tagline: s.companyTagline,
  currency: s.currency,
  date_format: s.dateFormat,
  timezone: s.timezone,
});

export function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [savingLoan, setSavingLoan] = useState(false);
  const [savingNotif, setSavingNotif] = useState(false);
  const [savingSystem, setSavingSystem] = useState(false);
  const [loanSettings, setLoanSettings] = useState({
    defaultAdminFeeType: 'percentage',
    defaultAdminFee: 1,
    adminFeeTier1Max: 1000000,
    adminFeeTier1Amount: 50000,
    adminFeeTier2Amount: 100000,
    maxLoanAmount: 50000000,
    minLoanAmount: 1000000,
    maxTenor: 36,
    minTenor: 3,
    earlySettlementPenalty: 0,
    autoDebitEnabled: true,
  });
  const [notifSettings, setNotifSettings] = useState({
    emailNotification: true,
    overdueReminder: true,
    paymentConfirmation: true,
    loanApproval: true,
    disbursementNotice: true,
  });
  const [systemSettings, setSystemSettings] = useState({
    companyName: 'DANAKARYA',
    companyTagline: 'Dana & Nabung untuk Karyawan Sejahtera',
    currency: 'IDR',
    dateFormat: 'dd/MM/yyyy',
    timezone: 'Asia/Jakarta',
  });

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/settings/');
        const mapped = mapSettings(data);
        setLoanSettings(mapped.loan);
        setNotifSettings(mapped.notification);
        setSystemSettings(mapped.system);
      } catch {
        toast.error('Gagal memuat pengaturan');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSaveLoan = async () => {
    setSavingLoan(true);
    try {
      await api.patch('/settings/', loanPayload(loanSettings));
      toast.success('Pengaturan pinjaman berhasil disimpan');
    } catch {
      toast.error('Gagal menyimpan pengaturan pinjaman');
    } finally {
      setSavingLoan(false);
    }
  };

  const handleSaveNotif = async () => {
    setSavingNotif(true);
    try {
      await api.patch('/settings/', notifPayload(notifSettings));
      toast.success('Pengaturan notifikasi berhasil disimpan');
    } catch {
      toast.error('Gagal menyimpan pengaturan notifikasi');
    } finally {
      setSavingNotif(false);
    }
  };

  const handleSaveSystem = async () => {
    setSavingSystem(true);
    try {
      await api.patch('/settings/', systemPayload(systemSettings));
      toast.success('Pengaturan sistem berhasil disimpan');
    } catch {
      toast.error('Gagal menyimpan pengaturan sistem');
    } finally {
      setSavingSystem(false);
    }
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

  return (<div className="space-y-4">
    <Tabs defaultValue="loan">
      <TabsList>
        <TabsTrigger value="loan" className="gap-1"><Percent className="size-3" /> Pinjaman</TabsTrigger>
        <TabsTrigger value="notification" className="gap-1"><Bell className="size-3" /> Notifikasi</TabsTrigger>
        <TabsTrigger value="system" className="gap-1"><Database className="size-3" /> Sistem</TabsTrigger>
      </TabsList>

      {/* Loan Settings */}
      <TabsContent value="loan" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Percent className="size-4" /> Pengaturan Pinjaman
            </CardTitle>
            <CardDescription>Konfigurasi parameter pinjaman default</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Jenis Biaya Admin Default</Label>
                <Select value={loanSettings.defaultAdminFeeType} onValueChange={v => setLoanSettings({ ...loanSettings, defaultAdminFeeType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tiered">Berjenjang (Flat)</SelectItem>
                    <SelectItem value="percentage">Persentase (%)</SelectItem>
                    <SelectItem value="fixed">Nominal Tetap (Rp)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {loanSettings.defaultAdminFeeType !== 'tiered' && (
                <div className="space-y-2">
                  <Label>Biaya Admin Default ({loanSettings.defaultAdminFeeType === 'percentage' ? '%' : 'Rp'})</Label>
                  <Input type="number" step={loanSettings.defaultAdminFeeType === 'percentage' ? '0.1' : '100000'} value={loanSettings.defaultAdminFee} onChange={e => setLoanSettings({ ...loanSettings, defaultAdminFee: Number(e.target.value) })} />
                </div>
              )}
              <div className="space-y-2">
                <Label>Denda Pelunasan Dini (%)</Label>
                <Input type="number" value={loanSettings.earlySettlementPenalty} onChange={e => setLoanSettings({ ...loanSettings, earlySettlementPenalty: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Jumlah Pinjaman Minimum (Rp)</Label>
                <Input type="number" value={loanSettings.minLoanAmount} onChange={e => setLoanSettings({ ...loanSettings, minLoanAmount: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Jumlah Pinjaman Maksimum (Rp)</Label>
                <Input type="number" value={loanSettings.maxLoanAmount} onChange={e => setLoanSettings({ ...loanSettings, maxLoanAmount: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Tenor Minimum (bulan)</Label>
                <Input type="number" value={loanSettings.minTenor} onChange={e => setLoanSettings({ ...loanSettings, minTenor: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Tenor Maksimum (bulan)</Label>
                <Input type="number" value={loanSettings.maxTenor} onChange={e => setLoanSettings({ ...loanSettings, maxTenor: Number(e.target.value) })} />
              </div>
            </div>

            {loanSettings.defaultAdminFeeType === 'tiered' && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-sm">Konfigurasi Biaya Admin Berjenjang</p>
                    <p className="text-xs text-muted-foreground">Atur batas jumlah pinjaman dan nominal biaya admin untuk masing-masing tier</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Batas Tier 1 (Rp)</Label>
                      <Input type="number" step="100000" value={loanSettings.adminFeeTier1Max} onChange={e => setLoanSettings({ ...loanSettings, adminFeeTier1Max: Number(e.target.value) })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Biaya Admin Tier 1 (Rp)</Label>
                      <Input type="number" step="10000" value={loanSettings.adminFeeTier1Amount} onChange={e => setLoanSettings({ ...loanSettings, adminFeeTier1Amount: Number(e.target.value) })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Biaya Admin Tier 2 (Rp)</Label>
                      <Input type="number" step="10000" value={loanSettings.adminFeeTier2Amount} onChange={e => setLoanSettings({ ...loanSettings, adminFeeTier2Amount: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground p-2.5 rounded-md border bg-muted/30 space-y-1">
                    <p>Pinjaman ≤ {formatCurrency(loanSettings.adminFeeTier1Max)}: <span className="font-medium text-foreground">{formatCurrency(loanSettings.adminFeeTier1Amount)}</span></p>
                    <p>Pinjaman &gt; {formatCurrency(loanSettings.adminFeeTier1Max)}: <span className="font-medium text-foreground">{formatCurrency(loanSettings.adminFeeTier2Amount)}</span></p>
                  </div>
                </div>
              </>
            )}

            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Auto Debit</p>
                <p className="text-xs text-muted-foreground">Potong angsuran otomatis dari gaji</p>
              </div>
              <Switch checked={loanSettings.autoDebitEnabled} onCheckedChange={v => setLoanSettings({ ...loanSettings, autoDebitEnabled: v })} />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveLoan} disabled={savingLoan} className="gap-1">
                <Save className="size-4" /> {savingLoan ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Notification Settings */}
      <TabsContent value="notification" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="size-4" /> Pengaturan Notifikasi
            </CardTitle>
            <CardDescription>Kelola preferensi notifikasi sistem</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium text-sm">Notifikasi Email</p>
                <p className="text-xs text-muted-foreground">Kirim notifikasi via email</p>
              </div>
              <Switch checked={notifSettings.emailNotification} onCheckedChange={v => setNotifSettings({ ...notifSettings, emailNotification: v })} />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium text-sm">Reminder Keterlambatan</p>
                <p className="text-xs text-muted-foreground">Notifikasi saat angsuran terlambat</p>
              </div>
              <Switch checked={notifSettings.overdueReminder} onCheckedChange={v => setNotifSettings({ ...notifSettings, overdueReminder: v })} />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium text-sm">Konfirmasi Pembayaran</p>
                <p className="text-xs text-muted-foreground">Notifikasi saat pembayaran dikonfirmasi</p>
              </div>
              <Switch checked={notifSettings.paymentConfirmation} onCheckedChange={v => setNotifSettings({ ...notifSettings, paymentConfirmation: v })} />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium text-sm">Persetujuan Pinjaman</p>
                <p className="text-xs text-muted-foreground">Notifikasi saat pinjaman disetujui/ditolak</p>
              </div>
              <Switch checked={notifSettings.loanApproval} onCheckedChange={v => setNotifSettings({ ...notifSettings, loanApproval: v })} />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium text-sm">Pemberitahuan Pencairan</p>
                <p className="text-xs text-muted-foreground">Notifikasi saat pinjaman dicairkan</p>
              </div>
              <Switch checked={notifSettings.disbursementNotice} onCheckedChange={v => setNotifSettings({ ...notifSettings, disbursementNotice: v })} />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveNotif} disabled={savingNotif} className="gap-1">
                <Save className="size-4" /> {savingNotif ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* System Settings */}
      <TabsContent value="system" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="size-4" /> Pengaturan Sistem
            </CardTitle>
            <CardDescription>Konfigurasi umum sistem</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nama Perusahaan</Label>
                <Input value={systemSettings.companyName} onChange={e => setSystemSettings({ ...systemSettings, companyName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Tagline</Label>
                <Input value={systemSettings.companyTagline} onChange={e => setSystemSettings({ ...systemSettings, companyTagline: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Mata Uang</Label>
                <Select value={systemSettings.currency} onValueChange={v => setSystemSettings({ ...systemSettings, currency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IDR">IDR - Rupiah Indonesia</SelectItem>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Format Tanggal</Label>
                <Select value={systemSettings.dateFormat} onValueChange={v => setSystemSettings({ ...systemSettings, dateFormat: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                    <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                    <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Zona Waktu</Label>
                <Select value={systemSettings.timezone} onValueChange={v => setSystemSettings({ ...systemSettings, timezone: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Jakarta">WIB (UTC+7)</SelectItem>
                    <SelectItem value="Asia/Makassar">WITA (UTC+8)</SelectItem>
                    <SelectItem value="Asia/Jayapura">WIT (UTC+9)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveSystem} disabled={savingSystem} className="gap-1">
                <Save className="size-4" /> {savingSystem ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>);
}

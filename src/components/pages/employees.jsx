import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, MoreHorizontal, Eye, EyeOff, Edit, Trash2, Mail, Phone, Building2, MapPin, Cake, ShieldCheck, Heart, Users, UserX, TrendingUp, FileSpreadsheet, Upload, Download, KeyRound } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/lib/store';
import { mockEmployees, mockCompanies } from '@/lib/mock-data';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel, getInitials, calculateAge, calculateDuration, getEmploymentStatusLabel, getEmploymentStatusColor, getMaritalStatusLabel, getMaritalStatusColor } from '@/lib/format';
import { toast } from 'sonner';

const AVATAR_COLORS = [
    'bg-blue-100 text-blue-700',
    'bg-violet-100 text-violet-700',
    'bg-rose-100 text-rose-700',
    'bg-amber-100 text-amber-700',
    'bg-emerald-100 text-emerald-700',
    'bg-cyan-100 text-cyan-700',
    'bg-orange-100 text-orange-700',
    'bg-pink-100 text-pink-700',
];

const getAvatarColor = (name = '') => AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const DetailField = ({ label, value, mono }) => (
    <div className="space-y-1.5">
        <Label className="text-xs">{label}</Label>
        <div className={`h-9 text-sm flex items-center px-3 rounded-md border bg-muted truncate ${mono ? 'font-mono' : ''}`}>
            {value || '-'}
        </div>
    </div>
);

const FIELD_LABELS = {
    employee_id: 'ID Karyawan', company: 'Perusahaan', name: 'Nama', email: 'Email',
    phone: 'Telepon', department: 'Departemen', position: 'Posisi', salary: 'Gaji',
    join_date: 'Tanggal Bergabung', password: 'Password', non_field_errors: '', detail: '',
};

const extractErrorMessage = (err, fallback) => {
    const data = err.response?.data;
    if (!data) return fallback;
    if (typeof data === 'string') return data;
    const messages = Object.entries(data).map(([field, value]) => {
        const text = Array.isArray(value) ? value.join(' ') : String(value);
        const label = FIELD_LABELS[field] ?? field;
        return label ? `${label}: ${text}` : text;
    });
    return messages.join(' ') || fallback;
};

const MARITAL_STATUS_VALUES = ['belum_menikah', 'menikah', 'cerai'];
const ACCOUNT_STATUS_VALUES = ['active', 'inactive', 'resigned'];
const EMPLOYMENT_STATUS_VALUES = ['tetap', 'kontrak', 'probasi'];

const mapEmployee = (e) => ({
    id: String(e.id),
    employeeId: e.employee_id,
    name: e.name,
    birthPlace: e.birth_place || '',
    birthDate: e.birth_date || '',
    companyId: e.company ? String(e.company) : '',
    companyName: e.company_name || '',
    department: e.department,
    position: e.position,
    employmentStatus: e.employment_status,
    maritalStatus: e.marital_status || 'belum_menikah',
    phone: e.phone || '',
    email: e.email || '',
    address: e.address || '',
    joinDate: e.join_date,
    salary: e.salary,
    bankName: e.bank_name || '',
    accountNumber: e.account_number || '',
    accountName: e.account_name || '',
    status: e.status,
    createdAt: e.created_at,
    updatedAt: e.updated_at,
});

const EMPTY_FORM = {
    companyId: '',
    employeeId: '',
    name: '',
    birthPlace: '',
    birthDate: '',
    department: '',
    position: '',
    employmentStatus: 'kontrak',
    maritalStatus: 'belum_menikah',
    phone: '',
    email: '',
    address: '',
    joinDate: '',
    salary: 0,
    bankName: '',
    accountNumber: '',
    accountName: '',
    status: 'active',
    password: '',
};

export function EmployeesPage() {
    const { navigate, currentUser } = useAppStore();
    const role = currentUser?.role || 'employee';
    const employeeId = currentUser?.employeeId;
    const isEmployee = role === 'employee';
    const [employees, setEmployees] = useState(mockEmployees);
    const [loadingEmployees, setLoadingEmployees] = useState(true);
    const [companies, setCompanies] = useState(mockCompanies);

    useEffect(() => {
        api.get('/employees/')
            .then(({ data }) => setEmployees(data.results ? data.results.map(mapEmployee) : data.map(mapEmployee)))
            .catch(() => { })
            .finally(() => setLoadingEmployees(false));
        api.get('/companies/')
            .then(({ data }) => {
                const list = data.results ?? data;
                if (list.length > 0) setCompanies(list);
            })
            .catch(() => { });
    }, []);

    const [search, setSearch] = useState('');
    const [companyFilter, setCompanyFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [addTab, setAddTab] = useState('manual');
    const [importedRows, setImportedRows] = useState([]);
    const [importFileName, setImportFileName] = useState('');
    const [importing, setImporting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showDetailDialog, setShowDetailDialog] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState(null);
    const [form, setForm] = useState({ ...EMPTY_FORM, companyId: currentUser?.companyId ?? '' });
    const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
    const [resetPasswordTarget, setResetPasswordTarget] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [resettingPassword, setResettingPassword] = useState(false);

    const visibleEmployees = useMemo(() => {
        if (isEmployee) return employeeId ? employees.filter(e => e.id === String(employeeId)) : [];
        return employees;
    }, [employees, isEmployee, employeeId]);

    const filtered = useMemo(() => {
        return visibleEmployees.filter(emp => {
            const matchSearch = emp.name.toLowerCase().includes(search.toLowerCase()) ||
                emp.employeeId.toLowerCase().includes(search.toLowerCase()) ||
                emp.email.toLowerCase().includes(search.toLowerCase());
            const matchDept = companyFilter === 'all' || (emp.companyName || '') === companyFilter;
            const matchStatus = statusFilter === 'all' || emp.status === statusFilter;
            return matchSearch && matchDept && matchStatus;
        });
    }, [visibleEmployees, search, companyFilter, statusFilter]);

    const companyFilteredEmployees = useMemo(() => {
        if (companyFilter === 'all') return visibleEmployees;
        return visibleEmployees.filter(e => (e.companyName || '') === companyFilter);
    }, [visibleEmployees, companyFilter]);

    const activeCount = useMemo(() => companyFilteredEmployees.filter(e => e.status === 'active').length, [companyFilteredEmployees]);
    const resignCount = useMemo(() => companyFilteredEmployees.filter(e => e.status === 'resigned').length, [companyFilteredEmployees]);
    const companyCount = companyFilter === 'all' ? companies.length : 1;
    const avgSalary = useMemo(() => {
        const active = companyFilteredEmployees.filter(e => e.status === 'active');
        if (active.length === 0) return 0;
        return active.reduce((sum, e) => sum + (e.salary || 0), 0) / active.length;
    }, [companyFilteredEmployees]);

    const handleAdd = () => {
        setForm({
            ...EMPTY_FORM,
            companyId: currentUser?.companyId ?? '',
            joinDate: new Date().toISOString().split('T')[0],
        });
        setAddTab('manual');
        setShowPassword(false);
        setImportedRows([]);
        setImportFileName('');
        setShowAddDialog(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                employee_id: form.employeeId,
                company: form.companyId || null,
                name: form.name,
                birth_place: form.birthPlace,
                birth_date: form.birthDate || null,
                department: form.department,
                position: form.position,
                employment_status: form.employmentStatus,
                marital_status: form.maritalStatus,
                phone: form.phone,
                email: form.email,
                address: form.address,
                join_date: form.joinDate,
                salary: form.salary,
                bank_name: form.bankName,
                account_number: form.accountNumber,
                account_name: form.accountName,
                status: form.status,
            };
            if (!editingId && form.password) {
                payload.password = form.password;
            }
            if (editingId) {
                const { data } = await api.patch(`/employees/${editingId}/`, payload);
                setEmployees(prev => prev.map(e => e.id === editingId ? mapEmployee(data) : e));
                toast.success('Data karyawan berhasil diperbarui');
            } else {
                const { data } = await api.post('/employees/', payload);
                setEmployees(prev => [...prev, mapEmployee(data)]);
                toast.success('Karyawan berhasil ditambahkan');
            }
            setShowAddDialog(false);
            setEditingId(null);
        } catch (err) {
            toast.error(extractErrorMessage(err, 'Gagal menyimpan karyawan'));
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (emp) => {
        setForm({
            ...EMPTY_FORM,
            companyId: emp.companyId || '',
            employeeId: emp.employeeId,
            name: emp.name,
            birthPlace: emp.birthPlace,
            birthDate: emp.birthDate,
            department: emp.department,
            position: emp.position,
            employmentStatus: emp.employmentStatus,
            maritalStatus: emp.maritalStatus,
            phone: emp.phone,
            email: emp.email,
            address: emp.address,
            joinDate: emp.joinDate,
            salary: emp.salary,
            bankName: emp.bankName || '',
            accountNumber: emp.accountNumber || '',
            accountName: emp.accountName || '',
            status: emp.status,
        });
        setEditingId(emp.id);
        setShowAddDialog(true);
    };

    const handleDeleteClick = (emp) => {
        setEmployeeToDelete(emp);
        setDeleteError(null);
        setShowDeleteDialog(true);
    };

    const confirmDelete = async () => {
        if (!employeeToDelete) return;
        setDeleting(true);
        setDeleteError(null);
        try {
            await api.delete(`/employees/${employeeToDelete.id}/`);
            setEmployees(prev => prev.filter(e => e.id !== employeeToDelete.id));
            setShowDeleteDialog(false);
            setEmployeeToDelete(null);
            toast.success('Karyawan berhasil dihapus');
        } catch (err) {
            setDeleteError(err?.response?.data?.error || 'Gagal menghapus karyawan');
        } finally {
            setDeleting(false);
        }
    };

    const handleViewDetail = (emp) => {
        setSelectedEmployee(emp);
        setShowDetailDialog(true);
    };

    const handleResetPasswordClick = (emp) => {
        setResetPasswordTarget(emp);
        setNewPassword('');
        setShowNewPassword(false);
        setShowResetPasswordDialog(true);
    };

    const confirmResetPassword = async () => {
        if (!resetPasswordTarget || newPassword.length < 6) return;
        setResettingPassword(true);
        try {
            await api.post(`/employees/${resetPasswordTarget.id}/reset-password/`, { password: newPassword });
            toast.success('Password berhasil diperbarui');
            setShowResetPasswordDialog(false);
            setResetPasswordTarget(null);
            setNewPassword('');
        } catch (err) {
            toast.error(extractErrorMessage(err, 'Gagal memperbarui password'));
        } finally {
            setResettingPassword(false);
        }
    };

    const downloadTemplate = () => {
        // Sheet 1: Template import
        const headers = [
            'ID Karyawan', 'Nama Lengkap', 'Tempat Lahir', 'Tanggal Lahir',
            'Status Nikah', 'Status Akun', 'Email', 'Telepon', 'Alamat',
            'ID Perusahaan', 'Departemen', 'Jabatan', 'Status Kepegawaian',
            'Tanggal Bergabung', 'Gaji Pokok', 'Username', 'Password',
        ];
        const example = [
            'EMP-001', 'Budi Santoso', 'Jakarta', '1990-01-15',
            'belum_menikah', 'active', 'budi@company.com', '081234567890', 'Jl. Contoh No. 1',
            String(companies[0]?.id || '1'), 'IT', 'Developer', 'tetap',
            new Date().toISOString().split('T')[0], 5000000, 'budi.santoso', 'password123',
        ];
        const ws = XLSX.utils.aoa_to_sheet([headers, example]);
        ws['!cols'] = [
            { wch: 12 }, { wch: 22 }, { wch: 16 }, { wch: 18 },
            { wch: 16 }, { wch: 12 }, { wch: 26 }, { wch: 16 }, { wch: 28 },
            { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 20 },
            { wch: 18 }, { wch: 14 }, { wch: 18 }, { wch: 18 },
        ];

        // Sheet 2: Reference values
        const refRows = [
            ['Kolom', 'Nilai yang Valid', 'Keterangan'],
            ['Status Nikah', 'belum_menikah', ''],
            ['', 'menikah', ''],
            ['', 'cerai', ''],
            ['', '', ''],
            ['Status Akun', 'active', 'Karyawan aktif'],
            ['', 'inactive', 'Tidak aktif'],
            ['', 'resigned', 'Sudah resign'],
            ['', '', ''],
            ['Status Kepegawaian', 'tetap', 'Karyawan tetap'],
            ['', 'kontrak', 'Karyawan kontrak'],
            ['', 'probasi', 'Masa percobaan'],
            ['', '', ''],
            ['ID Perusahaan', 'ID', 'Nama Perusahaan'],
            ...companies.map(c => ['', String(c.id), c.name]),
            ['', '', ''],
            ['Format Tanggal', 'YYYY-MM-DD', 'Contoh: 1990-01-15'],
            ['Gaji Pokok', 'Angka saja', 'Contoh: 5000000 (tanpa titik/koma)'],
        ];
        const wsRef = XLSX.utils.aoa_to_sheet(refRows);
        wsRef['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 30 }];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template');
        XLSX.utils.book_append_sheet(wb, wsRef, 'Referensi');
        XLSX.writeFile(wb, 'template_karyawan.xlsx');
    };

    const parseExcelRow = (row, index) => {
        const get = (key) => String(row[key] ?? '').trim();
        const employeeId = get('ID Karyawan');
        const name = get('Nama Lengkap');
        const email = get('Email');
        const companyIdRaw = get('ID Perusahaan');
        const company = companies.find(c => String(c.id) === companyIdRaw);
        const department = get('Departemen');
        const position = get('Jabatan');
        const employmentStatus = get('Status Kepegawaian') || 'kontrak';
        const maritalStatus = get('Status Nikah') || 'belum_menikah';
        const accountStatus = get('Status Akun') || 'active';
        const joinDate = get('Tanggal Bergabung');
        const salary = Number(get('Gaji Pokok').replace(/[^0-9.-]/g, '')) || 0;

        const errors = [];
        if (!employeeId) errors.push('ID Karyawan wajib diisi');
        if (!name) errors.push('Nama wajib diisi');
        if (!company) errors.push('ID Perusahaan tidak valid');
        if (!department) errors.push('Departemen wajib diisi');
        if (!position) errors.push('Jabatan wajib diisi');
        if (!EMPLOYMENT_STATUS_VALUES.includes(employmentStatus)) errors.push('Status Kepegawaian tidak valid');
        if (!MARITAL_STATUS_VALUES.includes(maritalStatus)) errors.push('Status Nikah tidak valid');
        if (!ACCOUNT_STATUS_VALUES.includes(accountStatus)) errors.push('Status Akun tidak valid');
        if (!joinDate) errors.push('Tanggal Bergabung wajib diisi');
        if (!email) errors.push('Email wajib diisi');

        return {
            rowIndex: index + 2,
            employeeId,
            name,
            birthPlace: get('Tempat Lahir'),
            birthDate: get('Tanggal Lahir'),
            maritalStatus,
            status: accountStatus,
            email,
            phone: get('Telepon'),
            address: get('Alamat'),
            companyId: company ? String(company.id) : '',
            companyName: company ? company.name : (companyIdRaw || '-'),
            department,
            position,
            employmentStatus,
            joinDate,
            salary,
            password: get('Password'),
            errors,
            valid: errors.length === 0,
        };
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = new Uint8Array(evt.target.result);
                const wb = XLSX.read(data, { type: 'array' });
                const sheet = wb.Sheets[wb.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false, dateNF: 'yyyy-mm-dd' });
                const parsed = rows
                    .filter(row => Object.values(row).some(v => String(v).trim() !== ''))
                    .map((row, idx) => parseExcelRow(row, idx));
                if (parsed.length === 0) {
                    toast.error('File tidak berisi data karyawan');
                    return;
                }
                setImportedRows(parsed);
                setImportFileName(file.name);
            } catch (err) {
                toast.error('Gagal membaca file Excel. Pastikan format file sesuai template.');
            }
        };
        reader.readAsArrayBuffer(file);
        e.target.value = '';
    };

    const handleImportSave = async () => {
        const validCount = importedRows.filter(r => r.valid).length;
        if (validCount === 0) return;
        setImporting(true);
        let successCount = 0;
        const remaining = [];
        for (const row of importedRows) {
            if (!row.valid) {
                remaining.push(row);
                continue;
            }
            try {
                const payload = {
                    employee_id: row.employeeId,
                    company: row.companyId,
                    name: row.name,
                    birth_place: row.birthPlace,
                    birth_date: row.birthDate || null,
                    department: row.department,
                    position: row.position,
                    employment_status: row.employmentStatus,
                    marital_status: row.maritalStatus,
                    phone: row.phone,
                    email: row.email,
                    address: row.address,
                    join_date: row.joinDate,
                    salary: row.salary,
                    status: row.status,
                };
                if (row.password) payload.password = row.password;
                const { data } = await api.post('/employees/', payload);
                setEmployees(prev => [...prev, mapEmployee(data)]);
                successCount++;
            } catch (err) {
                remaining.push({ ...row, valid: false, errors: [extractErrorMessage(err, 'Gagal menyimpan')] });
            }
        }
        setImporting(false);
        setImportedRows(remaining);
        if (successCount > 0) toast.success(`${successCount} karyawan berhasil diimport`);
        if (remaining.length > 0) {
            toast.error(`${remaining.length} baris gagal diimport, silakan periksa kembali`);
        } else {
            setImportFileName('');
            setShowAddDialog(false);
        }
    };

    // Employee role: show profile view
    if (isEmployee && filtered.length > 0) {
        const myProfile = filtered[0];
        return (
            <div className="space-y-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-5">
                            <Avatar className="size-16">
                                <AvatarFallback className={`text-xl font-semibold ${getAvatarColor(myProfile.name)}`}>
                                    {getInitials(myProfile.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h2 className="text-xl font-bold">{myProfile.name}</h2>
                                <p className="text-sm text-muted-foreground mt-0.5">{myProfile.position} · {myProfile.companyName || myProfile.department}</p>
                                <Badge variant="secondary" className={`mt-2 text-xs ${getStatusColor(myProfile.status)}`}>
                                    {getStatusLabel(myProfile.status)}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3 px-6 pt-5">
                        <CardTitle className="text-base">Informasi Pribadi</CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 pb-6">
                        <div className="grid gap-5 sm:grid-cols-2">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground flex items-center gap-1"><Building2 className="size-3" /> ID Karyawan</p>
                                <p className="font-mono font-semibold">{myProfile.employeeId}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="size-3" /> Tempat, Tgl Lahir</p>
                                <p className="font-semibold">{myProfile.birthPlace || '-'}{myProfile.birthDate ? `, ${formatDate(myProfile.birthDate)}` : ''}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground flex items-center gap-1"><Cake className="size-3" /> Usia</p>
                                <p className="font-semibold">{myProfile.birthDate ? `${calculateAge(myProfile.birthDate)} tahun` : '-'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground flex items-center gap-1"><ShieldCheck className="size-3" /> Status Kepegawaian</p>
                                <Badge variant="secondary" className={`text-xs w-fit ${getEmploymentStatusColor(myProfile.employmentStatus)}`}>
                                    {getEmploymentStatusLabel(myProfile.employmentStatus)}
                                </Badge>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground flex items-center gap-1"><Heart className="size-3" /> Status Pernikahan</p>
                                <Badge variant="secondary" className={`text-xs w-fit ${getMaritalStatusColor(myProfile.maritalStatus)}`}>
                                    {getMaritalStatusLabel(myProfile.maritalStatus)}
                                </Badge>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground flex items-center gap-1"><Building2 className="size-3" /> Perusahaan</p>
                                <p className="font-semibold">{myProfile.companyName || '-'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Departemen</p>
                                <p className="font-semibold">{myProfile.department || '-'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Jabatan</p>
                                <p className="font-semibold">{myProfile.position || '-'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="size-3" /> Email</p>
                                <p className="font-semibold">{myProfile.email || '-'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="size-3" /> Telepon</p>
                                <p className="font-semibold">{myProfile.phone || '-'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Tanggal Bergabung</p>
                                <p className="font-semibold">{myProfile.joinDate ? formatDate(myProfile.joinDate) : '-'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Lama Bergabung</p>
                                <p className="font-semibold">{myProfile.joinDate ? calculateDuration(myProfile.joinDate) : '-'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Gaji Pokok</p>
                                <p className="font-semibold">{formatCurrency(myProfile.salary)}</p>
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                                <p className="text-xs text-muted-foreground">Alamat</p>
                                <p className="font-semibold">{myProfile.address || '-'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input placeholder="Cari karyawan..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
                {!isEmployee && (<>
                    <Select value={companyFilter} onValueChange={setCompanyFilter}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Semua Perusahaan" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Perusahaan</SelectItem>
                            {companies.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[160px]">
                            <SelectValue placeholder="Semua Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Status</SelectItem>
                            <SelectItem value="active">Aktif</SelectItem>
                            <SelectItem value="inactive">Tidak Aktif</SelectItem>
                            <SelectItem value="resigned">Resign</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={handleAdd} className="bg-green-600 hover:bg-green-700 text-white shrink-0">
                        <Plus className="size-4 mr-2" />
                        Tambah Karyawan
                    </Button>
                </>)}
            </div>

            {/* Stat Cards */}
            {!isEmployee && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Karyawan Aktif</p>
                                </div>
                                <div className="size-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                    <Users className="size-5 text-emerald-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-2xl font-bold text-blue-600">{companyCount}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Perusahaan</p>
                                </div>
                                <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                    <Building2 className="size-5 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-2xl font-bold text-rose-600">{resignCount}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Resign</p>
                                </div>
                                <div className="size-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                                    <UserX className="size-5 text-rose-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="min-w-0">
                                    <p className="text-xl font-bold text-violet-600 truncate">{formatCurrency(avgSalary)}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Rata-rata Gaji</p>
                                </div>
                                <div className="size-10 rounded-full bg-violet-100 flex items-center justify-center shrink-0 ml-2">
                                    <TrendingUp className="size-5 text-violet-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Employee Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Karyawan</TableHead>
                                    <TableHead>ID</TableHead>
                                    <TableHead className="hidden md:table-cell">Perusahaan</TableHead>
                                    <TableHead className="hidden lg:table-cell">Jabatan</TableHead>
                                    <TableHead className="hidden sm:table-cell">Telepon</TableHead>
                                    <TableHead>Status</TableHead>
                                    {!isEmployee && <TableHead className="w-10"></TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((emp) => (
                                    <TableRow key={emp.id} className="cursor-pointer" onClick={() => handleViewDetail(emp)}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="size-9">
                                                    <AvatarFallback className={`text-xs font-semibold ${getAvatarColor(emp.name)}`}>
                                                        {getInitials(emp.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium text-sm">{emp.name}</p>
                                                    <p className="text-xs text-muted-foreground">{emp.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">{emp.employeeId}</TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <div className="flex items-center gap-1.5">
                                                <Building2 className="size-3 text-muted-foreground" />
                                                <span className="text-sm">{emp.companyName || '-'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell text-sm">{emp.position}</TableCell>
                                        <TableCell className="hidden sm:table-cell text-sm">{emp.phone}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className={`text-[10px] ${getStatusColor(emp.status)}`}>
                                                {getStatusLabel(emp.status)}
                                            </Badge>
                                        </TableCell>
                                        {!isEmployee && (
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                        <Button variant="ghost" size="icon" className="size-8">
                                                            <MoreHorizontal className="size-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewDetail(emp); }}>
                                                            <Eye className="size-4 mr-2" /> Lihat Detail
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(emp); }}>
                                                            <Edit className="size-4 mr-2" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleResetPasswordClick(emp); }}>
                                                            <KeyRound className="size-4 mr-2" /> Reset Password
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteClick(emp); }}>
                                                            <Trash2 className="size-4 mr-2" /> Hapus
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    {filtered.length === 0 && (
                        <div className="text-center py-10 text-muted-foreground">
                            <p>Tidak ada karyawan ditemukan</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add/Edit Employee Dialog */}
            {!isEmployee && (
                <Dialog open={showAddDialog} onOpenChange={(open) => { setShowAddDialog(open); if (!open) { setEditingId(null); setImportedRows([]); setImportFileName(''); } }}>
                    <DialogContent className="max-h-[90vh] overflow-y-auto !max-w-6xl">
                        <DialogHeader>
                            <DialogTitle>{editingId ? 'Edit Karyawan' : 'Tambah Karyawan Baru'}</DialogTitle>
                            <DialogDescription>
                                {editingId ? 'Perbarui data karyawan di bawah ini' : 'Isi data karyawan baru atau import dari file Excel'}
                            </DialogDescription>
                        </DialogHeader>

                        {/* Tabs — only show when adding */}
                        {!editingId && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setAddTab('manual')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${addTab === 'manual' ? 'bg-green-600 text-white' : 'border border-input bg-background hover:bg-accent'}`}
                                >
                                    <Users className="size-4" />
                                    Input Manual
                                </button>
                                <button
                                    onClick={() => setAddTab('excel')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${addTab === 'excel' ? 'bg-green-600 text-white' : 'border border-input bg-background hover:bg-accent'}`}
                                >
                                    <FileSpreadsheet className="size-4" />
                                    Import Excel
                                </button>
                            </div>
                        )}

                        {/* Import Excel tab */}
                        {!editingId && addTab === 'excel' && (
                            <div className="space-y-3">
                                {/* Download template row */}
                                <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                                    <div className="size-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                                        <FileSpreadsheet className="size-5 text-green-700" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium">Download Template Excel</p>
                                        <p className="text-xs text-muted-foreground">Unduh template yang sudah disediakan sistem, isi data karyawan, lalu upload kembali.</p>
                                    </div>
                                    <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={downloadTemplate}>
                                        <Download className="size-4" />
                                        Download
                                    </Button>
                                </div>
                                {/* Upload area */}
                                {importedRows.length === 0 ? (
                                    <label className="flex flex-col items-center justify-center gap-2 py-10 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/30 transition-colors text-muted-foreground">
                                        <Upload className="size-8 opacity-50" />
                                        <div className="text-center">
                                            <p className="text-sm font-medium text-foreground">Klik untuk pilih file Excel</p>
                                            <p className="text-xs mt-0.5">Format .xlsx atau .xls</p>
                                        </div>
                                        <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
                                    </label>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between gap-2 p-3 rounded-lg border bg-muted/30">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <FileSpreadsheet className="size-5 text-green-700 shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate">{importFileName}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {importedRows.length} baris · {importedRows.filter(r => r.valid).length} valid
                                                        {importedRows.some(r => !r.valid) && `, ${importedRows.filter(r => !r.valid).length} bermasalah`}
                                                    </p>
                                                </div>
                                            </div>
                                            <label className="shrink-0 inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md border border-input bg-background hover:bg-accent text-xs font-medium cursor-pointer">
                                                Ganti File
                                                <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
                                            </label>
                                        </div>
                                        <div className="border rounded-lg max-h-64 overflow-y-auto divide-y">
                                            {importedRows.map((row, i) => (
                                                <div key={i} className="p-2.5 flex items-center justify-between gap-2 text-sm">
                                                    <div className="min-w-0">
                                                        <p className="font-medium truncate">{row.name || `Baris ${row.rowIndex}`}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{row.email || '-'} · {row.companyName || '-'}</p>
                                                    </div>
                                                    {row.valid ? (
                                                        <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 shrink-0">
                                                            Valid
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="text-[10px] bg-red-100 text-red-700 shrink-0 max-w-[55%] truncate" title={row.errors.join(', ')}>
                                                            Baris {row.rowIndex}: {row.errors.join(', ')}
                                                        </Badge>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Manual form — stacked single-column layout */}
                        {(editingId || addTab === 'manual') && (
                            <div className="space-y-5">
                                {/* Data Pribadi */}
                                <div className="space-y-3">
                                    <p className="text-sm font-semibold flex items-center gap-2">
                                        <span className="w-1 h-4 bg-green-600 rounded-full inline-block" />
                                        Data Pribadi
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">ID Karyawan</Label>
                                            <Input value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} placeholder="Contoh: EMP-001" className="font-mono h-9 text-sm" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Nama Lengkap</Label>
                                            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nama lengkap" className="h-9 text-sm" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Tempat Lahir</Label>
                                            <Input value={form.birthPlace} onChange={e => setForm({ ...form, birthPlace: e.target.value })} placeholder="Kota kelahiran" className="h-9 text-sm" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Tanggal Lahir</Label>
                                            <Input type="date" value={form.birthDate} onChange={e => setForm({ ...form, birthDate: e.target.value })} className="h-9 text-sm" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Tanggal Bergabung</Label>
                                            <Input type="date" value={form.joinDate} onChange={e => setForm({ ...form, joinDate: e.target.value })} className="h-9 text-sm" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Lama Bergabung</Label>
                                            <Input value={form.joinDate ? calculateDuration(form.joinDate) : '—'} disabled className="h-9 text-sm bg-muted" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Status Nikah</Label>
                                            <Select value={form.maritalStatus} onValueChange={v => setForm({ ...form, maritalStatus: v })}>
                                                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="belum_menikah">Belum Menikah</SelectItem>
                                                    <SelectItem value="menikah">Menikah</SelectItem>
                                                    <SelectItem value="cerai">Cerai</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Status Akun</Label>
                                            <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                                                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="active">Aktif</SelectItem>
                                                    <SelectItem value="inactive">Tidak Aktif</SelectItem>
                                                    <SelectItem value="resigned">Resign</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Kontak */}
                                <div className="space-y-3">
                                    <p className="text-sm font-semibold flex items-center gap-2">
                                        <span className="w-1 h-4 bg-green-600 rounded-full inline-block" />
                                        Kontak
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Email</Label>
                                            <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@danakarya.id" className="h-9 text-sm" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Telepon</Label>
                                            <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="08xxxxxxxxxx" className="h-9 text-sm" />
                                        </div>
                                        <div className="space-y-1.5 col-span-2">
                                            <Label className="text-xs">Alamat</Label>
                                            <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Alamat lengkap" className="h-9 text-sm" />
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Kepegawaian */}
                                <div className="space-y-3">
                                    <p className="text-sm font-semibold flex items-center gap-2">
                                        <span className="w-1 h-4 bg-green-600 rounded-full inline-block" />
                                        Kepegawaian
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Perusahaan</Label>
                                            <Select value={String(form.companyId)} onValueChange={v => setForm({ ...form, companyId: v })}>
                                                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Pilih perusahaan" /></SelectTrigger>
                                                <SelectContent>
                                                    {companies.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Departemen</Label>
                                            <Input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="Nama departemen" className="h-9 text-sm" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Jabatan</Label>
                                            <Input value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} placeholder="Nama jabatan" className="h-9 text-sm" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Status Kepegawaian</Label>
                                            <Select value={form.employmentStatus} onValueChange={v => setForm({ ...form, employmentStatus: v })}>
                                                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="tetap">Karyawan Tetap</SelectItem>
                                                    <SelectItem value="kontrak">Karyawan Kontrak</SelectItem>
                                                    <SelectItem value="probasi">Probasi</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Tanggal Bergabung</Label>
                                            <Input type="date" value={form.joinDate} onChange={e => setForm({ ...form, joinDate: e.target.value })} className="h-9 text-sm" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Lama Bekerja</Label>
                                            <Input value={form.joinDate ? calculateDuration(form.joinDate) : '—'} disabled className="h-9 text-sm bg-muted" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Gaji Pokok</Label>
                                            <Input type="number" value={form.salary || ''} onChange={e => setForm({ ...form, salary: Number(e.target.value) })} placeholder="0" className="h-9 text-sm" />
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Informasi Rekening Bank */}
                                <div className="space-y-3">
                                    <p className="text-sm font-semibold flex items-center gap-2">
                                        <span className="w-1 h-4 bg-violet-600 rounded-full inline-block" />
                                        Rekening Bank
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Nama Bank</Label>
                                            <Input value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })} placeholder="Contoh: BCA, Mandiri, BRI" className="h-9 text-sm" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Nomor Rekening</Label>
                                            <Input value={form.accountNumber} onChange={e => setForm({ ...form, accountNumber: e.target.value })} placeholder="Nomor rekening" className="h-9 text-sm font-mono" />
                                        </div>
                                        <div className="space-y-1.5 col-span-2">
                                            <Label className="text-xs">Nama Pemilik Rekening</Label>
                                            <Input value={form.accountName} onChange={e => setForm({ ...form, accountName: e.target.value })} placeholder="Nama sesuai rekening bank" className="h-9 text-sm" />
                                        </div>
                                    </div>
                                </div>

                                {!editingId && <Separator />}

                                {/* Akses Sistem — only when adding new */}
                                {!editingId && (
                                    <div className="space-y-3">
                                        <p className="text-sm font-semibold flex items-center gap-2">
                                            <span className="w-1 h-4 bg-green-600 rounded-full inline-block" />
                                            Akses Sistem
                                        </p>
                                        <p className="text-xs text-muted-foreground -mt-1">
                                            Akun login akan dibuat otomatis menggunakan <strong>email</strong> di kolom kiri sebagai username. Kosongkan password jika tidak ingin membuatkan akun login sekarang.
                                        </p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">Email Login</Label>
                                                <Input value={form.email || '—'} disabled className="h-9 text-sm bg-muted" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">Password</Label>
                                                <div className="relative">
                                                    <Input
                                                        type={showPassword ? 'text' : 'password'}
                                                        value={form.password}
                                                        onChange={e => setForm({ ...form, password: e.target.value })}
                                                        placeholder="Password untuk login"
                                                        className="h-9 text-sm pr-9"
                                                    />
                                                    <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">Role</Label>
                                                <div className="flex items-center h-9">
                                                    <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                                                        <span className="size-1.5 rounded-full bg-blue-500 inline-block" />
                                                        Employee
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">Status Login</Label>
                                                <div className="flex items-center h-9">
                                                    <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium ${form.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                                        <span className={`size-1.5 rounded-full inline-block ${form.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                                                        {form.status === 'active' ? 'Aktif' : 'Nonaktif'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <DialogFooter>
                            <Button variant="outline" onClick={() => { setShowAddDialog(false); setEditingId(null); setImportedRows([]); setImportFileName(''); }}>Batal</Button>
                            {(editingId || addTab === 'manual') && (
                                <Button
                                    onClick={handleSave}
                                    disabled={saving || !form.companyId || !form.name || !form.email}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    {saving ? 'Menyimpan...' : editingId ? 'Perbarui' : 'Simpan'}
                                </Button>
                            )}
                            {!editingId && addTab === 'excel' && importedRows.length > 0 && (
                                <Button
                                    onClick={handleImportSave}
                                    disabled={importing || importedRows.filter(r => r.valid).length === 0}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    {importing ? 'Mengimport...' : `Import ${importedRows.filter(r => r.valid).length} Karyawan`}
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Hapus Karyawan</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus <strong>{employeeToDelete?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    {deleteError && (
                        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400">
                            {deleteError}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={deleting}>Batal</Button>
                        {!deleteError && <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>{deleting ? 'Menghapus...' : 'Hapus'}</Button>}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Employee Detail Dialog */}
            <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
                <DialogContent className="max-h-[90vh] overflow-y-auto !max-w-6xl">
                    {selectedEmployee && (<>
                        <DialogHeader>
                            <div className="flex items-center gap-3">
                                <Avatar className="size-12">
                                    <AvatarFallback className={`font-semibold ${getAvatarColor(selectedEmployee.name)}`}>
                                        {getInitials(selectedEmployee.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <DialogTitle>{selectedEmployee.name}</DialogTitle>
                                    <DialogDescription>{selectedEmployee.position} · {selectedEmployee.companyName || selectedEmployee.department}</DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="space-y-5">
                            {/* Data Pribadi */}
                            <div className="space-y-3">
                                <p className="text-sm font-semibold flex items-center gap-2">
                                    <span className="w-1 h-4 bg-green-600 rounded-full inline-block" />
                                    Data Pribadi
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <DetailField label="ID Karyawan" value={selectedEmployee.employeeId} mono />
                                    <DetailField label="Nama Lengkap" value={selectedEmployee.name} />
                                    <DetailField label="Tempat Lahir" value={selectedEmployee.birthPlace} />
                                    <DetailField label="Tanggal Lahir" value={selectedEmployee.birthDate ? formatDate(selectedEmployee.birthDate) : '-'} />
                                    <DetailField label="Usia" value={selectedEmployee.birthDate ? `${calculateAge(selectedEmployee.birthDate)} tahun` : '-'} />
                                    <DetailField label="Lama Bergabung" value={selectedEmployee.joinDate ? calculateDuration(selectedEmployee.joinDate) : '-'} />
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Status Nikah</Label>
                                        <div className="h-9 flex items-center">
                                            <Badge variant="secondary" className={`text-xs ${getMaritalStatusColor(selectedEmployee.maritalStatus)}`}>
                                                {getMaritalStatusLabel(selectedEmployee.maritalStatus)}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Status Akun</Label>
                                        <div className="h-9 flex items-center">
                                            <Badge variant="secondary" className={`text-xs ${getStatusColor(selectedEmployee.status)}`}>
                                                {getStatusLabel(selectedEmployee.status)}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Kontak */}
                            <div className="space-y-3">
                                <p className="text-sm font-semibold flex items-center gap-2">
                                    <span className="w-1 h-4 bg-green-600 rounded-full inline-block" />
                                    Kontak
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <DetailField label="Email" value={selectedEmployee.email} />
                                    <DetailField label="Telepon" value={selectedEmployee.phone} />
                                    <div className="col-span-2">
                                        <DetailField label="Alamat" value={selectedEmployee.address} />
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Kepegawaian */}
                            <div className="space-y-3">
                                <p className="text-sm font-semibold flex items-center gap-2">
                                    <span className="w-1 h-4 bg-green-600 rounded-full inline-block" />
                                    Kepegawaian
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <DetailField label="Perusahaan" value={selectedEmployee.companyName} />
                                    <DetailField label="Departemen" value={selectedEmployee.department} />
                                    <DetailField label="Jabatan" value={selectedEmployee.position} />
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Status Kepegawaian</Label>
                                        <div className="h-9 flex items-center">
                                            <Badge variant="secondary" className={`text-xs ${getEmploymentStatusColor(selectedEmployee.employmentStatus)}`}>
                                                {getEmploymentStatusLabel(selectedEmployee.employmentStatus)}
                                            </Badge>
                                        </div>
                                    </div>
                                    <DetailField label="Tanggal Bergabung" value={selectedEmployee.joinDate ? formatDate(selectedEmployee.joinDate) : '-'} />
                                    <DetailField label="Lama Bekerja" value={selectedEmployee.joinDate ? calculateDuration(selectedEmployee.joinDate) : '-'} />
                                    <DetailField label="Gaji Pokok" value={formatCurrency(selectedEmployee.salary)} />
                                </div>
                            </div>

                            <Separator />

                            {/* Rekening Bank */}
                            <div className="space-y-3">
                                <p className="text-sm font-semibold flex items-center gap-2">
                                    <span className="w-1 h-4 bg-violet-600 rounded-full inline-block" />
                                    Rekening Bank
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <DetailField label="Nama Bank" value={selectedEmployee.bankName} />
                                    <DetailField label="Nomor Rekening" value={selectedEmployee.accountNumber} mono />
                                    <div className="col-span-2">
                                        <DetailField label="Nama Pemilik Rekening" value={selectedEmployee.accountName} />
                                    </div>
                                </div>
                            </div>

                            {!isEmployee && (<>
                                <Separator />

                                {/* Akses Sistem */}
                                <div className="space-y-3">
                                    <p className="text-sm font-semibold flex items-center gap-2">
                                        <span className="w-1 h-4 bg-green-600 rounded-full inline-block" />
                                        Akses Sistem
                                    </p>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
                                        <DetailField label="Email Login" value={selectedEmployee.email} />
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Status Login</Label>
                                            <div className="h-9 flex items-center">
                                                <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium ${selectedEmployee.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    <span className={`size-1.5 rounded-full inline-block ${selectedEmployee.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                                                    {selectedEmployee.status === 'active' ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => handleResetPasswordClick(selectedEmployee)}>
                                                <KeyRound className="size-4" />
                                                Reset Password
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </>)}
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Tutup</Button>
                        </DialogFooter>
                    </>)}
                </DialogContent>
            </Dialog>

            {/* Reset Password Dialog */}
            {!isEmployee && (
                <Dialog open={showResetPasswordDialog} onOpenChange={(open) => { setShowResetPasswordDialog(open); if (!open) { setResetPasswordTarget(null); setNewPassword(''); } }}>
                    <DialogContent className="max-w-sm">
                        <DialogHeader>
                            <DialogTitle>Reset Password</DialogTitle>
                            <DialogDescription>
                                Atur password login baru untuk <strong>{resetPasswordTarget?.name}</strong>.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Password Baru</Label>
                            <div className="relative">
                                <Input
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    placeholder="Minimal 6 karakter"
                                    className="h-9 text-sm pr-9"
                                />
                                <button type="button" onClick={() => setShowNewPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                    {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                            {newPassword && newPassword.length < 6 && (
                                <p className="text-xs text-red-600">Password minimal 6 karakter</p>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowResetPasswordDialog(false)} disabled={resettingPassword}>Batal</Button>
                            <Button
                                onClick={confirmResetPassword}
                                disabled={resettingPassword || newPassword.length < 6}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                {resettingPassword ? 'Menyimpan...' : 'Simpan'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}

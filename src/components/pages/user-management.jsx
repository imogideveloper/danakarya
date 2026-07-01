import React, { useState, useEffect } from 'react';
import { UserCog, Plus, Search, Shield, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import api from '@/lib/api';
import { formatDate, getInitials } from '@/lib/format';
import { toast } from 'sonner';

const roleLabels = {
    admin: 'Administrator',
    manager: 'Manager',
    finance: 'Finance',
    employee: 'Karyawan',
};
const roleColors = {
    admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    manager: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    finance: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    employee: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

const EMPTY_FORM = { name: '', email: '', role: 'finance', password: '' };

const FIELD_LABELS = { email: 'Email', name: 'Nama', role: 'Role', password: 'Password', non_field_errors: '', detail: '' };

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

const mapUser = (u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    isActive: u.is_active,
    lastLoginAt: u.last_login_at,
    createdAt: u.created_at,
});

export function UserManagementPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showFormDialog, setShowFormDialog] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchUsers = () => api.get('/auth/users/')
        .then(({ data }) => setUsers((data.results ?? data).map(mapUser)));

    useEffect(() => {
        fetchUsers().catch(() => {}).finally(() => setLoading(false));
    }, []);

    const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()));

    const openAdd = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setShowFormDialog(true);
    };

    const openEdit = (user) => {
        setEditingId(user.id);
        setForm({ name: user.name, email: user.email, role: user.role, password: '' });
        setShowFormDialog(true);
    };

    const handleSubmit = async () => {
        setSaving(true);
        try {
            if (editingId) {
                const { data } = await api.patch(`/auth/users/${editingId}/`, {
                    name: form.name, email: form.email, role: form.role,
                });
                setUsers(prev => prev.map(u => u.id === editingId ? mapUser(data) : u));
                toast.success('User berhasil diperbarui');
            } else {
                await api.post('/auth/register/', form);
                await fetchUsers();
                toast.success('User berhasil ditambahkan');
            }
            setShowFormDialog(false);
            setEditingId(null);
        } catch (err) {
            toast.error(extractErrorMessage(err, 'Gagal menyimpan user'));
        } finally {
            setSaving(false);
        }
    };

    const toggleUserStatus = async (user) => {
        try {
            const { data } = await api.patch(`/auth/users/${user.id}/`, { is_active: !user.isActive });
            setUsers(prev => prev.map(u => u.id === user.id ? mapUser(data) : u));
            toast.success('Status user berhasil diubah');
        } catch {
            toast.error('Gagal mengubah status user');
        }
    };

    const handleDeleteClick = (user) => {
        setUserToDelete(user);
        setShowDeleteDialog(true);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;
        setDeleting(true);
        try {
            await api.delete(`/auth/users/${userToDelete.id}/`);
            setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
            setShowDeleteDialog(false);
            setUserToDelete(null);
            toast.success('User berhasil dihapus');
        } catch {
            toast.error('Gagal menghapus user');
        } finally {
            setDeleting(false);
        }
    };

    return (<div className="space-y-4">
      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {['admin', 'manager', 'finance', 'employee'].map(role => (<Card key={role}>
            <CardContent className="p-4 flex items-center gap-3">
              <Shield className="size-5 text-primary"/>
              <div>
                <p className="text-xl font-bold">{users.filter(u => u.role === role).length}</p>
                <p className="text-xs text-muted-foreground">{roleLabels[role]}</p>
              </div>
            </CardContent>
          </Card>))}
      </div>

      {/* Search & Add */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"/>
              <Input placeholder="Cari user..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9"/>
            </div>
            <Button onClick={openAdd}>
              <Plus className="size-4 mr-2"/> Tambah User
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Login Terakhir</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (<TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Memuat data...</TableCell></TableRow>)}
                {!loading && filtered.length === 0 && (<TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Tidak ada user ditemukan</TableCell></TableRow>)}
                {!loading && filtered.map(user => (<TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarFallback className={`text-xs ${user.role === 'admin' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-primary/10 text-primary'}`}>
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-[10px] ${roleColors[user.role]}`}>
                        {roleLabels[user.role]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <Switch checked={user.isActive} onCheckedChange={() => toggleUserStatus(user)} className="scale-75"/>
                        <span className="text-xs">{user.isActive ? 'Aktif' : 'Nonaktif'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Belum pernah'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4"/>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(user)}><Edit className="size-4 mr-2"/> Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(user)}><Trash2 className="size-4 mr-2"/> Hapus</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit User Dialog */}
      <Dialog open={showFormDialog} onOpenChange={(open) => { setShowFormDialog(open); if (!open) setEditingId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="size-5"/> {editingId ? 'Edit User' : 'Tambah User Baru'}
            </DialogTitle>
            <DialogDescription>{editingId ? 'Perbarui data user di bawah ini' : 'Isi data user baru di bawah ini'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!editingId && (
              <p className="text-xs text-muted-foreground -mb-2 bg-muted/50 rounded-md px-3 py-2">
                Untuk membuat akun <strong>Karyawan</strong>, gunakan halaman <strong>Karyawan</strong> agar akun otomatis terhubung dengan profil dan data gajinya.
              </p>
            )}
            <div className="space-y-2">
              <Label>Nama</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nama lengkap"/>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@danakarya.id"/>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!editingId && (<div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••"/>
            </div>)}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFormDialog(false)} disabled={saving}>Batal</Button>
            <Button onClick={handleSubmit} disabled={saving || !form.name || !form.email || (!editingId && !form.password)}>
              {saving ? 'Menyimpan...' : editingId ? 'Perbarui' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus User</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus <strong>{userToDelete?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={deleting}>Batal</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>{deleting ? 'Menghapus...' : 'Hapus'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>);
}

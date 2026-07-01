export function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num) {
  return new Intl.NumberFormat('id-ID').format(num);
}

export function formatDate(dateStr) {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(dateStr) {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatCompactCurrency(amount) {
  if (amount >= 1000000000) {
    return `Rp ${(amount / 1000000000).toFixed(1)}M`;
  }
  if (amount >= 1000000) {
    return `Rp ${(amount / 1000000).toFixed(1)}Jt`;
  }
  if (amount >= 1000) {
    return `Rp ${(amount / 1000).toFixed(0)}K`;
  }
  return formatCurrency(amount);
}

export function getInitials(name) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getStatusColor(status) {
  const colors = {
    // Loan application
    draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    submitted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    under_review: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    verified: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    disbursed: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    // Loan & Employee
    active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    // Loan
    paid_off: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    defaulted: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    settled: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
    written_off: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    // Installment
    paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    unpaid: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    partial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    // Employee
    inactive: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    resigned: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    terminated: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    // Payment
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    confirmed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    // Savings
    frozen: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    closed: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    // Savings transaction type
    deposit: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    withdrawal: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    interest: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
    // Savings withdrawal status
    completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  };
  return colors[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
}

export function getStatusLabel(status) {
  const labels = {
    draft: 'Draft',
    submitted: 'Menunggu Verifikasi',
    under_review: 'Menunggu Verifikasi',
    verified: 'Terverifikasi',
    approved: 'Disetujui',
    disbursed: 'Dicairkan',
    rejected: 'Ditolak',
    active: 'Aktif',
    paid_off: 'Lunas',
    defaulted: 'Gagal Bayar',
    settled: 'Diselesaikan',
    written_off: 'Hapus Buku',
    paid: 'Terbayar',
    unpaid: 'Belum Bayar',
    overdue: 'Terlambat',
    partial: 'Sebagian',
    inactive: 'Tidak Aktif',
    resigned: 'Resign',
    terminated: 'Terminated',
    pending: 'Tertunda',
    confirmed: 'In Payment',
    bank_transfer: 'Transfer Bank',
    cash: 'Tunai',
    auto_debit: 'Auto Debit',
    // Savings
    frozen: 'Dibekukan',
    closed: 'Ditutup',
    // Savings transaction type
    deposit: 'Setor',
    withdrawal: 'Tarik',
    interest: 'Bunga',
    // Savings type
    wajib: 'Wajib',
    sukarela: 'Sukarela',
    hari_raya: 'Hari Raya',
    pendidikan: 'Pendidikan',
    dana_pensiun: 'Dana Pensiun',
    // Savings withdrawal status
    completed: 'Selesai',
  };
  return labels[status] || status;
}

export function calculateMonthlyPayment(principal, tenor) {
  return Math.floor(principal / tenor);
}

export const ADMIN_FEE_TIERS = [
  { max: 1000000, fee: 50000 },
  { max: Infinity, fee: 100000 },
];

export function calculateAdminFeeAmount(principal, adminFeeType, adminFee, tiers = ADMIN_FEE_TIERS) {
  if (adminFeeType === 'tiered') {
    const tier = tiers.find(t => principal <= t.max);
    return tier ? tier.fee : tiers[tiers.length - 1].fee;
  }
  if (adminFeeType === 'fixed') return adminFee;
  return Math.round(principal * adminFee / 100);
}

export function calculateDisbursedAmount(principal, adminFeeType, adminFee, tiers = ADMIN_FEE_TIERS) {
  const fee = calculateAdminFeeAmount(principal, adminFeeType, adminFee, tiers);
  return principal - fee;
}

export function formatAdminFee(adminFeeType, adminFee) {
  if (adminFeeType === 'tiered') return 'Berjenjang';
  if (adminFeeType === 'fixed') return formatCurrency(adminFee);
  return `${adminFee}%`;
}

export function generateApplicationNo() {
  const year = new Date().getFullYear();
  const num = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
  return `LA-${year}-${num}`;
}

export function generateLoanNo() {
  const year = new Date().getFullYear();
  const num = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
  return `LN-${year}-${num}`;
}

export function generatePaymentNo() {
  const year = new Date().getFullYear();
  const num = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
  return `PAY-${year}-${num}`;
}

export function generateEmployeeId() {
  const num = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
  return `EMP-${num}`;
}

export function generateSavingsAccountNo(code) {
  const num = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
  return `${code}-${num}`;
}

export function generateTransactionNo() {
  const year = new Date().getFullYear();
  const num = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
  return `STR-${year}-${num}`;
}

export function generateWithdrawalNo() {
  const year = new Date().getFullYear();
  const num = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
  return `TARI-${year}-${num}`;
}

export function getRelativeTime(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return formatDate(dateStr);
}

export function getEmploymentStatusLabel(status) {
  const labels = {
    tetap: 'Karyawan Tetap',
    kontrak: 'Karyawan Kontrak',
    probasi: 'Probasi',
  };
  return labels[status] || status;
}

export function getEmploymentStatusColor(status) {
  const colors = {
    tetap: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    kontrak: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    probasi: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
  };
  return colors[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
}

export function getMaritalStatusLabel(status) {
  const labels = {
    belum_menikah: 'Belum Menikah',
    menikah: 'Menikah',
    cerai: 'Cerai',
  };
  return labels[status] || status;
}

export function getMaritalStatusColor(status) {
  const colors = {
    belum_menikah: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
    menikah: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
    cerai: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  };
  return colors[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
}

export function calculateAge(birthDate) {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function calculateDuration(fromDate) {
  const today = new Date();
  const start = new Date(fromDate);
  let years = today.getFullYear() - start.getFullYear();
  let months = today.getMonth() - start.getMonth();
  if (today.getDate() < start.getDate()) months--;
  if (months < 0) {
    years--;
    months += 12;
  }
  if (years < 0) return '0 bulan';
  const parts = [];
  if (years > 0) parts.push(`${years} tahun`);
  if (months > 0 || years === 0) parts.push(`${months} bulan`);
  return parts.join(' ');
}

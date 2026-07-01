







// ============================================
// Companies (MoU Partners)
// ============================================
export const mockCompanies = [
  {
    id: 'c1',
    name: 'PT Teknologi Nusantara',
    code: 'TNU',
    address: 'Jl. Sudirman No. 100, Jakarta Selatan',
    phone: '021-5551234',
    email: 'hrd@teknonus.co.id',
    contactPerson: 'Irfan Hakim',
    mouNumber: 'MOU/DK/2026/001',
    mouDate: '2026-01-15',
    mouExpiryDate: '2026-01-15',
    maxLoanAmount: 30000000,
    maxLoanToSalaryPercent: 75,
    adminFeeType: 'percentage',
    adminFee: 1,
    maxTenor: 24,
    maxActiveLoans: 2,
    status: 'active',
    createdAt: '2026-01-15T00:00:00',
    updatedAt: '2026-01-01T00:00:00',
  },
  {
    id: 'c2',
    name: 'PT Mitra Sejahtera',
    code: 'MSJ',
    address: 'Jl. Gatot Subroto No. 55, Jakarta Selatan',
    phone: '021-5555678',
    email: 'finance@mitrasej.co.id',
    contactPerson: 'Diana Putri',
    mouNumber: 'MOU/DK/2026/002',
    mouDate: '2026-03-01',
    mouExpiryDate: '2026-03-01',
    maxLoanAmount: 20000000,
    maxLoanToSalaryPercent: 75,
    adminFeeType: 'percentage',
    adminFee: 1,
    maxTenor: 18,
    maxActiveLoans: 1,
    status: 'active',
    createdAt: '2026-03-01T00:00:00',
    updatedAt: '2026-01-01T00:00:00',
  },
  {
    id: 'c3',
    name: 'CV Karya Mandiri',
    code: 'KMD',
    address: 'Jl. Pahlawan No. 22, Surabaya',
    phone: '031-5559012',
    email: 'admin@karyamandiri.co.id',
    contactPerson: 'Agus Prasetyo',
    mouNumber: 'MOU/DK/2026/003',
    mouDate: '2026-06-10',
    mouExpiryDate: '2026-06-10',
    maxLoanAmount: 15000000,
    maxLoanToSalaryPercent: 75,
    adminFeeType: 'fixed',
    adminFee: 100000,
    maxTenor: 12,
    maxActiveLoans: 1,
    status: 'active',
    createdAt: '2026-06-10T00:00:00',
    updatedAt: '2026-01-01T00:00:00',
  },
];

// ============================================
// Users
// ============================================
export const mockUsers = [
  { id: 'u1', email: 'admin@danakarya.id', name: 'Budi Santoso', role: 'admin', isActive: true, lastLoginAt: '2026-01-15T08:30:00', createdAt: '2026-01-01T00:00:00', updatedAt: '2026-01-15T08:30:00' },
  { id: 'u2', email: 'manager@danakarya.id', name: 'Siti Rahayu', role: 'manager', isActive: true, lastLoginAt: '2026-01-15T09:00:00', createdAt: '2026-01-01T00:00:00', updatedAt: '2026-01-15T09:00:00' },
  { id: 'u3', email: 'finance@danakarya.id', name: 'Andi Wijaya', role: 'finance', isActive: true, lastLoginAt: '2026-01-15T08:45:00', createdAt: '2026-02-01T00:00:00', updatedAt: '2026-01-15T08:45:00' },
  { id: 'u4', email: 'ahmad@danakarya.id', name: 'Ahmad Fauzi', role: 'employee', isActive: true, lastLoginAt: '2026-01-14T16:30:00', createdAt: '2026-03-01T00:00:00', updatedAt: '2026-01-14T16:30:00' },
  { id: 'u5', email: 'dewi@danakarya.id', name: 'Dewi Lestari', role: 'employee', isActive: true, lastLoginAt: '2026-01-14T17:00:00', createdAt: '2026-03-15T00:00:00', updatedAt: '2026-01-14T17:00:00' },
  { id: 'u6', email: 'rudi@danakarya.id', name: 'Rudi Hartono', role: 'employee', isActive: true, lastLoginAt: '2026-01-13T14:20:00', createdAt: '2026-04-01T00:00:00', updatedAt: '2026-01-13T14:20:00' },
  { id: 'u7', email: 'nurul@danakarya.id', name: 'Nurul Hidayah', role: 'finance', isActive: true, lastLoginAt: '2026-01-15T07:30:00', createdAt: '2026-05-01T00:00:00', updatedAt: '2026-01-15T07:30:00' },
  { id: 'u8', email: 'bambang@danakarya.id', name: 'Bambang Supriyo', role: 'employee', isActive: false, lastLoginAt: '2026-12-20T10:00:00', createdAt: '2026-01-15T00:00:00', updatedAt: '2026-12-20T10:00:00' },
];

// ============================================
// Employees
// ============================================
export const mockEmployees = [
  { id: 'e1', employeeId: 'EMP-001', name: 'Ahmad Fauzi', birthPlace: 'Jakarta', birthDate: '1990-05-15', department: 'Engineering', position: 'Senior Developer', employmentStatus: 'tetap', maritalStatus: 'menikah', phone: '081234567890', email: 'ahmad@danakarya.id', address: 'Jl. Sudirman No. 45, Jakarta Selatan', joinDate: '2022-03-15', salary: 15000000, status: 'active', userId: 'u4', companyId: 'c1', createdAt: '2026-01-01T00:00:00', updatedAt: '2026-01-10T00:00:00' },
  { id: 'e2', employeeId: 'EMP-002', name: 'Dewi Lestari', birthPlace: 'Bandung', birthDate: '1993-08-22', department: 'Finance', position: 'Finance Analyst', employmentStatus: 'tetap', maritalStatus: 'belum_menikah', phone: '081234567891', email: 'dewi@danakarya.id', address: 'Jl. Thamrin No. 12, Jakarta Pusat', joinDate: '2022-06-01', salary: 12000000, status: 'active', userId: 'u5', companyId: 'c1', createdAt: '2026-01-01T00:00:00', updatedAt: '2026-01-10T00:00:00' },
  { id: 'e3', employeeId: 'EMP-003', name: 'Rudi Hartono', birthPlace: 'Surabaya', birthDate: '1988-12-03', department: 'Marketing', position: 'Marketing Manager', employmentStatus: 'tetap', maritalStatus: 'menikah', phone: '081234567892', email: 'rudi@danakarya.id', address: 'Jl. Gatot Subroto No. 78, Jakarta Selatan', joinDate: '2021-01-10', salary: 18000000, status: 'active', userId: 'u6', companyId: 'c1', createdAt: '2026-01-01T00:00:00', updatedAt: '2026-01-10T00:00:00' },
  { id: 'e4', employeeId: 'EMP-004', name: 'Siti Rahayu', birthPlace: 'Semarang', birthDate: '1985-03-10', department: 'Human Resources', position: 'HR Manager', employmentStatus: 'tetap', maritalStatus: 'menikah', phone: '081234567893', email: 'siti@danakarya.id', address: 'Jl. Kuningan No. 33, Jakarta Selatan', joinDate: '2020-05-20', salary: 20000000, status: 'active', userId: 'u2', companyId: 'c2', createdAt: '2026-01-01T00:00:00', updatedAt: '2026-01-10T00:00:00' },
  { id: 'e5', employeeId: 'EMP-005', name: 'Budi Santoso', birthPlace: 'Yogyakarta', birthDate: '1982-11-28', department: 'IT', position: 'IT Director', employmentStatus: 'tetap', maritalStatus: 'menikah', phone: '081234567894', email: 'budi@danakarya.id', address: 'Jl. Rasuna Said No. 56, Jakarta Selatan', joinDate: '2019-08-01', salary: 35000000, status: 'active', userId: 'u1', companyId: 'c1', createdAt: '2026-01-01T00:00:00', updatedAt: '2026-01-10T00:00:00' },
  { id: 'e6', employeeId: 'EMP-006', name: 'Andi Wijaya', birthPlace: 'Medan', birthDate: '1987-07-19', department: 'Finance', position: 'Finance Manager', employmentStatus: 'tetap', maritalStatus: 'cerai', phone: '081234567895', email: 'andi@danakarya.id', address: 'Jl. HR Rasuna Said No. 22, Jakarta Selatan', joinDate: '2020-02-15', salary: 22000000, status: 'active', userId: 'u3', companyId: 'c2', createdAt: '2026-01-01T00:00:00', updatedAt: '2026-01-10T00:00:00' },
  { id: 'e7', employeeId: 'EMP-007', name: 'Nurul Hidayah', birthPlace: 'Makassar', birthDate: '1995-02-14', department: 'Finance', position: 'Accounting Staff', employmentStatus: 'kontrak', maritalStatus: 'belum_menikah', phone: '081234567896', email: 'nurul@danakarya.id', address: 'Jl. Casablanca No. 88, Jakarta Selatan', joinDate: '2026-01-09', salary: 10000000, status: 'active', userId: 'u7', companyId: 'c2', createdAt: '2026-01-01T00:00:00', updatedAt: '2026-01-10T00:00:00' },
  { id: 'e8', employeeId: 'EMP-008', name: 'Bambang Supriyo', birthPlace: 'Solo', birthDate: '1991-09-05', department: 'Operations', position: 'Operations Staff', employmentStatus: 'kontrak', maritalStatus: 'belum_menikah', phone: '081234567897', email: 'bambang@danakarya.id', address: 'Jl. Pahlawan No. 15, Surabaya', joinDate: '2022-09-01', salary: 9000000, status: 'resigned', userId: 'u8', companyId: 'c3', createdAt: '2026-01-01T00:00:00', updatedAt: '2026-12-20T00:00:00' },
  { id: 'e9', employeeId: 'EMP-009', name: 'Rina Wulandari', birthPlace: 'Bekasi', birthDate: '1994-06-30', department: 'Engineering', position: 'QA Engineer', employmentStatus: 'kontrak', maritalStatus: 'belum_menikah', phone: '081234567898', email: 'rina@danakarya.id', address: 'Jl. Tendean No. 41, Jakarta Selatan', joinDate: '2026-06-15', salary: 11000000, status: 'active', companyId: 'c1', createdAt: '2026-01-01T00:00:00', updatedAt: '2026-01-10T00:00:00' },
  { id: 'e10', employeeId: 'EMP-010', name: 'Fajar Nugroho', birthPlace: 'Tangerang', birthDate: '1996-04-12', department: 'Marketing', position: 'Digital Marketing', employmentStatus: 'probasi', maritalStatus: 'belum_menikah', phone: '081234567899', email: 'fajar@danakarya.id', address: 'Jl. MT Haryono No. 67, Jakarta Timur', joinDate: '2026-09-01', salary: 9500000, status: 'active', companyId: 'c3', createdAt: '2026-01-01T00:00:00', updatedAt: '2026-01-10T00:00:00' },
  { id: 'e11', employeeId: 'EMP-011', name: 'Maya Sari', birthPlace: 'Depok', birthDate: '1997-01-25', department: 'Human Resources', position: 'Recruitment Staff', employmentStatus: 'probasi', maritalStatus: 'belum_menikah', phone: '081234567800', email: 'maya@danakarya.id', address: 'Jl. Veteran No. 23, Jakarta Pusat', joinDate: '2026-01-08', salary: 8500000, status: 'active', companyId: 'c2', createdAt: '2026-01-08T00:00:00', updatedAt: '2026-01-10T00:00:00' },
  { id: 'e12', employeeId: 'EMP-012', name: 'Hendra Setiawan', birthPlace: 'Bogor', birthDate: '1989-10-08', department: 'Engineering', position: 'DevOps Engineer', employmentStatus: 'tetap', maritalStatus: 'menikah', phone: '081234567801', email: 'hendra@danakarya.id', address: 'Jl. Boulevard No. 90, Tangerang', joinDate: '2026-04-01', salary: 16000000, status: 'active', companyId: 'c1', createdAt: '2026-01-01T00:00:00', updatedAt: '2026-01-10T00:00:00' },
];

// ============================================
// Loan Applications
// ============================================
export const mockLoanApplications = [
  { id: 'la1', applicationNo: 'LA-2026-001', employeeId: 'e1', employeeName: 'Ahmad Fauzi', loanAmount: 10000000, loanPurpose: 'Renovasi Rumah', tenor: 12, adminFeeType: 'percentage', adminFee: 1, adminFeeAmount: 100000, disbursedAmount: 9900000, status: 'approved', notes: 'Renovasi dapur dan kamar mandi', applicationDate: '2026-01-02', reviewedBy: 'Siti Rahayu', reviewedAt: '2026-01-03T10:00:00', createdAt: '2026-01-02T09:00:00', updatedAt: '2026-01-03T10:00:00' },
  { id: 'la2', applicationNo: 'LA-2026-002', employeeId: 'e3', employeeName: 'Rudi Hartono', loanAmount: 25000000, loanPurpose: 'Pembelian Kendaraan', tenor: 24, adminFeeType: 'fixed', adminFee: 250000, adminFeeAmount: 250000, disbursedAmount: 24750000, status: 'approved', notes: 'DP mobil second', applicationDate: '2026-01-05', reviewedBy: 'Siti Rahayu', reviewedAt: '2026-01-06T14:00:00', createdAt: '2026-01-05T11:00:00', updatedAt: '2026-01-06T14:00:00' },
  { id: 'la3', applicationNo: 'LA-2026-003', employeeId: 'e2', employeeName: 'Dewi Lestari', loanAmount: 5000000, loanPurpose: 'Biaya Pendidikan', tenor: 6, adminFeeType: 'fixed', adminFee: 50000, adminFeeAmount: 50000, disbursedAmount: 4950000, status: 'approved', notes: 'Biaya kursus sertifikasi AKUNTAN', applicationDate: '2026-01-08', reviewedBy: 'Siti Rahayu', reviewedAt: '2026-01-09T09:30:00', createdAt: '2026-01-08T14:30:00', updatedAt: '2026-01-09T09:30:00' },
  { id: 'la4', applicationNo: 'LA-2026-004', employeeId: 'e9', employeeName: 'Rina Wulandari', loanAmount: 8000000, loanPurpose: 'Biaya Medis', tenor: 12, adminFeeType: 'percentage', adminFee: 1, adminFeeAmount: 80000, disbursedAmount: 7920000, status: 'submitted', notes: 'Biaya operasi orang tua', applicationDate: '2026-01-12', createdAt: '2026-01-12T10:00:00', updatedAt: '2026-01-12T10:00:00' },
  { id: 'la5', applicationNo: 'LA-2026-005', employeeId: 'e10', employeeName: 'Fajar Nugroho', loanAmount: 15000000, loanPurpose: 'Modal Usaha Sampingan', tenor: 18, adminFeeType: 'percentage', adminFee: 1.5, adminFeeAmount: 225000, disbursedAmount: 14775000, status: 'under_review', notes: 'Modal untuk usaha kuliner', applicationDate: '2026-01-13', reviewedBy: 'Siti Rahayu', createdAt: '2026-01-13T15:00:00', updatedAt: '2026-01-14T10:00:00' },
  { id: 'la6', applicationNo: 'LA-2026-006', employeeId: 'e11', employeeName: 'Maya Sari', loanAmount: 3000000, loanPurpose: 'Biaya Pernikahan', tenor: 6, adminFeeType: 'fixed', adminFee: 30000, adminFeeAmount: 30000, disbursedAmount: 2970000, status: 'rejected', notes: 'Dokumen tidak lengkap', applicationDate: '2026-01-10', reviewedBy: 'Siti Rahayu', reviewedAt: '2026-01-11T11:00:00', createdAt: '2026-01-10T09:00:00', updatedAt: '2026-01-11T11:00:00' },
  { id: 'la7', applicationNo: 'LA-2026-007', employeeId: 'e12', employeeName: 'Hendra Setiawan', loanAmount: 20000000, loanPurpose: 'Renovasi Rumah', tenor: 24, adminFeeType: 'percentage', adminFee: 1, adminFeeAmount: 200000, disbursedAmount: 19800000, status: 'draft', applicationDate: '2026-01-15', createdAt: '2026-01-15T08:00:00', updatedAt: '2026-01-15T08:00:00' },
  { id: 'la8', applicationNo: 'LA-2026-018', employeeId: 'e3', employeeName: 'Rudi Hartono', loanAmount: 5000000, loanPurpose: 'Liburan Keluarga', tenor: 6, adminFeeType: 'fixed', adminFee: 50000, adminFeeAmount: 50000, disbursedAmount: 4950000, status: 'approved', notes: 'Liburan akhir tahun', applicationDate: '2026-11-01', reviewedBy: 'Siti Rahayu', reviewedAt: '2026-11-02T10:00:00', createdAt: '2026-11-01T09:00:00', updatedAt: '2026-11-02T10:00:00' },
];

// ============================================
// Loans
// ============================================
export const mockLoans = [
  { id: 'l1', loanNo: 'LN-2026-001', applicationId: 'la1', employeeId: 'e1', employeeName: 'Ahmad Fauzi', principalAmount: 10000000, adminFeeType: 'percentage', adminFee: 1, adminFeeAmount: 100000, disbursedAmount: 9900000, tenor: 12, monthlyPayment: 833333, totalPayment: 10000000, outstandingBalance: 7500000, status: 'active', disbursementDate: '2026-01-05', maturityDate: '2026-01-05', createdAt: '2026-01-05T00:00:00', updatedAt: '2026-01-15T00:00:00' },
  { id: 'l2', loanNo: 'LN-2026-002', applicationId: 'la2', employeeId: 'e3', employeeName: 'Rudi Hartono', principalAmount: 25000000, adminFeeType: 'fixed', adminFee: 250000, adminFeeAmount: 250000, disbursedAmount: 24750000, tenor: 24, monthlyPayment: 1041667, totalPayment: 25000000, outstandingBalance: 20833334, status: 'active', disbursementDate: '2026-01-08', maturityDate: '2027-01-08', createdAt: '2026-01-08T00:00:00', updatedAt: '2026-01-15T00:00:00' },
  { id: 'l3', loanNo: 'LN-2026-003', applicationId: 'la3', employeeId: 'e2', employeeName: 'Dewi Lestari', principalAmount: 5000000, adminFeeType: 'fixed', adminFee: 50000, adminFeeAmount: 50000, disbursedAmount: 4950000, tenor: 6, monthlyPayment: 833333, totalPayment: 5000000, outstandingBalance: 3333334, status: 'active', disbursementDate: '2026-01-10', maturityDate: '2026-07-10', createdAt: '2026-01-10T00:00:00', updatedAt: '2026-01-15T00:00:00' },
  { id: 'l4', loanNo: 'LN-2026-012', applicationId: 'la8', employeeId: 'e3', employeeName: 'Rudi Hartono', principalAmount: 5000000, adminFeeType: 'fixed', adminFee: 50000, adminFeeAmount: 50000, disbursedAmount: 4950000, tenor: 6, monthlyPayment: 833333, totalPayment: 5000000, outstandingBalance: 0, status: 'paid_off', disbursementDate: '2026-11-05', maturityDate: '2026-05-05', createdAt: '2026-11-05T00:00:00', updatedAt: '2026-01-05T00:00:00' },
];

// ============================================
// Loan Installments (for loan l1 - Ahmad Fauzi)
// ============================================
export const mockInstallments = [
  // Loan L1 - Ahmad Fauzi - 12 months (flat: 10.000.000 / 12 = 833.333/bulan)
  { id: 'i1', loanId: 'l1', installmentNo: 1, dueDate: '2026-02-05', amount: 833333, remainingBalance: 9166667, status: 'paid', paidAmount: 833333, paidDate: '2026-02-05' },
  { id: 'i2', loanId: 'l1', installmentNo: 2, dueDate: '2026-03-05', amount: 833333, remainingBalance: 8333334, status: 'paid', paidAmount: 833333, paidDate: '2026-03-04' },
  { id: 'i3', loanId: 'l1', installmentNo: 3, dueDate: '2026-04-05', amount: 833333, remainingBalance: 7500001, status: 'paid', paidAmount: 833333, paidDate: '2026-04-05' },
  { id: 'i4', loanId: 'l1', installmentNo: 4, dueDate: '2026-05-05', amount: 833333, remainingBalance: 6666668, status: 'unpaid', paidAmount: 0 },
  { id: 'i5', loanId: 'l1', installmentNo: 5, dueDate: '2026-06-05', amount: 833333, remainingBalance: 5833335, status: 'unpaid', paidAmount: 0 },
  { id: 'i6', loanId: 'l1', installmentNo: 6, dueDate: '2026-07-05', amount: 833333, remainingBalance: 5000002, status: 'unpaid', paidAmount: 0 },
  { id: 'i7', loanId: 'l1', installmentNo: 7, dueDate: '2026-08-05', amount: 833333, remainingBalance: 4166669, status: 'unpaid', paidAmount: 0 },
  { id: 'i8', loanId: 'l1', installmentNo: 8, dueDate: '2026-09-05', amount: 833333, remainingBalance: 3333336, status: 'unpaid', paidAmount: 0 },
  { id: 'i9', loanId: 'l1', installmentNo: 9, dueDate: '2026-10-05', amount: 833333, remainingBalance: 2500003, status: 'unpaid', paidAmount: 0 },
  { id: 'i10', loanId: 'l1', installmentNo: 10, dueDate: '2026-11-05', amount: 833333, remainingBalance: 1666670, status: 'unpaid', paidAmount: 0 },
  { id: 'i11', loanId: 'l1', installmentNo: 11, dueDate: '2026-12-05', amount: 833333, remainingBalance: 833337, status: 'unpaid', paidAmount: 0 },
  { id: 'i12', loanId: 'l1', installmentNo: 12, dueDate: '2026-01-05', amount: 833333, remainingBalance: 0, status: 'unpaid', paidAmount: 0 },
  // Loan L2 - Rudi Hartono (flat: 25.000.000 / 24 = 1.041.667/bulan)
  { id: 'i13', loanId: 'l2', installmentNo: 1, dueDate: '2026-02-08', amount: 1041667, remainingBalance: 23958333, status: 'paid', paidAmount: 1041667, paidDate: '2026-02-08' },
  { id: 'i14', loanId: 'l2', installmentNo: 2, dueDate: '2026-03-08', amount: 1041667, remainingBalance: 22916666, status: 'paid', paidAmount: 1041667, paidDate: '2026-03-07' },
  { id: 'i15', loanId: 'l2', installmentNo: 3, dueDate: '2026-04-08', amount: 1041667, remainingBalance: 21874999, status: 'overdue', paidAmount: 0 },
  { id: 'i16', loanId: 'l2', installmentNo: 4, dueDate: '2026-05-08', amount: 1041667, remainingBalance: 20833332, status: 'unpaid', paidAmount: 0 },
  // Loan L3 - Dewi Lestari (flat: 5.000.000 / 6 = 833.333/bulan)
  { id: 'i17', loanId: 'l3', installmentNo: 1, dueDate: '2026-02-10', amount: 833333, remainingBalance: 4166667, status: 'paid', paidAmount: 833333, paidDate: '2026-02-10' },
  { id: 'i18', loanId: 'l3', installmentNo: 2, dueDate: '2026-03-10', amount: 833333, remainingBalance: 3333334, status: 'paid', paidAmount: 833333, paidDate: '2026-03-10' },
  { id: 'i19', loanId: 'l3', installmentNo: 3, dueDate: '2026-04-10', amount: 833333, remainingBalance: 2500001, status: 'unpaid', paidAmount: 0 },
  { id: 'i20', loanId: 'l3', installmentNo: 4, dueDate: '2026-05-10', amount: 833333, remainingBalance: 1666668, status: 'unpaid', paidAmount: 0 },
  { id: 'i21', loanId: 'l3', installmentNo: 5, dueDate: '2026-06-10', amount: 833333, remainingBalance: 833335, status: 'unpaid', paidAmount: 0 },
  { id: 'i22', loanId: 'l3', installmentNo: 6, dueDate: '2026-07-10', amount: 833333, remainingBalance: 0, status: 'unpaid', paidAmount: 0 },
];

// ============================================
// Loan Payments
// ============================================
export const mockPayments = [
  { id: 'p1', loanId: 'l1', paymentNo: 'PAY-2026-001', amount: 833333, paymentDate: '2026-02-05', paymentMethod: 'auto_debit', referenceNo: 'AD-20260205-001', status: 'confirmed', notes: 'Auto debit bulan Februari', createdAt: '2026-02-05T00:00:00' },
  { id: 'p2', loanId: 'l1', paymentNo: 'PAY-2026-002', amount: 833333, paymentDate: '2026-03-04', paymentMethod: 'bank_transfer', referenceNo: 'BT-20260304-001', status: 'confirmed', notes: 'Transfer manual BCA', createdAt: '2026-03-04T00:00:00' },
  { id: 'p3', loanId: 'l1', paymentNo: 'PAY-2026-003', amount: 833333, paymentDate: '2026-04-05', paymentMethod: 'auto_debit', referenceNo: 'AD-20260405-001', status: 'confirmed', createdAt: '2026-04-05T00:00:00' },
  { id: 'p4', loanId: 'l2', paymentNo: 'PAY-2026-004', amount: 1041667, paymentDate: '2026-02-08', paymentMethod: 'auto_debit', referenceNo: 'AD-20260208-001', status: 'confirmed', createdAt: '2026-02-08T00:00:00' },
  { id: 'p5', loanId: 'l2', paymentNo: 'PAY-2026-005', amount: 1041667, paymentDate: '2026-03-07', paymentMethod: 'bank_transfer', referenceNo: 'BT-20260307-001', status: 'confirmed', createdAt: '2026-03-07T00:00:00' },
  { id: 'p6', loanId: 'l3', paymentNo: 'PAY-2026-006', amount: 833333, paymentDate: '2026-02-10', paymentMethod: 'auto_debit', referenceNo: 'AD-20260210-001', status: 'confirmed', createdAt: '2026-02-10T00:00:00' },
  { id: 'p7', loanId: 'l3', paymentNo: 'PAY-2026-007', amount: 833333, paymentDate: '2026-03-10', paymentMethod: 'cash', referenceNo: 'CS-20260310-001', status: 'confirmed', notes: 'Bayar tunai di kantor', createdAt: '2026-03-10T00:00:00' },
];

// ============================================
// Loan Settlements
// ============================================
export const mockSettlements = [
  { id: 's1', loanId: 'l4', settlementAmount: 0, remainingPrincipal: 0, penalty: 0, settlementDate: '2026-01-05', paymentMethod: 'auto_debit', referenceNo: 'ST-20260105-001', notes: 'Lunas tepat waktu', status: 'completed', createdAt: '2026-01-05T00:00:00' },
];

// ============================================
// Activity Logs
// ============================================
export const mockActivityLogs = [
  { id: 'al1', userId: 'u4', userName: 'Ahmad Fauzi', action: 'submit_application', entity: 'LoanApplication', entityId: 'la1', details: 'Mengajukan pinjaman LA-2026-001 sebesar Rp 10.000.000', createdAt: '2026-01-02T09:00:00' },
  { id: 'al2', userId: 'u2', userName: 'Siti Rahayu', action: 'approve_application', entity: 'LoanApplication', entityId: 'la1', details: 'Menyetujui pinjaman LA-2026-001', createdAt: '2026-01-03T10:00:00' },
  { id: 'al3', userId: 'u3', userName: 'Andi Wijaya', action: 'disburse_loan', entity: 'Loan', entityId: 'l1', details: 'Mencairkan pinjaman LN-2026-001', createdAt: '2026-01-05T08:00:00' },
  { id: 'al4', userId: 'u6', userName: 'Rudi Hartono', action: 'submit_application', entity: 'LoanApplication', entityId: 'la2', details: 'Mengajukan pinjaman LA-2026-002 sebesar Rp 25.000.000', createdAt: '2026-01-05T11:00:00' },
  { id: 'al5', userId: 'u2', userName: 'Siti Rahayu', action: 'approve_application', entity: 'LoanApplication', entityId: 'la2', details: 'Menyetujui pinjaman LA-2026-002', createdAt: '2026-01-06T14:00:00' },
  { id: 'al6', userId: 'u3', userName: 'Andi Wijaya', action: 'disburse_loan', entity: 'Loan', entityId: 'l2', details: 'Mencairkan pinjaman LN-2026-002', createdAt: '2026-01-08T09:00:00' },
  { id: 'al7', userId: 'u5', userName: 'Dewi Lestari', action: 'submit_application', entity: 'LoanApplication', entityId: 'la3', details: 'Mengajukan pinjaman LA-2026-003 sebesar Rp 5.000.000', createdAt: '2026-01-08T14:30:00' },
  { id: 'al8', userId: 'u2', userName: 'Siti Rahayu', action: 'approve_application', entity: 'LoanApplication', entityId: 'la3', details: 'Menyetujui pinjaman LA-2026-003', createdAt: '2026-01-09T09:30:00' },
  { id: 'al9', userId: 'u7', userName: 'Nurul Hidayah', action: 'record_payment', entity: 'LoanPayment', entityId: 'p1', details: 'Mencatat pembayaran PAY-2026-001', createdAt: '2026-02-05T08:00:00' },
  { id: 'al10', userId: 'u7', userName: 'Nurul Hidayah', action: 'record_payment', entity: 'LoanPayment', entityId: 'p2', details: 'Mencatat pembayaran PAY-2026-002', createdAt: '2026-03-04T10:00:00' },
  { id: 'al11', userId: 'u2', userName: 'Siti Rahayu', action: 'reject_application', entity: 'LoanApplication', entityId: 'la6', details: 'Menolak pinjaman LA-2026-006 - Dokumen tidak lengkap', createdAt: '2026-01-11T11:00:00' },
  { id: 'al12', userId: 'u1', userName: 'Budi Santoso', action: 'add_employee', entity: 'Employee', entityId: 'e11', details: 'Menambahkan karyawan baru: Maya Sari (EMP-011)', createdAt: '2026-01-08T09:00:00' },
  { id: 'al13', userId: 'u4', userName: 'Ahmad Fauzi', action: 'savings_deposit', entity: 'SavingsTransaction', details: 'Setor tabungan SVB-001 sebesar Rp 500.000', createdAt: '2026-01-10T10:00:00' },
  { id: 'al14', userId: 'u5', userName: 'Dewi Lestari', action: 'savings_deposit', entity: 'SavingsTransaction', details: 'Setor tabungan SKR-002 sebesar Rp 2.000.000', createdAt: '2026-01-11T09:00:00' },
  { id: 'al15', userId: 'u7', userName: 'Nurul Hidayah', action: 'savings_withdrawal_approve', entity: 'SavingsWithdrawalRequest', details: 'Menyetujui penarikan tabungan TARI-2026-001', createdAt: '2026-01-12T11:00:00' },
];

// ============================================
// Dashboard Stats
// ============================================
export const mockDashboardStats = {
  totalActiveLoans: 3,
  totalOutstandingBalance: 35184668,
  totalDisbursedAmount: 40000000,
  monthlyCollections: 2956667,
  overdueLoans: 1,
  totalEmployees: 11,
};

// ============================================
// Chart Data
// ============================================
export const mockMonthlyData = [
  { month: 'Jul', disbursements: 15000000, collections: 8500000 },
  { month: 'Aug', disbursements: 8000000, collections: 9200000 },
  { month: 'Sep', disbursements: 22000000, collections: 11000000 },
  { month: 'Oct', disbursements: 12000000, collections: 13500000 },
  { month: 'Nov', disbursements: 5000000, collections: 10800000 },
  { month: 'Dec', disbursements: 18000000, collections: 12000000 },
  { month: 'Jan', disbursements: 40000000, collections: 2956667 },
];

export const mockLoanByStatusData = [
  { status: 'Active', count: 3, amount: 35184668 },
  { status: 'Paid Off', count: 1, amount: 5000000 },
  { status: 'Defaulted', count: 0, amount: 0 },
  { status: 'Settled', count: 0, amount: 0 },
];

export const mockLoanByDepartmentData = [
  { department: 'Engineering', count: 2, amount: 30000000 },
  { department: 'Finance', count: 1, amount: 5000000 },
  { department: 'Marketing', count: 1, amount: 5000000 },
  { department: 'HR', count: 0, amount: 0 },
  { department: 'Operations', count: 0, amount: 0 },
  { department: 'IT', count: 0, amount: 0 },
];

// ============================================
// Departments
// ============================================
export const departments = [
  'Engineering', 'Finance', 'Marketing', 'Human Resources', 'Operations', 'IT'
];

export const positions = {
  Engineering: ['Senior Developer', 'Junior Developer', 'QA Engineer', 'DevOps Engineer', 'Tech Lead'],
  Finance: ['Finance Manager', 'Finance Analyst', 'Accounting Staff', 'Tax Specialist'],
  Marketing: ['Marketing Manager', 'Digital Marketing', 'Content Writer', 'Brand Strategist'],
  'Human Resources': ['HR Manager', 'Recruitment Staff', 'HR Business Partner', 'Training Specialist'],
  Operations: ['Operations Manager', 'Operations Staff', 'Logistics Coordinator'],
  IT: ['IT Director', 'System Administrator', 'IT Support', 'Security Engineer'],
};

// ============================================
// Savings Products
// ============================================
export const mockSavingsProducts = [
  { id: 'sp1', name: 'Tabungan Wajib', code: 'TWB', type: 'wajib', interestRate: 0.003, minimumBalance: 100000, minimumDeposit: 100000, withdrawalPenalty: 0, description: 'Tabungan wajib bulanan yang dipotong dari gaji karyawan. Bunga 0.3% per bulan.', isActive: true, createdAt: '2026-01-01T00:00:00', updatedAt: '2026-01-01T00:00:00' },
  { id: 'sp2', name: 'Tabungan Sukarela', code: 'SKR', type: 'sukarela', interestRate: 0.005, minimumBalance: 50000, minimumDeposit: 50000, withdrawalPenalty: 0, description: 'Tabungan sukarela dengan setoran fleksibel. Bunga 0.5% per bulan, bebas tarik kapan saja.', isActive: true, createdAt: '2026-01-01T00:00:00', updatedAt: '2026-01-01T00:00:00' },
  { id: 'sp3', name: 'Tabungan Hari Raya', code: 'THR', type: 'hari_raya', interestRate: 0.006, minimumBalance: 200000, minimumDeposit: 200000, withdrawalPenalty: 50000, description: 'Tabungan persiapan Hari Raya. Bunga 0.6% per bulan, pencairan menjelang Hari Raya.', isActive: true, createdAt: '2026-01-01T00:00:00', updatedAt: '2026-01-01T00:00:00' },
  { id: 'sp4', name: 'Tabungan Pendidikan', code: 'TDK', type: 'pendidikan', interestRate: 0.007, minimumBalance: 500000, minimumDeposit: 500000, withdrawalPenalty: 100000, description: 'Tabungan untuk biaya pendidikan anak. Bunga 0.7% per bulan, pencairan untuk keperluan pendidikan.', isActive: true, createdAt: '2026-01-01T00:00:00', updatedAt: '2026-01-01T00:00:00' },
  { id: 'sp5', name: 'Tabungan Dana Pensiun', code: 'DPS', type: 'dana_pensiun', interestRate: 0.008, minimumBalance: 1000000, minimumDeposit: 500000, withdrawalPenalty: 200000, description: 'Tabungan persiapan pensiun jangka panjang. Bunga 0.8% per bulan, pencairan saat pensiun.', isActive: true, createdAt: '2026-01-01T00:00:00', updatedAt: '2026-01-01T00:00:00' },
];

// ============================================
// Savings Accounts
// ============================================
export const mockSavingsAccounts = [
  { id: 'sa1', accountNo: 'SVB-001', employeeId: 'e1', employeeName: 'Ahmad Fauzi', productId: 'sp1', productName: 'Tabungan Wajib', balance: 8500000, interestEarned: 420000, status: 'active', openDate: '2022-04-01', lastTransactionDate: '2026-01-15', createdAt: '2022-04-01T00:00:00', updatedAt: '2026-01-15T00:00:00' },
  { id: 'sa2', accountNo: 'SKR-001', employeeId: 'e1', employeeName: 'Ahmad Fauzi', productId: 'sp2', productName: 'Tabungan Sukarela', balance: 15200000, interestEarned: 380000, status: 'active', openDate: '2022-04-01', lastTransactionDate: '2026-01-14', createdAt: '2022-04-01T00:00:00', updatedAt: '2026-01-14T00:00:00' },
  { id: 'sa3', accountNo: 'SVB-002', employeeId: 'e2', employeeName: 'Dewi Lestari', productId: 'sp1', productName: 'Tabungan Wajib', balance: 7200000, interestEarned: 350000, status: 'active', openDate: '2022-07-01', lastTransactionDate: '2026-01-15', createdAt: '2022-07-01T00:00:00', updatedAt: '2026-01-15T00:00:00' },
  { id: 'sa4', accountNo: 'SKR-002', employeeId: 'e2', employeeName: 'Dewi Lestari', productId: 'sp2', productName: 'Tabungan Sukarela', balance: 22500000, interestEarned: 680000, status: 'active', openDate: '2022-07-01', lastTransactionDate: '2026-01-11', createdAt: '2022-07-01T00:00:00', updatedAt: '2026-01-11T00:00:00' },
  { id: 'sa5', accountNo: 'THR-001', employeeId: 'e3', employeeName: 'Rudi Hartono', productId: 'sp3', productName: 'Tabungan Hari Raya', balance: 18500000, interestEarned: 720000, status: 'active', openDate: '2021-02-01', lastTransactionDate: '2026-01-10', createdAt: '2021-02-01T00:00:00', updatedAt: '2026-01-10T00:00:00' },
  { id: 'sa6', accountNo: 'SVB-003', employeeId: 'e3', employeeName: 'Rudi Hartono', productId: 'sp1', productName: 'Tabungan Wajib', balance: 12800000, interestEarned: 640000, status: 'active', openDate: '2021-02-01', lastTransactionDate: '2026-01-15', createdAt: '2021-02-01T00:00:00', updatedAt: '2026-01-15T00:00:00' },
  { id: 'sa7', accountNo: 'TDK-001', employeeId: 'e4', employeeName: 'Siti Rahayu', productId: 'sp4', productName: 'Tabungan Pendidikan', balance: 45000000, interestEarned: 1800000, status: 'active', openDate: '2020-06-01', lastTransactionDate: '2026-01-12', createdAt: '2020-06-01T00:00:00', updatedAt: '2026-01-12T00:00:00' },
  { id: 'sa8', accountNo: 'DPS-001', employeeId: 'e5', employeeName: 'Budi Santoso', productId: 'sp5', productName: 'Tabungan Dana Pensiun', balance: 125000000, interestEarned: 7500000, status: 'active', openDate: '2019-09-01', lastTransactionDate: '2026-01-15', createdAt: '2019-09-01T00:00:00', updatedAt: '2026-01-15T00:00:00' },
  { id: 'sa9', accountNo: 'SVB-004', employeeId: 'e5', employeeName: 'Budi Santoso', productId: 'sp1', productName: 'Tabungan Wajib', balance: 32500000, interestEarned: 1200000, status: 'active', openDate: '2019-09-01', lastTransactionDate: '2026-01-15', createdAt: '2019-09-01T00:00:00', updatedAt: '2026-01-15T00:00:00' },
];

// ============================================
// Savings Transactions
// ============================================
export const mockSavingsTransactions = [
  { id: 'st1', accountId: 'sa1', accountNo: 'SVB-001', employeeName: 'Ahmad Fauzi', transactionNo: 'STR-2026-001', type: 'auto_debit', amount: 500000, balanceAfter: 8500000, transactionDate: '2026-01-15', paymentMethod: 'auto_debit', referenceNo: 'AD-SVB-20260115', status: 'completed', notes: 'Setoran wajib Januari', createdAt: '2026-01-15T08:00:00' },
  { id: 'st2', accountId: 'sa2', accountNo: 'SKR-001', employeeName: 'Ahmad Fauzi', transactionNo: 'STR-2026-002', type: 'deposit', amount: 2000000, balanceAfter: 15200000, transactionDate: '2026-01-14', paymentMethod: 'bank_transfer', referenceNo: 'BT-SKR-20260114', status: 'completed', notes: 'Setoran sukarela', createdAt: '2026-01-14T10:00:00' },
  { id: 'st3', accountId: 'sa3', accountNo: 'SVB-002', employeeName: 'Dewi Lestari', transactionNo: 'STR-2026-003', type: 'auto_debit', amount: 500000, balanceAfter: 7200000, transactionDate: '2026-01-15', paymentMethod: 'auto_debit', referenceNo: 'AD-SVB-20260115-2', status: 'completed', notes: 'Setoran wajib Januari', createdAt: '2026-01-15T08:00:00' },
  { id: 'st4', accountId: 'sa4', accountNo: 'SKR-002', employeeName: 'Dewi Lestari', transactionNo: 'STR-2026-004', type: 'deposit', amount: 2000000, balanceAfter: 22500000, transactionDate: '2026-01-11', paymentMethod: 'bank_transfer', referenceNo: 'BT-SKR-20260111', status: 'completed', createdAt: '2026-01-11T09:00:00' },
  { id: 'st5', accountId: 'sa5', accountNo: 'THR-001', employeeName: 'Rudi Hartono', transactionNo: 'STR-2026-005', type: 'deposit', amount: 1500000, balanceAfter: 18500000, transactionDate: '2026-01-10', paymentMethod: 'auto_debit', referenceNo: 'AD-THR-20260110', status: 'completed', notes: 'Setoran bulanan THR', createdAt: '2026-01-10T08:00:00' },
  { id: 'st6', accountId: 'sa7', accountNo: 'TDK-001', employeeName: 'Siti Rahayu', transactionNo: 'STR-2026-006', type: 'deposit', amount: 3000000, balanceAfter: 45000000, transactionDate: '2026-01-12', paymentMethod: 'bank_transfer', referenceNo: 'BT-TDK-20260112', status: 'completed', notes: 'Setoran bulanan pendidikan', createdAt: '2026-01-12T11:00:00' },
  { id: 'st7', accountId: 'sa8', accountNo: 'DPS-001', employeeName: 'Budi Santoso', transactionNo: 'STR-2026-007', type: 'auto_debit', amount: 5000000, balanceAfter: 125000000, transactionDate: '2026-01-15', paymentMethod: 'auto_debit', referenceNo: 'AD-DPS-20260115', status: 'completed', notes: 'Setoran bulanan dana pensiun', createdAt: '2026-01-15T08:00:00' },
  { id: 'st8', accountId: 'sa9', accountNo: 'SVB-004', employeeName: 'Budi Santoso', transactionNo: 'STR-2026-008', type: 'auto_debit', amount: 1500000, balanceAfter: 32500000, transactionDate: '2026-01-15', paymentMethod: 'auto_debit', referenceNo: 'AD-SVB-20260115-3', status: 'completed', notes: 'Setoran wajib Januari', createdAt: '2026-01-15T08:00:00' },
  { id: 'st9', accountId: 'sa2', accountNo: 'SKR-001', employeeName: 'Ahmad Fauzi', transactionNo: 'STR-2026-009', type: 'withdrawal', amount: 1000000, balanceAfter: 13200000, transactionDate: '2026-01-08', paymentMethod: 'bank_transfer', referenceNo: 'BT-WDR-20260108', status: 'completed', notes: 'Penarikan darurat', createdAt: '2026-01-08T14:00:00' },
  { id: 'st10', accountId: 'sa1', accountNo: 'SVB-001', employeeName: 'Ahmad Fauzi', transactionNo: 'STR-2026-010', type: 'interest', amount: 42000, balanceAfter: 8542000, transactionDate: '2026-01-01', paymentMethod: 'auto_debit', status: 'completed', notes: 'Bunga bulan Desember', createdAt: '2026-01-01T00:00:00' },
];

// ============================================
// Savings Withdrawal Requests
// ============================================
export const mockSavingsWithdrawals = [
  { id: 'sw1', requestNo: 'TARI-2026-001', accountId: 'sa2', accountNo: 'SKR-001', employeeId: 'e1', employeeName: 'Ahmad Fauzi', amount: 1000000, reason: 'Keperluan darurat keluarga', status: 'completed', reviewedBy: 'Nurul Hidayah', reviewedAt: '2026-01-08T10:00:00', reviewNotes: 'Disetujui - keperluan darurat', requestDate: '2026-01-08', createdAt: '2026-01-08T09:00:00' },
  { id: 'sw2', requestNo: 'TARI-2026-002', accountId: 'sa4', accountNo: 'SKR-002', employeeId: 'e2', employeeName: 'Dewi Lestari', amount: 3000000, reason: 'Biaya kursus profesional', status: 'pending', requestDate: '2026-01-14', createdAt: '2026-01-14T11:00:00' },
  { id: 'sw3', requestNo: 'TARI-2026-003', accountId: 'sa5', accountNo: 'THR-001', employeeId: 'e3', employeeName: 'Rudi Hartono', amount: 5000000, reason: 'Kebutuhan mendadak', status: 'pending', requestDate: '2026-01-15', createdAt: '2026-01-15T09:00:00' },
  { id: 'sw4', requestNo: 'TARI-2026-045', accountId: 'sa5', accountNo: 'THR-001', employeeId: 'e3', employeeName: 'Rudi Hartono', amount: 2000000, reason: 'Biaya liburan akhir tahun', status: 'rejected', reviewedBy: 'Siti Rahayu', reviewedAt: '2026-12-20T10:00:00', reviewNotes: 'Ditolak - bukan termasuk pencairan hari raya', requestDate: '2026-12-19', createdAt: '2026-12-19T14:00:00' },
];

// ============================================
// Savings Chart Data
// ============================================
export const mockSavingsByTypeData = [
  { type: 'Wajib', count: 4, balance: 61000000 },
  { type: 'Sukarela', count: 2, balance: 37700000 },
  { type: 'Hari Raya', count: 1, balance: 18500000 },
  { type: 'Pendidikan', count: 1, balance: 45000000 },
  { type: 'Dana Pensiun', count: 1, balance: 125000000 },
];

export const mockSavingsMonthlyData = [
  { month: 'Jul', deposits: 28000000, withdrawals: 5000000 },
  { month: 'Aug', deposits: 30000000, withdrawals: 3000000 },
  { month: 'Sep', deposits: 32000000, withdrawals: 7000000 },
  { month: 'Oct', deposits: 29000000, withdrawals: 4000000 },
  { month: 'Nov', deposits: 31000000, withdrawals: 6000000 },
  { month: 'Dec', deposits: 35000000, withdrawals: 8000000 },
  { month: 'Jan', deposits: 33500000, withdrawals: 1000000 },
];

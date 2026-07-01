import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Search, Plus, FileText, CheckCircle2, Circle, Clock,
  Wallet, ShieldCheck, Calculator,
  Send, Eye, X, Info, AlertTriangle,
  ArrowLeft, Building2, User, Phone, Mail, CalendarDays,
  Briefcase, Hash, HandCoins, MapPin, FileCheck, Cake,
  Heart, Loader2, Camera, Signature, Eraser, Upload,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppStore } from '@/lib/store';
import api from '@/lib/api';
import {
  formatCurrency, formatNumber, formatDate, formatDateTime, getStatusColor, getStatusLabel,
  calculateMonthlyPayment, calculateAdminFeeAmount, calculateDisbursedAmount,
  formatAdminFee, getInitials, calculateAge, ADMIN_FEE_TIERS,
  getEmploymentStatusLabel, getEmploymentStatusColor,
  getMaritalStatusLabel, getMaritalStatusColor,
} from '@/lib/format';
import { toast } from 'sonner';
import { buildAkadClauses } from '@/lib/loan-document';

const SYSTEM_ADMIN_FEE_TYPE = 'percentage';
const SYSTEM_ADMIN_FEE = 1;

const LOAN_PURPOSES = [
  'Renovasi Rumah', 'Biaya Pendidikan', 'Pembelian Kendaraan',
  'Biaya Medis', 'Modal Usaha Sampingan', 'Biaya Pernikahan', 'Lainnya',
];

// ── Mappers ──────────────────────────────────────────────────────────────────

function mapApiApplication(a) {
  return {
    id: a.id,
    applicationNo: a.application_no,
    employeeId: a.employee,
    employeeName: a.employee_name || '',
    loanAmount: a.loan_amount,
    loanPurpose: a.loan_purpose,
    tenor: a.tenor,
    adminFeeType: a.admin_fee_type,
    adminFee: parseFloat(a.admin_fee),
    adminFeeAmount: a.admin_fee_amount,
    disbursedAmount: a.disbursed_amount,
    status: a.status,
    notes: a.notes,
    signatureDocumentUrl: a.signature_document_url || null,
    selfieDocumentUrl: a.selfie_document_url || null,
    applicationDate: a.application_date,
    reviewedBy: a.reviewed_by_name || null,
    reviewedAt: a.reviewed_at,
    verifiedBy: a.verified_by_name || null,
    verifiedAt: a.verified_at,
    createdAt: a.created_at,
    updatedAt: a.updated_at,
  };
}

function mapApiEmployee(e) {
  return {
    id: String(e.id),
    employeeId: e.employee_id,
    name: e.name,
    birthPlace: e.birth_place || '-',
    birthDate: e.birth_date,
    department: e.department,
    position: e.position,
    employmentStatus: e.employment_status,
    maritalStatus: e.marital_status,
    phone: e.phone,
    email: e.email,
    address: e.address || '',
    joinDate: e.join_date,
    salary: e.salary,
    status: e.status,
    companyId: e.company ? String(e.company) : undefined,
    createdAt: e.created_at,
    updatedAt: e.updated_at,
  };
}

function mapApiCompany(c) {
  return {
    id: c.id,
    name: c.name,
    code: c.code,
    address: c.address,
    phone: c.phone,
    email: c.email,
    contactPerson: c.contact_person,
    mouNumber: c.mou_number,
    mouDate: c.mou_date,
    mouExpiryDate: c.mou_expiry_date,
    maxLoanAmount: c.max_loan_amount,
    maxLoanToSalaryPercent: c.max_loan_to_salary_percent,
    adminFeeType: c.admin_fee_type,
    adminFee: parseFloat(c.admin_fee),
    maxTenor: c.max_tenor,
    maxActiveLoans: c.max_active_loans,
    status: c.status,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  };
}

// ── Stepper ───────────────────────────────────────────────────────────────────

function Stepper({ steps, currentStep }) {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2">
      {steps.map((step, i) => {
        const Icon = step.icon;
        const isActive = i === currentStep;
        const isDone = i < currentStep;
        return (
          <React.Fragment key={i}>
            {i > 0 && (
              <div className={`h-0.5 w-6 sm:w-10 rounded-full transition-colors ${isDone ? 'bg-primary' : 'bg-border'}`} />
            )}
            <div className="flex flex-col items-center gap-1">
              <div className={`size-9 sm:size-10 rounded-full flex items-center justify-center transition-colors ${isActive ? 'bg-primary text-primary-foreground' :
                isDone ? 'bg-primary/20 text-primary' :
                  'bg-muted text-muted-foreground'
                }`}>
                {isDone ? <CheckCircle2 className="size-4 sm:size-5" /> : <Icon className="size-4 sm:size-5" />}
              </div>
              <span className={`text-[10px] sm:text-xs font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── StatusTimeline ────────────────────────────────────────────────────────────

function StatusTimeline({ app }) {
  const isRejected = app.status === 'rejected';
  const steps = [
    { key: 'submitted', label: 'Menunggu Verifikasi', time: app.createdAt },
    { key: 'verified', label: 'Terverifikasi', time: app.status !== 'submitted' && app.status !== 'draft' ? app.verifiedAt : undefined },
    { key: 'approved', label: isRejected ? 'Ditolak' : 'Disetujui', time: app.status === 'approved' || app.status === 'disbursed' || isRejected ? app.reviewedAt : undefined },
    { key: 'disbursed', label: 'Dicairkan', time: app.status === 'disbursed' ? app.reviewedAt : undefined },
  ];
  const statusOrder = ['draft', 'submitted', 'under_review', 'verified', 'approved', 'disbursed', 'rejected'];
  const currentIdx = statusOrder.indexOf(app.status);

  return (
    <div className="space-y-0">
      {steps.map((step, i) => {
        const stepOrder = statusOrder.indexOf(step.key);
        const isReached = currentIdx >= stepOrder;
        const isCurrent = step.key === app.status || (isRejected && step.key === 'approved');
        const isLast = i === steps.length - 1;
        const isRejectStep = isRejected && step.key === 'approved';
        return (
          <div key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`size-7 rounded-full flex items-center justify-center shrink-0 ${isRejectStep ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                isCurrent ? 'bg-primary text-primary-foreground' :
                  isReached ? 'bg-primary/20 text-primary' :
                    'bg-muted text-muted-foreground'
                }`}>
                {isRejectStep ? <X className="size-3.5" /> :
                  isReached && !isCurrent ? <CheckCircle2 className="size-3.5" /> :
                    <Circle className="size-3.5" />}
              </div>
              {!isLast && <div className={`w-0.5 h-6 ${isReached ? 'bg-primary' : 'bg-border'}`} />}
            </div>
            <div className="pb-4 min-w-0">
              <p className={`text-sm font-medium ${isRejectStep ? 'text-red-600 dark:text-red-400' : isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>
                {step.label}
              </p>
              {step.time && <p className="text-xs text-muted-foreground">{formatDate(step.time.split('T')[0])}</p>}
              {isRejectStep && app.notes && <p className="text-xs text-red-500/80 mt-0.5">{app.notes}</p>}
              {step.key === 'verified' && app.verifiedBy && isReached && !isRejected && (
                <p className="text-xs text-muted-foreground">Oleh: {app.verifiedBy}</p>
              )}
              {step.key === 'approved' && app.reviewedBy && (app.status === 'approved' || app.status === 'disbursed') && (
                <p className="text-xs text-muted-foreground">Oleh: {app.reviewedBy}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── FormField ─────────────────────────────────────────────────────────────────

function FormField({ label, value, icon: Icon, span = 1, fullWidth = false }) {
  return (
    <div className={`${fullWidth ? 'col-span-1 sm:col-span-2' : ''} ${span === 2 ? 'col-span-1 sm:col-span-2' : ''}`}>
      <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md border bg-muted/30">
        <label className="text-[11px] sm:text-xs font-medium text-muted-foreground flex items-center gap-1 min-w-0 shrink">
          {Icon && <Icon className="size-3 shrink-0" />}
          <span className="truncate">{label}</span>
        </label>
        <div className="text-xs sm:text-sm font-semibold truncate text-right shrink-0 max-w-[65%]">
          {value}
        </div>
      </div>
    </div>
  );
}

// ── SignaturePad ──────────────────────────────────────────────────────────────

function SignaturePad({ file, onCapture }) {
  const [mode, setMode] = useState('draw'); // 'draw' | 'upload'
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const drawingRef = useRef(false);
  const hasDrawnRef = useRef(false);
  const lastPointRef = useRef(null);

  useEffect(() => {
    if (file || mode !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e293b';
    hasDrawnRef.current = false;
  }, [file, mode]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    return { x: point.clientX - rect.left, y: point.clientY - rect.top };
  };

  const startDraw = (e) => {
    e.preventDefault();
    drawingRef.current = true;
    hasDrawnRef.current = true;
    lastPointRef.current = getPos(e);
  };

  const draw = (e) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPointRef.current = pos;
  };

  const endDraw = () => {
    drawingRef.current = false;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawnRef.current = false;
  };

  const save = () => {
    if (!hasDrawnRef.current) {
      toast.error('Silakan buat tanda tangan terlebih dahulu');
      return;
    }
    canvasRef.current.toBlob(blob => {
      if (blob) onCapture(new File([blob], `signature-${Date.now()}.png`, { type: 'image/png' }));
    }, 'image/png');
  };

  const handleUpload = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      toast.error('File harus berupa gambar (PNG/JPG)');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }
    onCapture(f);
    e.target.value = '';
  };

  const retake = () => onCapture(null);

  if (file) {
    return (
      <div className="border-2 border-dashed rounded-lg overflow-hidden">
        <div className="w-full h-64 sm:h-80 bg-white flex items-center justify-center">
          <img src={URL.createObjectURL(file)} alt="Tanda Tangan Digital" className="max-w-full max-h-full object-contain" />
        </div>
        <div className="px-3 py-2 text-center bg-muted/50 space-y-0.5">
          <p className="text-[10px] font-medium">Tanda tangan berhasil disimpan</p>
          <button type="button" onClick={retake} className="text-[10px] text-primary underline">Ganti Tanda Tangan</button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-dashed rounded-lg overflow-hidden">
      <div className="px-3 py-2 flex items-center justify-between gap-2 border-b bg-muted/30">
        <div className="flex items-center gap-2 min-w-0">
          <Signature className="size-3.5 sm:size-4 text-muted-foreground shrink-0" />
          <p className="text-xs sm:text-sm font-medium truncate">Tanda Tangan Digital</p>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-md p-0.5 shrink-0">
          <button
            type="button"
            onClick={() => setMode('draw')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] sm:text-xs font-medium transition-colors ${mode === 'draw' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
          >
            <Signature className="size-3" /> Gambar
          </button>
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] sm:text-xs font-medium transition-colors ${mode === 'upload' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
          >
            <Upload className="size-3" /> Upload
          </button>
        </div>
      </div>

      {mode === 'draw' ? (
        <>
          <canvas
            ref={canvasRef}
            className="w-full h-64 sm:h-80 bg-white touch-none cursor-crosshair"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
          <div className="flex items-center justify-between gap-2 px-3 py-2 bg-muted/50">
            <button type="button" onClick={clear} className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Eraser className="size-3.5" /> Hapus
            </button>
            <button type="button" onClick={save} className="text-[10px] sm:text-xs font-semibold text-primary">
              Simpan Tanda Tangan
            </button>
          </div>
        </>
      ) : (
        <div className="w-full h-64 sm:h-80 bg-white flex items-center justify-center p-4">
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 w-full h-full rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors text-center p-4"
          >
            <Upload className="size-6 sm:size-10 text-muted-foreground/50" />
            <p className="text-xs sm:text-sm font-medium">Upload Tanda Tangan</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Klik untuk pilih file gambar (PNG/JPG, maks 5MB)</p>
          </button>
        </div>
      )}
    </div>
  );
}

// ── SelfieCaptureBox ──────────────────────────────────────────────────────────

function SelfieCaptureBox({ file, onCapture }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (stream && videoRef.current) videoRef.current.srcObject = stream;
    return () => stream?.getTracks().forEach(t => t.stop());
  }, [stream]);

  const startCamera = async () => {
    setError('');
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      setStream(s);
    } catch {
      setError('Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.');
    }
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => {
      if (blob) onCapture(new File([blob], `selfie-${Date.now()}.jpg`, { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.92);
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
  };

  const retake = () => {
    onCapture(null);
    startCamera();
  };

  if (file) {
    return (
      <div className="border-2 border-dashed rounded-lg overflow-hidden">
        <img src={URL.createObjectURL(file)} alt="Selfie" className="w-full h-64 sm:h-80 object-contain bg-black" />
        <div className="px-3 py-2 text-center bg-muted/50 space-y-0.5">
          <p className="text-[10px] font-medium">Foto selfie berhasil diambil</p>
          <button type="button" onClick={retake} className="text-[10px] text-primary underline">Ambil Ulang</button>
        </div>
      </div>
    );
  }

  if (stream) {
    return (
      <div className="border-2 border-dashed rounded-lg overflow-hidden">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-64 sm:h-80 object-contain -scale-x-100 bg-black" />
        <button type="button" onClick={capture} className="w-full px-3 py-2 text-center bg-primary text-primary-foreground text-xs sm:text-sm font-medium">
          Ambil Foto
        </button>
      </div>
    );
  }

  return (
    <button type="button" onClick={startCamera} className="block w-full border-2 border-dashed rounded-lg overflow-hidden hover:border-primary/50 transition-colors p-3 sm:p-6 text-center">
      <Camera className="size-6 sm:size-10 mx-auto text-muted-foreground/50 mb-1 sm:mb-2" />
      <p className="text-xs sm:text-sm font-medium">Foto Selfie</p>
      <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{error || 'Klik untuk membuka kamera & ambil foto'}</p>
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function LoanApplicationPage() {
  const { currentUser, navigate: storeNavigate, selectedApplicationId } = useAppStore();
  const role = currentUser?.role || 'employee';
  const employeeId = currentUser?.employeeId;
  const isEmployee = role === 'employee';

  const [applications, setApplications] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [myEmployeeData, setMyEmployeeData] = useState(null);
  const [myCompany, setMyCompany] = useState(null);
  const [myActiveLoans, setMyActiveLoans] = useState([]);
  const [systemSettings, setSystemSettings] = useState({
    defaultAdminFeeType: SYSTEM_ADMIN_FEE_TYPE,
    defaultAdminFee: SYSTEM_ADMIN_FEE,
    adminFeeTiers: ADMIN_FEE_TIERS,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [showForm, setShowForm] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [signatureFile, setSignatureFile] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [agreedToContract, setAgreedToContract] = useState(false);
  const [infoTab, setInfoTab] = useState(isEmployee ? 'kebijakan' : 'pemohon');
  const [form, setForm] = useState({
    employeeId: '',
    loanAmount: 0,
    loanPurpose: '',
    customPurpose: '',
    tenor: 12,
    adminFeeType: SYSTEM_ADMIN_FEE_TYPE,
    adminFee: SYSTEM_ADMIN_FEE,
    notes: '',
  });

  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [editingDraftId, setEditingDraftId] = useState(null);
  const [detailApp, setDetailApp] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [successNotif, setSuccessNotif] = useState({ show: false, title: '', message: '', applicationNo: '' });

  // ── Data fetching ───────────────────────────────────────────────────────────

  const fetchApplications = useCallback(async () => {
    try {
      const { data } = await api.get('/applications/?page_size=200');
      setApplications((data.results ?? data).map(mapApiApplication));
    } catch { /* silent */ }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const { data } = await api.get('/employees/?page_size=200');
      const mapped = (data.results ?? data).map(mapApiEmployee);
      setEmployees(mapped);
      if (isEmployee) {
        let emp = employeeId ? mapped.find(e => e.id === String(employeeId)) : null;
        // Fallback: cari by email jika employee_id belum terhubung ke user
        if (!emp && currentUser?.email) {
          emp = mapped.find(e => e.email === currentUser.email);
        }
        setMyEmployeeData(emp || null);
      }
    } catch { /* silent */ }
  }, [isEmployee, employeeId]);

  const fetchCompany = useCallback(async (companyId) => {
    try {
      const { data } = await api.get(`/companies/${companyId}/`);
      setMyCompany(mapApiCompany(data));
    } catch { /* silent */ }
  }, []);

  const fetchActiveLoans = useCallback(async () => {
    if (!isEmployee || !employeeId) return;
    try {
      const { data } = await api.get('/loans/?status=active&page_size=200');
      setMyActiveLoans((data.results ?? data).map(l => ({
        id: String(l.id),
        loanNo: l.loan_no,
        employeeId: l.employee,
        principalAmount: l.principal_amount,
        outstandingBalance: l.outstanding_balance,
        status: l.status,
      })));
    } catch { /* silent */ }
  }, [isEmployee, employeeId]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchEmployees();
      await fetchApplications();
      if (isEmployee && employeeId) await fetchActiveLoans();
      setLoading(false);
    };
    load();
  }, [isEmployee, employeeId, fetchEmployees, fetchApplications, fetchActiveLoans]);

  useEffect(() => {
    if (myEmployeeData?.companyId) fetchCompany(myEmployeeData.companyId);
  }, [myEmployeeData?.companyId, fetchCompany]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/settings/');
        setSystemSettings({
          defaultAdminFeeType: data.default_admin_fee_type,
          defaultAdminFee: parseFloat(data.default_admin_fee),
          adminFeeTiers: [
            { max: data.admin_fee_tier1_max, fee: data.admin_fee_tier1_amount },
            { max: Infinity, fee: data.admin_fee_tier2_amount },
          ],
        });
      } catch { /* silent */ }
    })();
  }, []);

  // Auto-open from dashboard selectedApplicationId
  useEffect(() => {
    if (!selectedApplicationId || loading) return;
    const target = applications.find(a => a.id === selectedApplicationId);
    if (target) {
      handleViewDetail(target);
      storeNavigate('loan-application');
    }
  }, [selectedApplicationId, applications, loading]);

  // ── Computed ────────────────────────────────────────────────────────────────

  const visibleApplications = useMemo(() => {
    if (isEmployee && employeeId) return applications.filter(a => a.employeeId === employeeId || String(a.employeeId) === String(employeeId));
    return applications;
  }, [applications, isEmployee, employeeId]);

  const filtered = useMemo(() => visibleApplications.filter(app => {
    const matchSearch = app.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
      app.applicationNo.toLowerCase().includes(search.toLowerCase()) ||
      app.loanPurpose.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchSearch && matchStatus;
  }), [visibleApplications, search, statusFilter]);

  const maxLoanAmount = myCompany?.maxLoanAmount ?? 0;
  const maxTenor = myCompany?.maxTenor ?? 12;
  const maxActiveLoans = myCompany?.maxActiveLoans ?? 2;
  const maxLoanToSalaryPercent = myCompany?.maxLoanToSalaryPercent ?? 50;
  const totalActiveLoanAmount = myActiveLoans.reduce((s, l) => s + l.principalAmount, 0);
  const salaryBasedLimit = myEmployeeData ? Math.floor(myEmployeeData.salary * (maxLoanToSalaryPercent / 100)) : 0;
  const effectiveMaxLoan = Math.min(maxLoanAmount, salaryBasedLimit);
  const remainingLimit = Math.max(0, effectiveMaxLoan - totalActiveLoanAmount);
  const hasPendingApp = isEmployee && visibleApplications.some(a => ['submitted', 'under_review', 'verified', 'approved'].includes(a.status));
  const isEligible = isEmployee ? myActiveLoans.length < maxActiveLoans && !hasPendingApp : true;

  const statusCounts = useMemo(() => {
    const counts = {};
    visibleApplications.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1; });
    return counts;
  }, [visibleApplications]);

  const adminFeeAmount = form.loanAmount > 0 ? calculateAdminFeeAmount(form.loanAmount, form.adminFeeType, form.adminFee, systemSettings.adminFeeTiers) : 0;
  const disbursedAmount = form.loanAmount > 0 ? calculateDisbursedAmount(form.loanAmount, form.adminFeeType, form.adminFee, systemSettings.adminFeeTiers) : 0;
  const monthlyPayment = form.loanAmount > 0 ? calculateMonthlyPayment(form.loanAmount, form.tenor) : 0;
  const totalPayment = form.loanAmount;
  const effectivePurpose = form.loanPurpose === 'Lainnya' ? form.customPurpose : form.loanPurpose;

  const canProceedStep0 = isEmployee
    ? (form.loanAmount > 0 && form.loanPurpose !== '' && (form.loanPurpose !== 'Lainnya' || form.customPurpose.trim() !== '') && (effectiveMaxLoan <= 0 || form.loanAmount <= remainingLimit) && !!signatureFile && !!selfieFile)
    : (form.employeeId !== '' && form.loanAmount > 0 && form.loanPurpose !== '');
  const canSubmit = canProceedStep0 && form.tenor > 0 && (!isEmployee || agreedToContract);

  const tenorOptions = useMemo(() => [3, 6, 9, 12, 18, 24, 36].filter(t => t <= maxTenor), [maxTenor]);

  const adminFeeLabel = systemSettings.defaultAdminFeeType === 'tiered'
    ? `${formatCurrency(systemSettings.adminFeeTiers[0].fee)} / ${formatCurrency(systemSettings.adminFeeTiers[1].fee)}`
    : systemSettings.defaultAdminFeeType === 'percentage'
      ? `${systemSettings.defaultAdminFee}%`
      : formatCurrency(systemSettings.defaultAdminFee);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const openEmployeeForm = () => {
    setForm({
      employeeId: isEmployee ? (employeeId || '') : '',
      loanAmount: 0, loanPurpose: '', customPurpose: '',
      tenor: Math.min(12, maxTenor),
      adminFeeType: systemSettings.defaultAdminFeeType,
      adminFee: systemSettings.defaultAdminFee,
      notes: '',
    });
    setSignatureFile(null);
    setSelfieFile(null);
    setEditingDraftId(null);
    setWizardStep(0);
    setAgreedToContract(false);
    setShowForm(true);
  };

  const openAdminDialog = () => {
    setForm({
      employeeId: '', loanAmount: 0, loanPurpose: '', customPurpose: '',
      tenor: 12, adminFeeType: systemSettings.defaultAdminFeeType, adminFee: systemSettings.defaultAdminFee, notes: '',
    });
    setEditingDraftId(null);
    setAdminDialogOpen(true);
  };

  const buildPayload = (status) => ({
    employee: isEmployee ? Number(myEmployeeData?.id ?? employeeId) : Number(form.employeeId),
    loan_amount: form.loanAmount,
    loan_purpose: effectivePurpose,
    tenor: form.tenor,
    admin_fee_type: form.adminFeeType,
    admin_fee: form.adminFee,
    admin_fee_amount: calculateAdminFeeAmount(form.loanAmount, form.adminFeeType, form.adminFee, systemSettings.adminFeeTiers),
    disbursed_amount: calculateDisbursedAmount(form.loanAmount, form.adminFeeType, form.adminFee, systemSettings.adminFeeTiers),
    status,
    notes: form.notes || '',
  });

  const buildSubmissionData = (status) => {
    const payload = buildPayload(status);
    if (!signatureFile && !selfieFile) return payload;
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => formData.append(key, value));
    if (signatureFile) formData.append('signature_document', signatureFile);
    if (selfieFile) formData.append('selfie_document', selfieFile);
    return formData;
  };

  const handleSaveDraft = async () => {
    setSubmitting(true);
    try {
      await api.post('/applications/', buildSubmissionData('draft'));
      if (isEmployee) setShowForm(false); else setAdminDialogOpen(false);
      setSuccessNotif({ show: true, title: 'Draft Tersimpan', message: 'Draft pengajuan pinjaman Anda berhasil disimpan.', applicationNo: '' });
      await fetchApplications();
    } catch (err) {
      const msg = err.response?.data ? JSON.stringify(err.response.data) : 'Gagal menyimpan draft';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitApplication = async () => {
    setSubmitting(true);
    try {
      let data;
      if (editingDraftId) {
        const res = await api.patch(`/applications/${editingDraftId}/`, buildSubmissionData('submitted'));
        data = res.data;
      } else {
        const res = await api.post('/applications/', buildSubmissionData('submitted'));
        data = res.data;
      }
      setEditingDraftId(null);
      if (isEmployee) setShowForm(false); else setAdminDialogOpen(false);
      setSuccessNotif({
        show: true,
        title: 'Pengajuan Berhasil Dikirim',
        message: 'Pengajuan pinjaman Anda telah berhasil dikirim dan sedang menunggu review.',
        applicationNo: data.application_no || '',
      });
      await fetchApplications();
    } catch (err) {
      const msg = err.response?.data ? JSON.stringify(err.response.data) : 'Gagal mengirim pengajuan';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetail = async (app) => {
    setDetailApp(app);
    setShowDetailDialog(true);
    try {
      const { data } = await api.get(`/applications/${app.id}/`);
      setDetailApp(mapApiApplication(data));
    } catch { /* keep existing */ }
  };

  // ── Loading skeleton ────────────────────────────────────────────────────────

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <Card key={i}><CardContent className="p-4"><div className="h-16 bg-muted rounded animate-pulse" /></CardContent></Card>
      ))}
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // EMPLOYEE VIEW
  // ══════════════════════════════════════════════════════════════════════════

  if (isEmployee) {
    if (loading) return <LoadingSkeleton />;

    // Full-screen wizard form
    if (showForm) {
      const limitUsagePercent = effectiveMaxLoan > 0 ? Math.min(100, Math.round((totalActiveLoanAmount / effectiveMaxLoan) * 100)) : 0;
      const requestedPercent = effectiveMaxLoan > 0 && form.loanAmount > 0
        ? Math.min(100, Math.round(((totalActiveLoanAmount + form.loanAmount) / effectiveMaxLoan) * 100))
        : limitUsagePercent;

      return (
        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <Button variant="ghost" size="icon" className="shrink-0 -ml-2 mt-0.5" onClick={() => setShowForm(false)}>
              <ArrowLeft className="size-5" />
            </Button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold">Pengajuan Pinjaman Baru</h1>
              <p className="text-sm text-muted-foreground">Isi formulir berikut untuk mengajukan pinjaman</p>
            </div>
          </div>

          <Stepper
            steps={[
              { label: 'Info Pinjaman', icon: Wallet },
              { label: 'Tenor & Simulasi', icon: Calculator },
              { label: 'Akad Pinjaman', icon: FileCheck },
              { label: 'Konfirmasi', icon: Send },
            ]}
            currentStep={wizardStep}
          />

          {/* Info card — employee only shows kebijakan tab */}
          <Card className="overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 bg-muted/30">
              <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <User className="size-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold">{myEmployeeData?.name || currentUser?.name || '-'}</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary">
                    {myEmployeeData?.employeeId || '-'}
                  </Badge>
                  {myEmployeeData?.employmentStatus && (
                    <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${getEmploymentStatusColor(myEmployeeData.employmentStatus)}`}>
                      {getEmploymentStatusLabel(myEmployeeData.employmentStatus)}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                  <Building2 className="size-3" />
                  <span>{myCompany?.name || '-'}</span>
                  <span className="text-border">·</span>
                  <Briefcase className="size-3" />
                  <span>{myEmployeeData?.department || '-'}</span>
                </div>
              </div>
            </div>
            <div className="mx-2 sm:mx-3 my-1.5 sm:my-2 rounded-lg border-l-4 border-l-teal-500 bg-teal-50 dark:bg-teal-950/20 px-2 sm:px-3 py-2 sm:py-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                <FormField icon={HandCoins} label="Maks Pinjaman" value={effectiveMaxLoan > 0 ? formatCurrency(effectiveMaxLoan) : '-'} fullWidth />
                <FormField icon={Clock} label="Maks Tenor" value={myCompany ? `${myCompany.maxTenor} bulan` : '-'} />
                <FormField icon={FileText} label="Maks Pinjaman Aktif" value={myCompany ? `${myCompany.maxActiveLoans} pinjaman` : '-'} />
                <Separator className="col-span-1 sm:col-span-2 my-0.5" />
                <FormField icon={Info} label="Jenis Biaya Admin" value={systemSettings.defaultAdminFeeType === 'tiered' ? 'Berjenjang (Flat)' : systemSettings.defaultAdminFeeType === 'fixed' ? 'Tetap (Flat)' : 'Persentase'} />
                <FormField icon={Info} label="Biaya Admin" value={adminFeeLabel} />
              </div>
            </div>
          </Card>

          {/* Limit bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Limit Pinjaman</span>
              <span className="font-medium tabular-nums">
                {formatCurrency(totalActiveLoanAmount + (form.loanAmount > 0 ? form.loanAmount : 0))}
                <span className="text-muted-foreground"> / {formatCurrency(effectiveMaxLoan)}</span>
              </span>
            </div>
            <div className="relative h-2.5 bg-muted rounded-full overflow-hidden">
              <div className="absolute h-full bg-amber-400 dark:bg-amber-500 rounded-full transition-all duration-300" style={{ width: `${limitUsagePercent}%` }} />
              {form.loanAmount > 0 && (
                <div className={`absolute h-full rounded-full transition-all duration-300 ${requestedPercent > 100 ? 'bg-red-400' : 'bg-primary'}`}
                  style={{ left: `${limitUsagePercent}%`, width: `${Math.max(0, requestedPercent - limitUsagePercent)}%` }} />
              )}
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-amber-400" />Terpakai</span>
              {form.loanAmount > 0 && <span className="flex items-center gap-1"><span className={`size-2 rounded-full ${requestedPercent > 100 ? 'bg-red-400' : 'bg-primary'}`} />Diajukan</span>}
              <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-muted-foreground/30" />Tersisa</span>
            </div>
          </div>

          <Separator />

          {/* Step 0 */}
          {wizardStep === 0 && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm flex items-center gap-2"><Wallet className="size-4" />Informasi Pinjaman</CardTitle>
                <CardDescription>Isi informasi dasar pinjaman Anda</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Jumlah Pinjaman</Label>
                    <span className="text-xs text-muted-foreground">Maks: <span className="font-semibold text-foreground">{formatCurrency(remainingLimit)}</span></span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">Rp</span>
                    <Input type="text" inputMode="numeric"
                      value={form.loanAmount > 0 ? formatNumber(form.loanAmount) : ''}
                      onChange={e => setForm({ ...form, loanAmount: Number(e.target.value.replace(/\D/g, '')) })}
                      placeholder="0" className="!pl-10 !text-2xl font-bold tabular-nums !h-14" />
                  </div>
                  {form.loanAmount > remainingLimit && (
                    <p className="text-sm text-red-500 font-medium">Melebihi sisa limit ({formatCurrency(remainingLimit)})</p>
                  )}
                </div>
                <div className="space-y-3">
                  <Label>Tujuan Pinjaman</Label>
                  <Select value={form.loanPurpose} onValueChange={v => setForm({ ...form, loanPurpose: v, customPurpose: '' })}>
                    <SelectTrigger className="h-12"><SelectValue placeholder="Pilih tujuan" /></SelectTrigger>
                    <SelectContent>{LOAN_PURPOSES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                  {form.loanPurpose === 'Lainnya' && (
                    <Input value={form.customPurpose} onChange={e => setForm({ ...form, customPurpose: e.target.value })} placeholder="Jelaskan tujuan pinjaman Anda" className="mt-2 h-12" />
                  )}
                </div>
                <div className="space-y-3">
                  <Label>Catatan (opsional)</Label>
                  <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Catatan tambahan..." rows={3} />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Dokumen Pendukung</Label>
                    <span className="text-xs text-red-500 font-medium">*Wajib</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <SignaturePad file={signatureFile} onCapture={setSignatureFile} />
                    </div>
                    <div className="sm:col-span-2">
                      <SelfieCaptureBox file={selfieFile} onCapture={setSelfieFile} />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Buat tanda tangan digital langsung di layar dan ambil foto selfie secara langsung melalui kamera.</p>
                  {(!signatureFile || !selfieFile) && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-xs">
                      <AlertTriangle className="size-4 shrink-0" />
                      <span>Tanda tangan digital dan foto selfie wajib diisi untuk melanjutkan pengajuan.</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 1 */}
          {wizardStep === 1 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><Calculator className="size-4" />Tenor & Simulasi</CardTitle>
                <CardDescription>Pilih tenor dan lihat simulasi angsuran</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Tenor</Label>
                    <span className="text-xs text-muted-foreground">Maks: <span className="font-medium text-foreground">{maxTenor} bulan</span></span>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {tenorOptions.map(t => (
                      <button key={t} onClick={() => setForm({ ...form, tenor: t })}
                        className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${form.tenor === t ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-accent text-muted-foreground'}`}>
                        {t} bln
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                  <Info className="size-4 shrink-0" />
                  <span>Biaya admin {systemSettings.defaultAdminFeeType === 'tiered'
                    ? `berjenjang: ${formatCurrency(systemSettings.adminFeeTiers[0].fee)} untuk pinjaman s.d. ${formatCurrency(systemSettings.adminFeeTiers[0].max)}, ${formatCurrency(systemSettings.adminFeeTiers[1].fee)} untuk pinjaman di atas itu`
                    : systemSettings.defaultAdminFeeType === 'fixed' ? `tetap ${formatCurrency(systemSettings.defaultAdminFee)}` : `${systemSettings.defaultAdminFee}% dari jumlah pinjaman`}</span>
                </div>
                {form.loanAmount > 0 && (
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-4 space-y-3">
                      <div className="text-center py-1">
                        <p className="text-sm text-muted-foreground">Angsuran per Bulan</p>
                        <p className="text-4xl sm:text-5xl font-bold text-primary mt-1 tabular-nums">{formatCurrency(monthlyPayment)}</p>
                        <p className="text-sm text-muted-foreground mt-1">selama {form.tenor} bulan</p>
                      </div>
                      <Separator />
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-base">
                        <div className="text-muted-foreground">Jumlah Pinjaman</div><div className="font-semibold text-right tabular-nums">{formatCurrency(form.loanAmount)}</div>
                        <div className="text-muted-foreground">Total Pembayaran</div><div className="font-semibold text-right tabular-nums">{formatCurrency(totalPayment)}</div>
                        <div className="text-muted-foreground">Biaya Admin ({adminFeeLabel})</div><div className="font-semibold text-right tabular-nums">{formatCurrency(adminFeeAmount)}</div>
                        <div className="text-muted-foreground">Diterima (Nett)</div><div className="font-bold text-right text-primary tabular-nums">{formatCurrency(disbursedAmount)}</div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 2 — Akad Pinjaman */}
          {wizardStep === 2 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><FileCheck className="size-4" />Akad Pinjaman</CardTitle>
                <CardDescription>Baca dan setujui perjanjian pinjaman sebelum melanjutkan</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <div className="rounded-lg border bg-muted/30 max-h-80 overflow-y-auto p-4 space-y-4">
                  <div className="text-center space-y-1 pb-1">
                    <p className="text-sm font-bold uppercase tracking-wide">Perjanjian Akad Pinjaman Karyawan</p>
                    <p className="text-xs text-muted-foreground">Nomor mengikuti nomor pengajuan setelah dikirim</p>
                  </div>
                  <Separator />
                  {buildAkadClauses({
                    employeeName: myEmployeeData?.name || currentUser?.name,
                    employeeIdNo: myEmployeeData?.employeeId,
                    companyName: myCompany?.name,
                    position: myEmployeeData?.position,
                    loanAmount: form.loanAmount,
                    loanPurpose: effectivePurpose,
                    tenor: form.tenor,
                    monthlyPayment,
                    adminFeeLabel,
                    adminFeeAmount,
                    disbursedAmount,
                  }).map(clause => (
                    <div key={clause.title} className="space-y-1">
                      <p className="text-xs font-semibold">{clause.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{clause.body}</p>
                      {clause.items && (
                        <ul className="text-xs text-muted-foreground leading-relaxed list-disc pl-4 space-y-0.5">
                          {clause.items.map((item, idx) => <li key={idx}>{item}</li>)}
                        </ul>
                      )}
                    </div>
                  ))}
                  <Separator />
                  <p className="text-xs text-muted-foreground leading-relaxed italic">
                    Dengan menyetujui akad ini, Penerima Pinjaman menyatakan telah membaca, memahami, dan menyetujui seluruh isi perjanjian secara sadar dan tanpa paksaan dari pihak manapun.
                  </p>
                </div>
                <label className="flex items-start gap-3 p-3 rounded-lg border bg-background cursor-pointer hover:bg-muted/30 transition-colors">
                  <Checkbox checked={agreedToContract} onCheckedChange={(v) => setAgreedToContract(v === true)} className="mt-0.5" />
                  <span className="text-sm leading-relaxed">
                    Saya telah membaca, memahami, dan <span className="font-semibold">menyetujui seluruh isi Akad Pinjaman</span> di atas, serta bersedia tunduk pada ketentuan yang berlaku.
                  </span>
                </label>
              </CardContent>
            </Card>
          )}

          {/* Step 3 — Konfirmasi */}
          {wizardStep === 3 && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><User className="size-4" />Data Pemohon</CardTitle></CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {[
                    ['Nama', currentUser?.name],
                    ['Employee ID', myEmployeeData?.employeeId || '-'],
                    ['Tempat, Tgl Lahir', myEmployeeData ? `${myEmployeeData.birthPlace}, ${formatDate(myEmployeeData.birthDate)}` : '-'],
                    ['Perusahaan', myCompany?.name || '-'],
                    ['Departemen / Jabatan', `${myEmployeeData?.department || '-'} · ${myEmployeeData?.position || '-'}`],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{label}</span>
                      <span className="text-sm font-medium">{value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Wallet className="size-4" />Detail Pinjaman</CardTitle></CardHeader>
                <CardContent className="pt-0 space-y-2">
                  <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Jumlah Pinjaman</span><span className="text-sm font-bold tabular-nums">{formatCurrency(form.loanAmount)}</span></div>
                  <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Tujuan</span><span className="text-sm font-medium">{effectivePurpose}</span></div>
                  <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Tenor</span><span className="text-sm font-medium">{form.tenor} bulan</span></div>
                  <Separator />
                  <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Angsuran/Bulan</span><span className="text-base font-bold text-primary tabular-nums">{formatCurrency(monthlyPayment)}</span></div>
                  <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Biaya Admin</span><span className="text-sm font-medium tabular-nums">{formatCurrency(adminFeeAmount)}</span></div>
                  <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Diterima (Nett)</span><span className="text-sm font-bold tabular-nums">{formatCurrency(disbursedAmount)}</span></div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Akad Pinjaman</span>
                    <Badge variant="secondary" className={`text-xs ${agreedToContract ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                      {agreedToContract ? 'Telah Disetujui' : 'Belum Disetujui'}
                    </Badge>
                  </div>
                  {form.notes && (<><Separator /><div><span className="text-sm text-muted-foreground">Catatan:</span><p className="text-sm mt-0.5">{form.notes}</p></div></>)}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Wizard navigation */}
          <div className="flex gap-3 pt-2">
            {wizardStep > 0 && (
              <Button variant="outline" className="flex-1" onClick={() => setWizardStep(s => s - 1)}>Kembali</Button>
            )}
            {wizardStep < 3 ? (
              <Button className="flex-1" onClick={() => setWizardStep(s => s + 1)} disabled={(wizardStep === 0 && !canProceedStep0) || (wizardStep === 2 && !agreedToContract)}>
                Lanjut
              </Button>
            ) : (
              <div className="flex flex-col gap-2 flex-1">
                <Button onClick={handleSubmitApplication} disabled={submitting || !canSubmit} className="w-full">
                  {submitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Send className="size-4 mr-2" />}
                  Ajukan Pinjaman
                </Button>
                <Button variant="outline" onClick={handleSaveDraft} disabled={submitting} className="w-full">
                  Simpan sebagai Draft
                </Button>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Employee list view
    return (
      <div className="space-y-4">
        {/* Eligibility Banner */}
        <div className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${isEligible ? 'border-primary/20 bg-primary/5' : 'border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-950/20'}`}>
          <ShieldCheck className={`size-6 shrink-0 ${isEligible ? 'text-primary' : 'text-red-500'}`} />
          <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 items-center">
            <div>
              <Badge className={`text-sm px-3 py-1 ${isEligible ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                {isEligible ? '✓ Eligible' : '✗ Tidak Eligible'}
              </Badge>
            </div>
            <span className="text-base text-muted-foreground">Aktif <span className="text-base font-bold text-foreground">{myActiveLoans.length}</span></span>
            <span className="text-base text-muted-foreground">Limit <span className="text-base font-bold text-foreground tabular-nums">{formatCurrency(remainingLimit)}</span></span>
            <span className="text-base text-muted-foreground">Maks <span className="text-base font-bold text-foreground tabular-nums">{formatCurrency(effectiveMaxLoan)}</span></span>
            {!isEligible && (
              <span className="col-span-2 text-base text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertTriangle className="size-4" />
                {hasPendingApp ? 'Ada pengajuan yang sedang diproses' : 'Lunasi dulu pinjaman aktif'}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <Button className="w-full sm:w-auto" onClick={openEmployeeForm} disabled={!isEligible}>
            <Plus className="size-4 mr-1.5" />Ajukan Pinjaman
          </Button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none items-center">
          {['all', 'submitted', 'under_review', 'approved', 'rejected', 'draft'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${statusFilter === s ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-accent'}`}>
              {s === 'all' ? 'Semua' : getStatusLabel(s)}
            </button>
          ))}
        </div>

        {/* Application cards */}
        {filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map(app => (
              <Card key={app.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleViewDetail(app)}>
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`size-10 sm:size-11 rounded-xl flex items-center justify-center shrink-0 ${app.status === 'approved' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        app.status === 'rejected' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                          app.status === 'under_review' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                            app.status === 'draft' ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' :
                              'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                        <FileText className="size-4 sm:size-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm sm:text-base font-semibold">{app.applicationNo}</span>
                          <Badge variant="secondary" className={`text-xs ${getStatusColor(app.status)}`}>{getStatusLabel(app.status)}</Badge>
                        </div>
                        <p className="text-sm sm:text-base font-medium mt-0.5">{app.loanPurpose}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{app.tenor} bulan · {formatAdminFee(app.adminFeeType, app.adminFee)} admin</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base sm:text-lg font-bold tabular-nums">{formatCurrency(app.loanAmount)}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(app.applicationDate)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-2">
            <CardContent className="py-12 text-center">
              <div className="mx-auto size-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Wallet className="size-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Belum Ada Pengajuan</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">Anda belum memiliki pengajuan pinjaman.</p>
              <Button className="mt-4" onClick={openEmployeeForm} disabled={!isEligible}><Plus className="size-4 mr-1.5" />Ajukan Pinjaman</Button>
            </CardContent>
          </Card>
        )}

        {/* Detail Dialog — Employee */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            {detailApp && (() => {
              const monthly = calculateMonthlyPayment(detailApp.loanAmount, detailApp.tenor);
              return (
                <>
                  <DialogHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <DialogTitle className="text-lg">Detail Pengajuan</DialogTitle>
                        <DialogDescription className="font-mono text-sm">{detailApp.applicationNo} · {detailApp.applicationDate ? formatDate(detailApp.applicationDate) : '-'}</DialogDescription>
                      </div>
                      <Badge variant="secondary" className={`text-sm px-3 py-1 shrink-0 ${getStatusColor(detailApp.status)}`}>{getStatusLabel(detailApp.status)}</Badge>
                    </div>
                  </DialogHeader>

                  {/* Mobile: stack vertikal. Desktop: 3 kolom */}
                  <div className="flex flex-col md:grid md:grid-cols-3 gap-4">

                    {/* Loan details — tampil duluan di mobile */}
                    <div className="md:col-span-2 md:order-2 space-y-3">
                      {/* Hero amount + angsuran */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 text-center">
                          <p className="text-xs text-muted-foreground">Jumlah Pinjaman</p>
                          <p className="text-2xl font-bold text-primary tabular-nums mt-1">{formatCurrency(detailApp.loanAmount)}</p>
                        </div>
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center">
                          <p className="text-xs text-muted-foreground">Angsuran/Bulan</p>
                          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums mt-1">{formatCurrency(monthly)}</p>
                        </div>
                      </div>

                      {/* Info grid */}
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          ['Tujuan', detailApp.loanPurpose],
                          ['Tenor', `${detailApp.tenor} bulan`],
                          ['Biaya Admin', formatCurrency(detailApp.adminFeeAmount)],
                          ['Jenis Admin', detailApp.adminFeeType === 'tiered' ? 'Berjenjang (Flat)' : detailApp.adminFeeType === 'fixed' ? 'Tetap (Flat)' : `Persentase (${detailApp.adminFee}%)`],
                          ['Diterima (Nett)', formatCurrency(detailApp.disbursedAmount)],
                          ['Total Bayar', formatCurrency(detailApp.loanAmount)],
                        ].map(([label, val]) => (
                          <div key={label} className="p-2.5 bg-muted/40 rounded-lg">
                            <p className="text-xs text-muted-foreground">{label}</p>
                            <p className="font-semibold text-sm mt-0.5 truncate">{val}</p>
                          </div>
                        ))}
                      </div>

                      {/* Simulasi angsuran */}
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Simulasi Angsuran</CardTitle></CardHeader>
                        <CardContent className="pt-0">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-xs h-8">Bulan</TableHead>
                                <TableHead className="text-xs h-8">Angsuran</TableHead>
                                <TableHead className="text-xs h-8 text-right">Sisa Pokok</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {Array.from({ length: detailApp.tenor }, (_, i) => {
                                const isLast = i + 1 === detailApp.tenor;
                                const rowAmount = isLast ? detailApp.loanAmount - monthly * (detailApp.tenor - 1) : monthly;
                                const sisa = isLast ? 0 : detailApp.loanAmount - monthly * (i + 1);
                                return (
                                  <TableRow key={i}>
                                    <TableCell className="text-xs py-1.5">Bulan {i + 1}</TableCell>
                                    <TableCell className="text-xs py-1.5 font-medium">{formatCurrency(rowAmount)}</TableCell>
                                    <TableCell className="text-xs py-1.5 text-right">{formatCurrency(sisa)}</TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>

                      {detailApp.notes && (
                        <div className="p-3 bg-muted/30 rounded-lg border">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Catatan</p>
                          <p className="text-sm">{detailApp.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Kolom kiri: Timeline + dokumen + verifikasi */}
                    <div className="md:order-1 space-y-3">
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Riwayat Status</CardTitle></CardHeader>
                        <CardContent className="pt-0"><StatusTimeline app={detailApp} /></CardContent>
                      </Card>
                      {(detailApp.signatureDocumentUrl || detailApp.selfieDocumentUrl) && (
                        <Card>
                          <CardContent className="p-3 space-y-1.5">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Dokumen</p>
                            {detailApp.signatureDocumentUrl && <a href={detailApp.signatureDocumentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs px-2.5 py-2 rounded-md bg-muted hover:bg-accent transition-colors"><FileText className="size-3.5 shrink-0" />Tanda Tangan Digital</a>}
                            {detailApp.selfieDocumentUrl && <a href={detailApp.selfieDocumentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs px-2.5 py-2 rounded-md bg-muted hover:bg-accent transition-colors"><FileText className="size-3.5 shrink-0" />Foto Selfie</a>}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>

                  {/* Draft actions */}
                  {detailApp.status === 'draft' && (
                    <div className="flex gap-2 mt-2">
                      <Button className="flex-1" onClick={() => {
                        setForm({ employeeId: String(detailApp.employeeId), loanAmount: detailApp.loanAmount, loanPurpose: detailApp.loanPurpose, customPurpose: '', tenor: detailApp.tenor, adminFeeType: detailApp.adminFeeType, adminFee: detailApp.adminFee, notes: detailApp.notes || '' });
                        setEditingDraftId(detailApp.id);
                        setShowDetailDialog(false);
                        setWizardStep(0);
                        setAgreedToContract(false);
                        setShowForm(true);
                      }}><Eye className="size-4 mr-1.5" />Lanjutkan Draft</Button>
                      <Button variant="outline" onClick={async () => {
                        try { await api.delete(`/applications/${detailApp.id}/`); } catch { /* soft-fail */ }
                        setShowDetailDialog(false);
                        toast.success('Draft berhasil dihapus');
                        await fetchApplications();
                      }}><X className="size-4 mr-1.5" />Hapus</Button>
                    </div>
                  )}

                  {(detailApp.status === 'submitted' || detailApp.status === 'under_review') && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-sm text-amber-700 dark:text-amber-400 mt-2">
                      <Clock className="size-4 shrink-0" />
                      {isEmployee
                        ? <span>Pengajuan Anda sedang menunggu persetujuan dari admin.</span>
                        : <span>Proses persetujuan di halaman <button className="font-semibold underline" onClick={() => { setShowDetailDialog(false); storeNavigate('loan-approval'); }}>Persetujuan Pinjaman</button>.</span>
                      }
                    </div>
                  )}

                  <DialogFooter className="mt-2">
                    <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Tutup</Button>
                  </DialogFooter>
                </>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* Success notification */}
        {successNotif.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-background rounded-2xl shadow-2xl border p-8 max-w-sm w-[90%] text-center space-y-4 animate-in zoom-in-95 fade-in duration-300">
              <div className="mx-auto size-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="size-9 text-primary" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl font-bold">{successNotif.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{successNotif.message}</p>
                {successNotif.applicationNo && <p className="text-xs font-mono font-semibold text-primary mt-2">{successNotif.applicationNo}</p>}
              </div>
              <Button className="w-full h-11 text-base font-semibold" onClick={() => setSuccessNotif({ show: false, title: '', message: '', applicationNo: '' })}>OK</Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ADMIN / FINANCE / MANAGER VIEW
  // ══════════════════════════════════════════════════════════════════════════

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-5">
        {['submitted', 'under_review', 'approved', 'rejected', 'draft'].map(status => (
          <Card key={status} className={`cursor-pointer hover:shadow-md transition-shadow ${statusFilter === status ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}>
            <CardContent className="p-3 sm:p-4 text-center">
              <p className="text-xl sm:text-2xl font-bold">{statusCounts[status] || 0}</p>
              <p className="text-xs text-muted-foreground">{getStatusLabel(status)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="Cari pengajuan..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Button onClick={openAdminDialog}><Plus className="size-4 mr-2" />Pengajuan Baru</Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Pengajuan</TableHead>
                  <TableHead>Pemohon</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Tujuan</TableHead>
                  <TableHead className="hidden lg:table-cell">Tenor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Tanggal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(app => (
                  <TableRow key={app.id} className="cursor-pointer" onClick={() => handleViewDetail(app)}>
                    <TableCell className="font-mono text-xs">{app.applicationNo}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="size-7"><AvatarFallback className="text-[10px] bg-primary/10 text-primary">{getInitials(app.employeeName || '')}</AvatarFallback></Avatar>
                        <span className="text-sm">{app.employeeName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">{formatCurrency(app.loanAmount)}</TableCell>
                    <TableCell className="text-sm">{app.loanPurpose}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{app.tenor} bulan</TableCell>
                    <TableCell><Badge variant="secondary" className={`text-xs ${getStatusColor(app.status)}`}>{getStatusLabel(app.status)}</Badge></TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{formatDate(app.applicationDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <FileText className="size-10 mx-auto mb-2 opacity-50" /><p>Tidak ada pengajuan ditemukan</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin new application dialog */}
      <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pengajuan Pinjaman Baru</DialogTitle>
            <DialogDescription>Buat pengajuan pinjaman untuk karyawan</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Karyawan</Label>
              <Select value={form.employeeId} onValueChange={v => setForm({ ...form, employeeId: v })}>
                <SelectTrigger><SelectValue placeholder="Pilih karyawan" /></SelectTrigger>
                <SelectContent>{employees.filter(e => e.status === 'active').map(emp => <SelectItem key={emp.id} value={emp.id}>{emp.name} ({emp.employeeId})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Jumlah Pinjaman (Rp)</Label>
              <Input type="number" value={form.loanAmount || ''} onChange={e => setForm({ ...form, loanAmount: Number(e.target.value) })} placeholder="0" />
              {form.loanAmount > 0 && <p className="text-xs text-muted-foreground">{formatCurrency(form.loanAmount)}</p>}
            </div>
            <div className="space-y-2">
              <Label>Tujuan Pinjaman</Label>
              <Select value={form.loanPurpose} onValueChange={v => setForm({ ...form, loanPurpose: v, customPurpose: '' })}>
                <SelectTrigger><SelectValue placeholder="Pilih tujuan" /></SelectTrigger>
                <SelectContent>{LOAN_PURPOSES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
              {form.loanPurpose === 'Lainnya' && <Input value={form.customPurpose} onChange={e => setForm({ ...form, customPurpose: e.target.value })} placeholder="Jelaskan tujuan" className="mt-2" />}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tenor (bulan)</Label>
                <Select value={String(form.tenor)} onValueChange={v => setForm({ ...form, tenor: Number(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{[3, 6, 9, 12, 18, 24, 36].map(t => <SelectItem key={t} value={String(t)}>{t} bulan</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Jenis Biaya Admin</Label>
                <Select value={form.adminFeeType} onValueChange={v => setForm({ ...form, adminFeeType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tiered">Berjenjang (Flat)</SelectItem>
                    <SelectItem value="percentage">Persentase (%)</SelectItem>
                    <SelectItem value="fixed">Nominal Tetap (Rp)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.adminFeeType === 'tiered' ? (
                <div className="space-y-2 col-span-2">
                  <Label>Biaya Admin</Label>
                  <div className="text-xs text-muted-foreground p-2.5 rounded-md border bg-muted/30 space-y-1">
                    <p>≤ {formatCurrency(systemSettings.adminFeeTiers[0].max)}: <span className="font-medium text-foreground">{formatCurrency(systemSettings.adminFeeTiers[0].fee)}</span></p>
                    <p>&gt; {formatCurrency(systemSettings.adminFeeTiers[0].max)}: <span className="font-medium text-foreground">{formatCurrency(systemSettings.adminFeeTiers[1].fee)}</span></p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 col-span-2">
                  <Label>Biaya Admin {form.adminFeeType === 'percentage' ? '(%)' : '(Rp)'}</Label>
                  <div className="relative">
                    {form.adminFeeType === 'fixed' && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rp</span>}
                    <Input type="number" value={form.adminFee || ''} onChange={e => setForm({ ...form, adminFee: Number(e.target.value) })}
                      placeholder={form.adminFeeType === 'percentage' ? '1' : '100000'} className={form.adminFeeType === 'fixed' ? 'pl-10' : ''} />
                    {form.adminFeeType === 'percentage' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>}
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Catatan</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Catatan tambahan..." rows={3} />
            </div>
            {form.loanAmount > 0 && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4 space-y-2">
                  <h4 className="font-semibold text-sm">Simulasi Pinjaman</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">Angsuran per Bulan:</div><div className="font-semibold">{formatCurrency(monthlyPayment)}</div>
                    <div className="text-muted-foreground">Biaya Admin:</div><div className="font-semibold">{formatCurrency(adminFeeAmount)}</div>
                    <div className="text-muted-foreground">Diterima (Nett):</div><div className="font-semibold">{formatCurrency(disbursedAmount)}</div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdminDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSubmitApplication} disabled={!form.employeeId || !form.loanAmount || !form.loanPurpose || submitting}>
              {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}Ajukan Pinjaman
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin detail dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="!w-[90vw] !max-w-[90vw] max-h-[90vh] overflow-y-auto">
          {detailApp && (() => {
            const emp = employees.find(e => String(e.id) === String(detailApp.employeeId));
            const monthly = calculateMonthlyPayment(detailApp.loanAmount, detailApp.tenor);
            return (
              <>
                <DialogHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <DialogTitle className="text-lg">Detail Pengajuan Pinjaman</DialogTitle>
                      <DialogDescription className="font-mono text-sm mt-0.5">{detailApp.applicationNo} · {detailApp.applicationDate ? formatDate(detailApp.applicationDate) : '-'}</DialogDescription>
                    </div>
                    <Badge variant="secondary" className={`text-sm px-3 py-1 shrink-0 ${getStatusColor(detailApp.status)}`}>{getStatusLabel(detailApp.status)}</Badge>
                  </div>
                </DialogHeader>

                {/* Mobile: stack vertikal. Desktop: 3 kolom */}
                <div className="flex flex-col md:grid md:grid-cols-3 gap-4">

                  {/* Kolom 2-3: Info karyawan + detail pinjaman — tampil duluan di mobile */}
                  <div className="md:col-span-2 md:order-2 space-y-3">
                    {/* Employee info */}
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5"><User className="size-3.5" />Data Pemohon</CardTitle></CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar className="size-12">
                            <AvatarFallback className="bg-primary/10 text-primary text-base font-semibold">{getInitials(detailApp.employeeName)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-base">{detailApp.employeeName}</p>
                            {emp && (
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{emp.employeeId}</Badge>
                                <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${getEmploymentStatusColor(emp.employmentStatus)}`}>{getEmploymentStatusLabel(emp.employmentStatus)}</Badge>
                              </div>
                            )}
                          </div>
                        </div>
                        {emp && (
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                            <div className="flex items-center gap-1.5 text-muted-foreground"><Briefcase className="size-3.5 shrink-0" /><span className="truncate">{emp.department || '-'}</span></div>
                            <div className="flex items-center gap-1.5 text-muted-foreground"><Hash className="size-3.5 shrink-0" /><span className="truncate">{emp.position || '-'}</span></div>
                            <div className="flex items-center gap-1.5 text-muted-foreground"><Phone className="size-3.5 shrink-0" /><span>{emp.phone || '-'}</span></div>
                            <div className="flex items-center gap-1.5 text-muted-foreground"><Mail className="size-3.5 shrink-0" /><span className="truncate">{emp.email || '-'}</span></div>
                            <div className="flex items-center gap-1.5 text-muted-foreground"><CalendarDays className="size-3.5 shrink-0" /><span>Bergabung {emp.joinDate ? formatDate(emp.joinDate) : '-'}</span></div>
                            <div className="flex items-center gap-1.5 text-muted-foreground"><HandCoins className="size-3.5 shrink-0" /><span>Gaji {emp.salary ? formatCurrency(emp.salary) : '-'}</span></div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Hero: jumlah + angsuran */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 text-center">
                        <p className="text-xs text-muted-foreground">Jumlah Pinjaman</p>
                        <p className="text-2xl font-bold text-primary tabular-nums mt-1">{formatCurrency(detailApp.loanAmount)}</p>
                      </div>
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center">
                        <p className="text-xs text-muted-foreground">Angsuran/Bulan</p>
                        <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums mt-1">{formatCurrency(monthly)}</p>
                      </div>
                    </div>

                    {/* Info grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        ['Tujuan', detailApp.loanPurpose],
                        ['Tenor', `${detailApp.tenor} bulan`],
                        ['Biaya Admin', `${formatCurrency(detailApp.adminFeeAmount)} (${formatAdminFee(detailApp.adminFeeType, detailApp.adminFee)})`],
                        ['Diterima (Nett)', formatCurrency(detailApp.disbursedAmount)],
                        ['Total Pembayaran', formatCurrency(detailApp.loanAmount)],
                      ].map(([label, val]) => (
                        <div key={label} className="p-2.5 bg-muted/40 rounded-lg">
                          <p className="text-xs text-muted-foreground">{label}</p>
                          <p className="font-semibold text-sm mt-0.5 break-words">{val}</p>
                        </div>
                      ))}
                    </div>

                    {/* Simulasi angsuran */}
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Simulasi Angsuran</CardTitle></CardHeader>
                      <CardContent className="pt-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs h-8">Bulan</TableHead>
                              <TableHead className="text-xs h-8">Angsuran</TableHead>
                              <TableHead className="text-xs h-8 text-right">Sisa Pokok</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Array.from({ length: detailApp.tenor }, (_, i) => (
                              <TableRow key={i}>
                                <TableCell className="text-xs py-1.5">Bulan {i + 1}</TableCell>
                                <TableCell className="text-xs py-1.5 font-medium">{formatCurrency(monthly)}</TableCell>
                                <TableCell className="text-xs py-1.5 text-right">{formatCurrency(Math.max(0, detailApp.loanAmount - monthly * (i + 1)))}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>

                    {detailApp.notes && (
                      <div className="p-3 bg-muted/30 rounded-lg border">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Catatan</p>
                        <p className="text-sm">{detailApp.notes}</p>
                      </div>
                    )}

                    {(detailApp.status === 'submitted' || detailApp.status === 'under_review') && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-sm text-amber-700 dark:text-amber-400">
                        <Clock className="size-4 shrink-0" />
                        <span>Proses persetujuan di halaman <button className="font-semibold underline" onClick={() => { setShowDetailDialog(false); storeNavigate('loan-approval'); }}>Persetujuan Pinjaman</button>.</span>
                      </div>
                    )}
                  </div>

                  {/* Kolom 1: Timeline + Verifikasi + Dokumen */}
                  <div className="md:order-1 space-y-3">
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Riwayat Status</CardTitle></CardHeader>
                      <CardContent className="pt-0"><StatusTimeline app={detailApp} /></CardContent>
                    </Card>
                    {(detailApp.reviewedAt || detailApp.reviewedBy) && (
                      <Card className="border-primary/20">
                        <CardContent className="p-3 space-y-2 text-sm">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Verifikasi</p>
                          <div><p className="text-xs text-muted-foreground">Diverifikasi oleh</p><p className="font-medium">{detailApp.reviewedBy || '-'}</p></div>
                          <div><p className="text-xs text-muted-foreground">Tanggal Verifikasi</p><p className="font-medium">{detailApp.reviewedAt ? formatDateTime(detailApp.reviewedAt) : '-'}</p></div>
                        </CardContent>
                      </Card>
                    )}
                    {(detailApp.signatureDocumentUrl || detailApp.selfieDocumentUrl) && (
                      <Card>
                        <CardContent className="p-3 space-y-1.5">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Dokumen</p>
                          {detailApp.signatureDocumentUrl && <a href={detailApp.signatureDocumentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs px-2.5 py-2 rounded-md bg-muted hover:bg-accent transition-colors"><FileText className="size-3.5 shrink-0" />Tanda Tangan Digital</a>}
                          {detailApp.selfieDocumentUrl && <a href={detailApp.selfieDocumentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs px-2.5 py-2 rounded-md bg-muted hover:bg-accent transition-colors"><FileText className="size-3.5 shrink-0" />Foto Selfie</a>}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>

                <DialogFooter className="mt-2">
                  <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Tutup</Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

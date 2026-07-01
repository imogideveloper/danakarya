import { jsPDF } from 'jspdf';
import {
  formatCurrency, formatDate, formatDateTime, getStatusLabel, getEmploymentStatusLabel,
  calculateMonthlyPayment, calculateAdminFeeAmount, calculateDisbursedAmount, formatAdminFee,
} from './format';

// ── Akad Pinjaman clauses ─────────────────────────────────────────────────────
// Shared between the application wizard (Step "Akad Pinjaman") and the
// generated PDF document, so the contract text stays identical in both places.

export function buildAkadClauses({ employeeName, employeeIdNo, companyName, position, loanAmount, loanPurpose, tenor, monthlyPayment, adminFeeLabel, adminFeeAmount, disbursedAmount }) {
  return [
    {
      title: 'PASAL 1 — PIHAK-PIHAK',
      body: `Pihak Pertama (Pemberi Pinjaman): PT DANAKARYA, beralamat di Jakarta, selanjutnya disebut sebagai "Perusahaan".\nPihak Kedua (Penerima Pinjaman): ${employeeName || 'Karyawan'}, NIK ${employeeIdNo || '-'}, karyawan pada ${companyName || '-'}, selanjutnya disebut sebagai "Peminjam".`,
    },
    {
      title: 'PASAL 2 — JUMLAH DAN TUJUAN PINJAMAN',
      body: `Perusahaan memberikan pinjaman kepada Peminjam sebesar ${formatCurrency(loanAmount)} yang akan digunakan untuk keperluan "${loanPurpose || '-'}". Pinjaman ini diberikan berdasarkan permohonan tertulis dari Peminjam dan telah melalui proses verifikasi serta persetujuan oleh Perusahaan.`,
    },
    {
      title: 'PASAL 3 — BIAYA ADMINISTRASI',
      body: adminFeeLabel === 'Berjenjang'
        ? `Atas pemberian pinjaman ini, Peminjam dikenakan biaya administrasi sebesar ${formatCurrency(adminFeeAmount)} (skema berjenjang berdasarkan jumlah pinjaman) yang dipotong langsung dari pokok pinjaman pada saat pencairan, sehingga dana yang diterima Peminjam (nett) adalah sebesar ${formatCurrency(disbursedAmount)}.`
        : `Atas pemberian pinjaman ini, Peminjam dikenakan biaya administrasi sebesar ${adminFeeLabel} (${formatCurrency(adminFeeAmount)}) yang dipotong langsung dari pokok pinjaman pada saat pencairan, sehingga dana yang diterima Peminjam (nett) adalah sebesar ${formatCurrency(disbursedAmount)}.`,
    },
    {
      title: 'PASAL 4 — JANGKA WAKTU DAN ANGSURAN',
      body: `Pinjaman ini wajib dilunasi dalam jangka waktu ${tenor} bulan terhitung sejak tanggal pencairan, melalui angsuran bulanan sebesar ${formatCurrency(monthlyPayment)} per bulan dengan metode perhitungan flat (tanpa bunga berbunga).`,
    },
    {
      title: 'PASAL 5 — PEMBAYARAN MELALUI POTONG GAJI',
      body: 'Peminjam dengan ini memberikan kuasa kepada Perusahaan untuk memotong gaji bulanan Peminjam secara otomatis (payroll deduction) sebesar nilai angsuran yang jatuh tempo setiap bulannya, dan menyetorkan hasil potongan tersebut kepada Pemberi Pinjaman.',
    },
    {
      title: 'PASAL 6 — KETERLAMBATAN PEMBAYARAN',
      body: 'Apabila terjadi keterlambatan pembayaran angsuran melebihi 7 (tujuh) hari kalender dari tanggal jatuh tempo, maka berlaku ketentuan sebagai berikut:',
      items: [
        'Peminjam dikenakan denda keterlambatan sebesar 0,1% (nol koma satu persen) per hari dari jumlah angsuran yang tertunggak;',
        'Keterlambatan lebih dari 30 (tiga puluh) hari akan dilaporkan kepada perusahaan tempat Peminjam bekerja;',
        'Keterlambatan lebih dari 90 (sembilan puluh) hari dianggap sebagai keadaan default/wanprestasi sebagaimana diatur dalam Pasal 8.',
      ],
    },
    {
      title: 'PASAL 7 — PELUNASAN DIPERCEPAT',
      body: 'Peminjam berhak melakukan pelunasan dipercepat (early settlement) atas sisa kewajiban pinjaman kapan saja selama masa pinjaman berlangsung, tanpa dikenakan biaya maupun penalti dalam bentuk apa pun.',
    },
    {
      title: 'PASAL 8 — KEADAAN DEFAULT DAN KONSEKUENSI',
      body: 'Dalam hal Peminjam dinyatakan berada dalam keadaan default sebagaimana dimaksud dalam Pasal 6, maka Pemberi Pinjaman berhak untuk:',
      items: [
        'Menyatakan seluruh sisa kewajiban pinjaman jatuh tempo dan harus segera dilunasi (acceleration);',
        'Berkoordinasi dengan perusahaan tempat Peminjam bekerja untuk penyelesaian kewajiban melalui pemotongan gaji maupun hak-hak lain milik Peminjam;',
        'Melaporkan status default Peminjam kepada lembaga terkait sesuai dengan ketentuan peraturan perundang-undangan yang berlaku;',
        'Menempuh upaya hukum lain yang sah untuk memulihkan hak-hak Pemberi Pinjaman.',
      ],
    },
    {
      title: 'PASAL 9 — KERAHASIAAN DATA',
      body: 'Pemberi Pinjaman wajib menjaga kerahasiaan seluruh data pribadi dan data kepegawaian Peminjam, dan hanya akan menggunakannya untuk keperluan administrasi pinjaman serta pelaporan sesuai dengan ketentuan yang berlaku.',
    },
    {
      title: 'PASAL 10 — PENYELESAIAN SENGKETA',
      body: 'Setiap perselisihan yang timbul dari atau sehubungan dengan perjanjian ini akan diselesaikan terlebih dahulu secara musyawarah untuk mufakat. Apabila tidak tercapai kesepakatan, para pihak setuju untuk menyelesaikannya melalui Badan Arbitrase Nasional Indonesia (BANI).',
    },
    {
      title: 'PASAL 11 — KETENTUAN LAIN-LAIN',
      body: 'Hal-hal yang belum diatur dalam perjanjian ini akan diatur kemudian berdasarkan kesepakatan tertulis dari kedua belah pihak dan menjadi bagian yang tidak terpisahkan dari perjanjian ini. Perjanjian ini berlaku sejak ditandatangani/disetujui secara digital oleh Peminjam.',
    },
  ];
}

// ── PDF layout constants & helpers ───────────────────────────────────────────

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 16;
const CONTENT_W = PAGE_W - MARGIN * 2;
const INK = [25, 25, 25];
const MUTED = [115, 115, 115];
const FAINT = [200, 200, 200];

function drawDocHeader(doc, title, subtitle) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...INK);
  doc.text('PT DANAKARYA FINANCE', PAGE_W / 2, MARGIN, { align: 'center' });
  doc.setFontSize(10.5);
  doc.text(title, PAGE_W / 2, MARGIN + 6, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(subtitle, PAGE_W / 2, MARGIN + 11, { align: 'center' });
  doc.setDrawColor(...FAINT);
  doc.line(MARGIN, MARGIN + 14.5, PAGE_W - MARGIN, MARGIN + 14.5);
  doc.setTextColor(...INK);
  return MARGIN + 21;
}

function drawDocFooter(doc, applicationNo) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.text(
    `Dokumen ini dihasilkan secara otomatis oleh Sistem DANAKARYA — ${formatDateTime(new Date().toISOString())} · No. Pengajuan: ${applicationNo || '-'}`,
    PAGE_W / 2, PAGE_H - 10, { align: 'center' }
  );
  doc.setTextColor(...INK);
}

function drawCenteredTitle(doc, title, subtitle) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...INK);
  doc.text(title, PAGE_W / 2, MARGIN + 2, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text(subtitle, PAGE_W / 2, MARGIN + 8, { align: 'center' });
  doc.setDrawColor(...FAINT);
  doc.line(MARGIN, MARGIN + 12, PAGE_W - MARGIN, MARGIN + 12);
  doc.setTextColor(...INK);
  return MARGIN + 18;
}

function drawSingleSignature(doc, y, label, name, sub) {
  const x = PAGE_W - MARGIN;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...INK);
  doc.text(label, x, y, { align: 'right' });
  const lineY = y + 17;
  doc.setDrawColor(...INK);
  doc.line(x - 55, lineY, x, lineY);
  doc.setFont('helvetica', 'bold');
  doc.text(name || '-', x, lineY + 4.5, { align: 'right' });
  if (sub) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(sub, x, lineY + 9, { align: 'right' });
    doc.setTextColor(...INK);
  }
  return lineY + 9;
}

// ── Page 1 — Akad Perjanjian Pinjaman Karyawan ───────────────────────────────

function buildAkadPage(doc, { app, employee, company }) {
  let y = drawCenteredTitle(doc, 'AKAD PERJANJIAN PINJAMAN KARYAWAN',
    `Nomor: ${app.applicationNo}  |  Tanggal: ${formatDate(app.applicationDate)}`);

  const adminFeeAmount = app.adminFeeAmount ?? calculateAdminFeeAmount(app.loanAmount, app.adminFeeType, app.adminFee);
  const disbursedAmount = app.disbursedAmount ?? calculateDisbursedAmount(app.loanAmount, app.adminFeeType, app.adminFee);
  const monthlyPayment = calculateMonthlyPayment(app.loanAmount, app.tenor);

  const clauses = buildAkadClauses({
    employeeName: app.employeeName,
    employeeIdNo: employee?.employeeId,
    companyName: company?.name,
    position: employee?.position,
    loanAmount: app.loanAmount,
    loanPurpose: app.loanPurpose,
    tenor: app.tenor,
    monthlyPayment,
    adminFeeLabel: formatAdminFee(app.adminFeeType, app.adminFee),
    adminFeeAmount,
    disbursedAmount,
  });

  const lh = 3;
  clauses.forEach(clause => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...INK);
    doc.text(clause.title, MARGIN, y);
    y += lh + 0.4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    const lines = doc.splitTextToSize(clause.body, CONTENT_W);
    doc.text(lines, MARGIN, y);
    y += lines.length * lh;
    if (clause.items) {
      clause.items.forEach((item, idx) => {
        const itemLines = doc.splitTextToSize(`${idx + 1}. ${item}`, CONTENT_W - 4);
        doc.text(itemLines, MARGIN + 4, y);
        y += itemLines.length * lh;
      });
    }
    y += 1.8;
  });

  y += 1;
  const boxH = 15;
  doc.setDrawColor(...FAINT);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(MARGIN, y, CONTENT_W, boxH, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...INK);
  doc.text('DOKUMEN INI TELAH DISETUJUI SECARA DIGITAL', MARGIN + 4, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  const approvalLines = doc.splitTextToSize(
    'Dengan menyetujui pengajuan ini secara elektronik, Peminjam menyatakan telah membaca, memahami, dan menyetujui seluruh isi perjanjian sebagaimana tercantum di atas, serta tunduk pada seluruh ketentuan yang berlaku tanpa memerlukan tanda tangan basah.',
    CONTENT_W - 8
  );
  doc.text(approvalLines, MARGIN + 4, y + 9);
  doc.setTextColor(...INK);
  y += boxH + 7;

  drawSingleSignature(doc, y, 'Peminjam (Karyawan),', app.employeeName, `ID Karyawan: ${employee?.employeeId || '-'}`);

  drawDocFooter(doc, app.applicationNo);
}

// ── Page 2 — Surat Permohonan Persetujuan Pemotongan Gaji ────────────────────

function drawTableSection(doc, startY, title, rows) {
  const headerH = 5.5;
  const rowH = 5.5;
  let y = startY;

  doc.setFillColor(...INK);
  doc.rect(MARGIN, y, CONTENT_W, headerH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(title, MARGIN + 3, y + headerH - 1.7);
  y += headerH;

  rows.forEach(([label, value], idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(245, 245, 245);
      doc.rect(MARGIN, y, CONTENT_W, rowH, 'F');
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(label, MARGIN + 3, y + rowH - 1.8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...INK);
    doc.text(String(value ?? '-'), MARGIN + 62, y + rowH - 1.8);
    y += rowH;
  });

  doc.setDrawColor(...FAINT);
  doc.rect(MARGIN, startY, CONTENT_W, headerH + rows.length * rowH);
  doc.setTextColor(...INK);
  return y + 4.5;
}

function drawTripleSignature(doc, y, columns) {
  const colW = CONTENT_W / 3;
  columns.forEach((col, i) => {
    const x = MARGIN + i * colW;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...INK);
    doc.text(col.label, x, y);
    const lineY = y + 15;
    doc.setDrawColor(...INK);
    doc.line(x, lineY, x + colW - 12, lineY);
    doc.setFont('helvetica', 'bold');
    doc.text(col.name || '-', x, lineY + 4);
    if (col.sub) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(...MUTED);
      doc.text(col.sub, x, lineY + 7.8);
      doc.setTextColor(...INK);
    }
  });
  return y + 15 + 7.8;
}

function drawApprovalFooter(doc, applicationNo, applicationDate) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.text(`Dokumen ini dihasilkan secara otomatis oleh Sistem DANAKARYA — ${formatDateTime(new Date().toISOString())}`,
    PAGE_W / 2, PAGE_H - 13, { align: 'center' });
  doc.text(`No. Pengajuan: ${applicationNo || '-'}  |  Tgl Pengajuan: ${applicationDate ? formatDate(applicationDate) : '-'}`,
    PAGE_W / 2, PAGE_H - 9, { align: 'center' });
  doc.setTextColor(...INK);
}

function buildApprovalPage(doc, { app, employee, company, loanCycleStats, paymentHealth }) {
  const monthlyPayment = calculateMonthlyPayment(app.loanAmount, app.tenor);
  const lastInstallment = app.loanAmount - monthlyPayment * (app.tenor - 1);
  const cycleLabel = loanCycleStats.totalLoans === 0 ? 'Pinjaman Pertama' : `Pinjaman ke-${loanCycleStats.paidOffCount + 1}`;
  const today = new Date().toISOString().split('T')[0];

  // Letterhead
  let y = MARGIN;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...INK);
  doc.text('DANAKARYA', MARGIN, y + 2);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text('Sistem Manajemen Pinjaman Karyawan', MARGIN, y + 7);
  doc.setFontSize(8);
  doc.setTextColor(...INK);
  doc.text(formatDate(today), PAGE_W - MARGIN, y + 2, { align: 'right' });
  doc.setDrawColor(...FAINT);
  doc.line(MARGIN, y + 11, PAGE_W - MARGIN, y + 11);
  y += 17;

  // Recipient block
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...INK);
  doc.text('Kepada Yth.', MARGIN, y);
  y += 4.4;
  doc.setFont('helvetica', 'bold');
  doc.text(`HRD ${company?.name || '-'}`, MARGIN, y);
  y += 4.2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  const addrLines = doc.splitTextToSize(company?.address || '-', CONTENT_W);
  doc.text(addrLines, MARGIN, y);
  y += addrLines.length * 3.6 + 4;
  doc.setTextColor(...INK);

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('SURAT PERMOHONAN PERSETUJUAN PEMOTONGAN GAJI', PAGE_W / 2, y, { align: 'center' });
  y += 4.4;
  doc.text('(PAYROLL DEDUCTION)', PAGE_W / 2, y, { align: 'center' });
  y += 4.4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text(`Nomor: ${app.applicationNo}`, PAGE_W / 2, y, { align: 'center' });
  doc.setTextColor(...INK);
  y += 6.5;

  // Opening paragraph
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const openingLines = doc.splitTextToSize(
    'Dengan hormat,\nSehubungan dengan permohonan pinjaman yang diajukan oleh karyawan Bapak/Ibu sebagaimana tercantum di bawah ini, dengan ini kami sampaikan permohonan persetujuan pemotongan gaji bulanan (payroll deduction) guna keperluan pembayaran angsuran pinjaman karyawan yang bersangkutan kepada PT DANAKARYA, dengan rincian sebagai berikut:',
    CONTENT_W
  );
  doc.text(openingLines, MARGIN, y);
  y += openingLines.length * 3.4 + 3.5;

  // I. Data Karyawan
  y = drawTableSection(doc, y, 'I. DATA KARYAWAN', [
    ['Nama', app.employeeName],
    ['ID Karyawan', employee?.employeeId],
    ['Jabatan', employee?.position],
    ['Departemen', employee?.department],
    ['Perusahaan', company?.name],
    ['Status Kepegawaian', employee?.employmentStatus ? getEmploymentStatusLabel(employee.employmentStatus) : '-'],
  ]);

  // II. Data Pinjaman
  const adminFeeAmount = app.adminFeeAmount ?? calculateAdminFeeAmount(app.loanAmount, app.adminFeeType, app.adminFee);
  const disbursedAmount = app.disbursedAmount ?? calculateDisbursedAmount(app.loanAmount, app.adminFeeType, app.adminFee);
  y = drawTableSection(doc, y, 'II. DATA PINJAMAN', [
    ['Jumlah Pinjaman', formatCurrency(app.loanAmount)],
    ['Tujuan Pinjaman', app.loanPurpose],
    ['Tenor', `${app.tenor} bulan`],
    ['Biaya Admin', app.adminFeeType === 'tiered'
      ? `${formatCurrency(adminFeeAmount)} (skema berjenjang)`
      : app.adminFeeType === 'fixed'
        ? `${formatCurrency(app.adminFee)} (potongan tetap)`
        : `${app.adminFee}% dari jumlah pinjaman (${formatCurrency(adminFeeAmount)})`],
    ['Jumlah Diterima (Nett)', formatCurrency(disbursedAmount)],
    ['Angsuran per Bulan', formatCurrency(monthlyPayment)],
    ['Angsuran Terakhir', formatCurrency(lastInstallment)],
    ['Total Pembayaran', formatCurrency(app.loanAmount)],
  ]);

  // III. Parameter Penilaian
  y = drawTableSection(doc, y, 'III. PARAMETER PENILAIAN', [
    ['Siklus Pinjaman', cycleLabel],
    ['Payment Health', paymentHealth.label],
  ]);

  // Boxed request paragraph
  const boxText = `Sehubungan dengan persetujuan pinjaman karyawan tersebut di atas, dengan ini kami memohon kepada HRD ${company?.name || 'Perusahaan'} untuk berkenan melakukan pemotongan gaji bulanan karyawan yang bersangkutan sebesar nilai angsuran sebagaimana tercantum di atas, terhitung sejak gaji bulan berikutnya hingga seluruh kewajiban pinjaman dinyatakan lunas, serta menyetorkan hasil potongan tersebut kepada PT DANAKARYA sesuai dengan mekanisme yang telah disepakati.\nAtas perhatian dan kerja sama Bapak/Ibu, kami ucapkan terima kasih.`;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  const boxLines = doc.splitTextToSize(boxText, CONTENT_W - 8);
  const boxH = 5 + boxLines.length * 3.2 + 3;
  doc.setDrawColor(...FAINT);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(MARGIN, y, CONTENT_W, boxH, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...INK);
  doc.text('PERMOHONAN PEMOTONGAN GAJI', MARGIN + 4, y + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.text(boxLines, MARGIN + 4, y + 8.2);
  doc.setTextColor(...INK);
  y += boxH + 6;

  // Triple signature
  drawTripleSignature(doc, y, [
    { label: 'Pemohon,', name: app.employeeName, sub: 'Karyawan' },
    { label: 'Menyetujui,', name: 'HRD Perusahaan', sub: company?.name || '-' },
    { label: 'Mengetahui,', name: app.reviewedBy || 'Admin Danakarya', sub: 'PT DANAKARYA' },
  ]);

  drawApprovalFooter(doc, app.applicationNo, app.applicationDate);
}

// ── Page 3 — Lampiran Tanda Tangan & Selfie ───────────────────────────────────

async function loadImageForPdf(url) {
  const res = await fetch(url, { mode: 'cors' });
  if (!res.ok) throw new Error('image fetch failed');
  const blob = await res.blob();
  if (blob.type === 'application/pdf' || /\.pdf(\?|#|$)/i.test(url)) {
    const err = new Error('document is a PDF, cannot be embedded as image');
    err.isPdf = true;
    throw err;
  }
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
  const { width, height } = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = dataUrl;
  });
  const format = blob.type.includes('png') ? 'PNG' : blob.type.includes('webp') ? 'WEBP' : 'JPEG';
  return { dataUrl, format, width, height };
}

async function drawAttachmentBlock(doc, y, label, url, boxW, boxH) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.text(label, MARGIN, y);
  const top = y + 3;

  if (!url) {
    doc.setDrawColor(...FAINT);
    doc.setFillColor(248, 248, 248);
    doc.roundedRect(MARGIN, top, boxW, boxH, 2, 2, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text('Dokumen tidak tersedia.', MARGIN + boxW / 2, top + boxH / 2, { align: 'center' });
    doc.setTextColor(...INK);
    return top + boxH + 10;
  }

  try {
    const img = await loadImageForPdf(url);
    const ratio = Math.min(boxW / img.width, boxH / img.height);
    const w = img.width * ratio;
    const h = img.height * ratio;
    const offsetX = MARGIN + (boxW - w) / 2;
    doc.setDrawColor(...FAINT);
    doc.roundedRect(MARGIN, top, boxW, boxH, 2, 2);
    doc.addImage(img.dataUrl, img.format, offsetX, top + (boxH - h) / 2, w, h);
    return top + boxH + 10;
  } catch (err) {
    if (err?.isPdf) {
      doc.setDrawColor(...FAINT);
      doc.setFillColor(248, 248, 248);
      doc.roundedRect(MARGIN, top, boxW, boxH, 2, 2, 'FD');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      doc.text('Dokumen diunggah dalam format PDF dan tidak dapat ditampilkan sebagai gambar di sini.', MARGIN + boxW / 2, top + boxH / 2 - 3, { align: 'center', maxWidth: boxW - 16 });
      doc.text('Buka tautan dokumen pada halaman Detail Pengajuan untuk melihat isinya.', MARGIN + boxW / 2, top + boxH / 2 + 6, { align: 'center', maxWidth: boxW - 16 });
      doc.setTextColor(...INK);
      return top + boxH + 10;
    }
    doc.setDrawColor(...FAINT);
    doc.setFillColor(254, 242, 242);
    doc.roundedRect(MARGIN, top, boxW, boxH, 2, 2, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(220, 38, 38);
    doc.text('Gagal memuat dokumen.', MARGIN + boxW / 2, top + boxH / 2, { align: 'center' });
    doc.setTextColor(...INK);
    return top + boxH + 10;
  }
}

async function buildAttachmentPage(doc, { app }) {
  let y = drawDocHeader(doc, 'LAMPIRAN DOKUMEN PENDUKUNG',
    `${app.employeeName}   ·   No. Pengajuan: ${app.applicationNo}`);

  const boxW = CONTENT_W;
  const boxH = 105;

  y = await drawAttachmentBlock(doc, y, 'Tanda Tangan Digital', app.signatureDocumentUrl, boxW, boxH);
  await drawAttachmentBlock(doc, y, 'Foto Selfie', app.selfieDocumentUrl, boxW, boxH);

  drawDocFooter(doc, app.applicationNo);
}

// ── Entry point ───────────────────────────────────────────────────────────────

export async function generateLoanApprovalPdf({ app, employee, company, loanCycleStats, paymentHealth }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  buildAkadPage(doc, { app, employee, company });

  doc.addPage();
  buildApprovalPage(doc, { app, employee, company, loanCycleStats, paymentHealth });

  doc.addPage();
  await buildAttachmentPage(doc, { app });

  doc.save(`Dokumen_${app.applicationNo || 'Pengajuan'}.pdf`);
}

import * as XLSX from 'xlsx';

// --- Column role detection ---
const ROLE_KEYWORDS = {
  tanggal: ['tanggal', 'tgl', 'date'],
  keterangan: ['keterangan', 'uraian', 'deskripsi', 'description', 'remark'],
  debit: ['debit', 'keluar', 'withdrawal'],
  kredit: ['kredit', 'credit', 'masuk', 'deposit'],
  saldo: ['saldo', 'balance'],
};

export function detectColumns(headers) {
  const mapping = { tanggal: '', keterangan: '', debit: '', kredit: '', saldo: '' };
  const used = new Set();
  for (const role of Object.keys(ROLE_KEYWORDS)) {
    const keywords = ROLE_KEYWORDS[role];
    const match = headers.find((h, i) => {
      if (used.has(i) || !h) return false;
      const normalized = String(h).trim().toLowerCase();
      return keywords.some(kw => normalized.includes(kw));
    });
    if (match) {
      mapping[role] = match;
      used.add(headers.indexOf(match));
    }
  }
  return mapping;
}

// --- Header row auto-detection ---
// Scans the first rows of a parsed sheet to find the row that looks like the
// transaction table header (contains at least a date column and a debit/kredit column).
export function detectHeaderRowIndex(rawRows, maxScan = 20) {
  const limit = Math.min(rawRows.length, maxScan);
  for (let i = 0; i < limit; i++) {
    const headers = (rawRows[i] || []).map(h => String(h ?? '').trim());
    const mapping = detectColumns(headers);
    if (mapping.tanggal && (mapping.debit || mapping.kredit)) {
      return i + 1; // 1-based
    }
  }
  return 1;
}

// --- Account info detection ---
// Best-effort: look for metadata rows above the header row mentioning the account
// number and/or account holder name.
export function detectAccountInfo(rawRows, headerRowIndex) {
  let accountNumber = null;
  let accountName = null;
  let raw = null;

  for (let i = 0; i < headerRowIndex - 1 && i < rawRows.length; i++) {
    const cells = (rawRows[i] || []).map(c => String(c ?? '').trim()).filter(Boolean);
    if (!cells.length) continue;
    const text = cells.join(' ');

    if (!accountNumber) {
      const numMatch = text.match(/(?:no\.?\s*rek(?:ening)?|account\s*(?:no\.?|number)?)\s*:?\s*([\d\-\s]{6,})/i);
      if (numMatch) accountNumber = numMatch[1].trim();
    }
    if (!accountName) {
      const nameMatch = text.match(/(?:nama(?:\s*pemilik)?|account\s*name|a\.?n\.?)\s*:?\s*(.+)/i);
      if (nameMatch) accountName = nameMatch[1].trim();
    }
    if (!raw && /no\.?\s*rek|rekening|account/i.test(text)) {
      raw = text;
    }
  }

  if (!accountNumber && !accountName && !raw) return null;
  return { accountNumber, accountName, raw };
}

// --- Amount parsing ---
export function parseAmount(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? Math.round(value) : 0;

  let str = String(value).trim().replace(/[^0-9.,-]/g, '');
  if (!str) return 0;

  const hasDot = str.includes('.');
  const hasComma = str.includes(',');

  if (hasDot && hasComma) {
    // Whichever separator appears last is the decimal separator
    const lastDot = str.lastIndexOf('.');
    const lastComma = str.lastIndexOf(',');
    if (lastComma > lastDot) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (hasComma) {
    const parts = str.split(',');
    const last = parts[parts.length - 1];
    if (parts.length === 2 && last.length <= 2) {
      str = parts.join('.');
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (hasDot) {
    const parts = str.split('.');
    const last = parts[parts.length - 1];
    if (parts.length === 2 && last.length <= 2) {
      // keep as decimal
    } else {
      str = str.replace(/\./g, '');
    }
  }

  const n = parseFloat(str);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

// --- Date parsing ---
export function parseStatementDate(value) {
  if (value === null || value === undefined || value === '') return null;

  if (typeof value === 'number') {
    try {
      const d = XLSX.SSF.parse_date_code(value);
      if (!d) return null;
      return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
    } catch {
      return null;
    }
  }

  const str = String(value).trim();

  // ISO format: YYYY-MM-DD...
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.slice(0, 10);
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const m = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    let [, d, mo, y] = m;
    if (y.length === 2) y = `20${y}`;
    return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Fallback: let Date try to parse it
  const parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return null;
}

// --- Date diff helper ---
export function dayDiff(isoA, isoB) {
  if (!isoA || !isoB) return Infinity;
  const a = new Date(`${isoA}T00:00:00Z`).getTime();
  const b = new Date(`${isoB}T00:00:00Z`).getTime();
  return Math.abs(a - b) / 86400000;
}

// --- Build statement rows from raw object rows ---
export function buildStatementRows(objRows) {
  const rows = [];
  objRows.forEach((row, index) => {
    const debit = parseAmount(row.debit);
    const kredit = parseAmount(row.kredit);
    if (!debit && !kredit) return;

    const type = kredit > 0 ? 'kredit' : 'debit';
    const amount = kredit > 0 ? kredit : debit;

    rows.push({
      id: `row-${index}`,
      date: parseStatementDate(row.tanggal),
      description: row.keterangan ? String(row.keterangan).trim() : '',
      amount,
      type,
      balance: row.saldo !== undefined && row.saldo !== '' ? parseAmount(row.saldo) : null,
    });
  });
  return rows;
}

// --- Statement summary (for preview) ---
export function summarizeStatement(rows) {
  let kreditTotal = 0, kreditCount = 0, debitTotal = 0, debitCount = 0;
  let periodeStart = null, periodeEnd = null;

  rows.forEach(row => {
    if (row.type === 'kredit') {
      kreditTotal += row.amount;
      kreditCount += 1;
    } else {
      debitTotal += row.amount;
      debitCount += 1;
    }
    if (row.date) {
      if (!periodeStart || row.date < periodeStart) periodeStart = row.date;
      if (!periodeEnd || row.date > periodeEnd) periodeEnd = row.date;
    }
  });

  return { total: rows.length, kreditTotal, kreditCount, debitTotal, debitCount, periodeStart, periodeEnd };
}

// --- Core matching ---
export const MATCH_DATE_TOLERANCE_DAYS = 3;
export const DISCREPANCY_DATE_TOLERANCE_DAYS = 14;
export const AMOUNT_TOLERANCE = 5000;

export function reconcileStatement(statementRows, candidates) {
  const pools = {
    debit: candidates.debit.map(c => ({ ...c, used: false })),
    kredit: candidates.kredit.map(c => ({ ...c, used: false })),
  };

  const sortedRows = [...statementRows].sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date.localeCompare(b.date);
  });

  return sortedRows.map(row => {
    const pool = pools[row.type] || [];
    let best = null;
    let bestStatus = null;
    let bestScore = Infinity;

    for (const candidate of pool) {
      if (candidate.used) continue;
      const amountDiff = Math.abs(row.amount - candidate.amount);
      const dateDiffDays = dayDiff(row.date, candidate.date);

      let status = null;
      if (amountDiff === 0 && dateDiffDays <= MATCH_DATE_TOLERANCE_DAYS) {
        status = 'matched';
      } else if (
        (amountDiff === 0 && dateDiffDays <= DISCREPANCY_DATE_TOLERANCE_DAYS) ||
        (amountDiff <= AMOUNT_TOLERANCE && dateDiffDays <= MATCH_DATE_TOLERANCE_DAYS)
      ) {
        status = 'discrepancy';
      }
      if (!status) continue;

      const score = (status === 'matched' ? 0 : 1000) + dateDiffDays + amountDiff / 1000;
      if (score < bestScore) {
        bestScore = score;
        best = candidate;
        bestStatus = status;
      }
    }

    if (best) {
      best.used = true;
      return { ...row, status: bestStatus, match: best };
    }
    return { ...row, status: 'unmatched', match: null };
  });
}

// --- Auto-suggestion for manual matching ---
// Scores candidates by amount closeness, employee name appearing in the
// statement description, and date proximity. Returns the top `limit` candidates.
export function suggestMatches(row, candidates, limit = 3) {
  const desc = (row.description || '').toLowerCase();

  return candidates
    .map(candidate => {
      let score = 0;
      const amountDiff = Math.abs(row.amount - candidate.amount);
      if (amountDiff === 0) score += 100;
      else if (amountDiff <= AMOUNT_TOLERANCE) score += 50;
      else score -= Math.min(amountDiff / 1000, 50);

      const name = (candidate.employeeName || '').toLowerCase();
      if (name) {
        const nameTokens = name.split(/\s+/).filter(t => t.length > 2);
        const matchedTokens = nameTokens.filter(t => desc.includes(t));
        score += matchedTokens.length * 20;
      }

      const dDiff = dayDiff(row.date, candidate.date);
      if (Number.isFinite(dDiff)) score += Math.max(0, 10 - dDiff);

      return { candidate, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.candidate);
}

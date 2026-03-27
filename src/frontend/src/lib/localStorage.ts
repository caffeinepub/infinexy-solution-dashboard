// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminCredentials {
  username: string;
  password: string;
}

export interface Executive {
  id: string;
  name: string;
  username: string;
  password: string;
}

export interface ProfitRecord {
  id: string;
  date: string;
  customerName: string;
  amountReceived: number;
  dailyTarget: number;
  executiveName: string;
  executiveUsername: string;
  customerDailyTarget?: number;
  customerTotalReceived?: number;
}

// ─── Keys ─────────────────────────────────────────────────────────────────────

const ADMIN_CREDS_KEY = "infinexy_admin_credentials";
const EXECUTIVES_KEY = "infinexy_executives";
const RECORDS_KEY = "infinexy_records";

// ─── Admin Credentials ────────────────────────────────────────────────────────

const DEFAULT_ADMIN: AdminCredentials = {
  username: "admin",
  password: "admin123",
};

export function initAdminCredentials(): void {
  if (!localStorage.getItem(ADMIN_CREDS_KEY)) {
    localStorage.setItem(ADMIN_CREDS_KEY, JSON.stringify(DEFAULT_ADMIN));
  }
}

export function getAdminCredentials(): AdminCredentials {
  try {
    const raw = localStorage.getItem(ADMIN_CREDS_KEY);
    if (raw) return JSON.parse(raw) as AdminCredentials;
  } catch {}
  return DEFAULT_ADMIN;
}

export function saveAdminCredentials(creds: AdminCredentials): void {
  localStorage.setItem(ADMIN_CREDS_KEY, JSON.stringify(creds));
}

// ─── Executives ───────────────────────────────────────────────────────────────

export function getExecutives(): Executive[] {
  try {
    const raw = localStorage.getItem(EXECUTIVES_KEY);
    if (raw) return JSON.parse(raw) as Executive[];
  } catch {}
  return [];
}

export function saveExecutives(execs: Executive[]): void {
  localStorage.setItem(EXECUTIVES_KEY, JSON.stringify(execs));
}

export function addExecutive(exec: Omit<Executive, "id">): Executive {
  const execs = getExecutives();
  const newExec: Executive = { ...exec, id: crypto.randomUUID() };
  saveExecutives([...execs, newExec]);
  return newExec;
}

export function deleteExecutive(id: string): void {
  const execs = getExecutives().filter((e) => e.id !== id);
  saveExecutives(execs);
}

// ─── Profit Records ───────────────────────────────────────────────────────────

export function getRecords(): ProfitRecord[] {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    if (raw) return JSON.parse(raw) as ProfitRecord[];
  } catch {}
  return [];
}

export function saveRecords(records: ProfitRecord[]): void {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

export function addRecord(record: ProfitRecord): void {
  const records = getRecords();
  saveRecords([...records, record]);
}

export function updateRecord(updated: ProfitRecord): void {
  const records = getRecords();
  saveRecords(records.map((r) => (r.id === updated.id ? updated : r)));
}

export function deleteRecord(id: string): void {
  const records = getRecords().filter((r) => r.id !== id);
  saveRecords(records);
}

export function getMonthlyRecords(yearMonth: string): ProfitRecord[] {
  return getRecords()
    .filter((r) => r.date.substring(0, 7) === yearMonth)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getMonthlyRecordsByExecutive(
  executiveUsername: string,
  yearMonth: string,
): ProfitRecord[] {
  return getRecords().filter(
    (r) =>
      r.date.substring(0, 7) === yearMonth &&
      r.executiveUsername === executiveUsername,
  );
}

export function getRecordsByExecutive(
  executiveUsername: string,
): ProfitRecord[] {
  return getRecords()
    .filter((r) => r.executiveUsername === executiveUsername)
    .sort((a, b) => a.date.localeCompare(b.date));
}

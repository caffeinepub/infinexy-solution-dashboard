import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  LayoutDashboard,
  LogOut,
  Pencil,
  Plus,
  Printer,
  Settings,
  Trash2,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { SessionUser } from "../lib/auth";
import {
  type Executive,
  type ProfitRecord,
  addExecutive,
  addRecord,
  deleteExecutive,
  deleteRecord,
  getAdminCredentials,
  getExecutives,
  getMonthlyRecords,
  getRecords,
  getRecordsByExecutive,
  saveAdminCredentials,
  saveRecords,
  updateRecord,
} from "../lib/localStorage";

type Tab = "records" | "executives" | "settings";

interface Props {
  session: SessionUser;
  onLogout: () => void;
}

function getCurrentYearMonth() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export default function AdminDashboard({ onLogout }: Props) {
  const [tab, setTab] = useState<Tab>("records");
  const [selectedExec, setSelectedExec] = useState<Executive | null>(null);
  const [yearMonth, setYearMonth] = useState(getCurrentYearMonth());
  const [refreshTick, setRefreshTick] = useState(0);

  const refresh = useCallback(() => setRefreshTick((t) => t + 1), []);

  // Derived data (recomputed on refreshTick change)
  const records: ProfitRecord[] = getMonthlyRecords(yearMonth);
  const executives: Executive[] = getExecutives();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  void refreshTick; // ensure re-render on tick

  // Add Record Modal
  const [addRecordOpen, setAddRecordOpen] = useState(false);
  const [recDate, setRecDate] = useState("");
  const [recCustomer, setRecCustomer] = useState("");
  const [recAmount, setRecAmount] = useState("");
  const [recTarget, setRecTarget] = useState("");
  const [recCustDailyTarget, setRecCustDailyTarget] = useState("");
  const [recCustTotalReceived, setRecCustTotalReceived] = useState("");
  const [recExecUsername, setRecExecUsername] = useState("");

  // Edit Record Modal
  const [editRecordOpen, setEditRecordOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<ProfitRecord | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editCustomer, setEditCustomer] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editTarget, setEditTarget] = useState("");
  const [editCustDailyTarget, setEditCustDailyTarget] = useState("");
  const [editCustTotalReceived, setEditCustTotalReceived] = useState("");
  const [editExecUsername, setEditExecUsername] = useState("");

  // Add Executive Modal
  const [addExecOpen, setAddExecOpen] = useState(false);
  const [execName, setExecName] = useState("");
  const [execUsername, setExecUsername] = useState("");
  const [execPassword, setExecPassword] = useState("");

  // Settings
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  function changeMonth(delta: number) {
    const [y, m] = yearMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    const ny = d.getFullYear();
    const nm = String(d.getMonth() + 1).padStart(2, "0");
    setYearMonth(`${ny}-${nm}`);
  }

  const monthLabel = new Date(`${yearMonth}-01`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const totalAmount = records.reduce((s, r) => s + r.amountReceived, 0);
  const totalTarget = records.reduce((s, r) => s + r.dailyTarget, 0);

  function handleAddRecord(e: React.FormEvent) {
    e.preventDefault();
    if (!recDate || !recCustomer.trim() || !recAmount) {
      toast.error("Please fill all required fields.");
      return;
    }
    const exec = executives.find((ec) => ec.username === recExecUsername);
    const execNameStr = exec ? exec.name : "Admin";
    const execUser = recExecUsername || "admin";
    addRecord({
      id: crypto.randomUUID(),
      date: recDate,
      customerName: recCustomer.trim(),
      amountReceived: Number.parseFloat(recAmount),
      dailyTarget: recTarget ? Number.parseFloat(recTarget) : 0,
      customerDailyTarget: recCustDailyTarget
        ? Number.parseFloat(recCustDailyTarget)
        : undefined,
      customerTotalReceived: recCustTotalReceived
        ? Number.parseFloat(recCustTotalReceived)
        : undefined,
      executiveName: execNameStr,
      executiveUsername: execUser,
    });
    toast.success("Record added successfully.");
    setAddRecordOpen(false);
    setRecDate("");
    setRecCustomer("");
    setRecAmount("");
    setRecTarget("");
    setRecCustDailyTarget("");
    setRecCustTotalReceived("");
    setRecExecUsername("");
    refresh();
  }

  function handleOpenEdit(r: ProfitRecord) {
    setEditRecord(r);
    setEditDate(r.date);
    setEditCustomer(r.customerName);
    setEditAmount(String(r.amountReceived));
    setEditTarget(String(r.dailyTarget));
    setEditCustDailyTarget(
      r.customerDailyTarget !== undefined ? String(r.customerDailyTarget) : "",
    );
    setEditCustTotalReceived(
      r.customerTotalReceived !== undefined
        ? String(r.customerTotalReceived)
        : "",
    );
    setEditExecUsername(r.executiveUsername);
    setEditRecordOpen(true);
  }

  function handleEditRecord(e: React.FormEvent) {
    e.preventDefault();
    if (!editRecord) return;
    if (!editDate || !editCustomer.trim() || !editAmount) {
      toast.error("Please fill all required fields.");
      return;
    }
    const exec = executives.find((ec) => ec.username === editExecUsername);
    const execNameStr = exec
      ? exec.name
      : editExecUsername === "admin"
        ? "Admin"
        : editRecord.executiveName;
    const newDailyTarget = editTarget ? Number.parseFloat(editTarget) : 0;
    const newExecUsername = editExecUsername || "admin";
    // Auto-fill dailyTarget for all records of same executive
    if (newDailyTarget > 0) {
      const allRecords = getRecords();
      const updated = allRecords.map((r) =>
        r.executiveUsername === newExecUsername
          ? { ...r, dailyTarget: newDailyTarget }
          : r,
      );
      saveRecords(updated);
    }
    updateRecord({
      ...editRecord,
      date: editDate,
      customerName: editCustomer.trim(),
      amountReceived: Number.parseFloat(editAmount),
      dailyTarget: newDailyTarget,
      customerDailyTarget: editCustDailyTarget
        ? Number.parseFloat(editCustDailyTarget)
        : undefined,
      customerTotalReceived: editCustTotalReceived
        ? Number.parseFloat(editCustTotalReceived)
        : undefined,
      executiveName: execNameStr,
      executiveUsername: newExecUsername,
    });
    toast.success(
      "Record updated. Daily Target Amount applied to all records of this executive.",
    );
    setEditRecordOpen(false);
    setEditRecord(null);
    refresh();
  }

  function handleDeleteRecord(id: string) {
    if (!confirm("Delete this record?")) return;
    deleteRecord(id);
    toast.success("Record deleted.");
    refresh();
  }

  function handleAddExec(e: React.FormEvent) {
    e.preventDefault();
    if (!execName.trim() || !execUsername.trim() || !execPassword.trim()) {
      toast.error("Please fill all fields.");
      return;
    }
    const existing = executives.find(
      (ec) => ec.username === execUsername.trim(),
    );
    if (existing) {
      toast.error("Username already exists.");
      return;
    }
    addExecutive({
      name: execName.trim(),
      username: execUsername.trim(),
      password: execPassword,
    });
    toast.success("Executive added.");
    setAddExecOpen(false);
    setExecName("");
    setExecUsername("");
    setExecPassword("");
    refresh();
  }

  function handleDeleteExec(id: string, username: string) {
    if (!confirm(`Delete executive "${username}"?`)) return;
    deleteExecutive(id);
    toast.success("Executive deleted.");
    refresh();
  }

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    const creds = getAdminCredentials();
    if (currentPassword !== creds.password) {
      toast.error("Current password is incorrect.");
      return;
    }
    if (!newPassword.trim()) {
      toast.error("Enter a new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    saveAdminCredentials({ ...creds, password: newPassword });
    toast.success("Password changed. Please log in again.");
    onLogout();
  }

  function handleDownloadCSV() {
    const headers = [
      "#",
      "Date",
      "Customer Name",
      "Amount Received",
      "Daily Target Amount",
      "Cust. Daily Amt. Target",
      "Cust. Total Amt. Received",
      "Executive Name",
    ];
    const rows = records.map((r, i) => [
      i + 1,
      r.date,
      r.customerName,
      r.amountReceived,
      r.dailyTarget,
      r.customerDailyTarget ?? "",
      r.customerTotalReceived ?? "",
      r.executiveName,
    ]);
    rows.push(["", "", "TOTAL", totalAmount, totalTarget, "", "", ""]);
    const csv = [headers, ...rows]
      .map((row) => row.map((v) => `"${v}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `infinexy-records-${yearMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded.");
  }

  function handlePrint() {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Infinexy Solution - Records ${monthLabel}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #000; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          p { font-size: 12px; color: #666; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { background: #1e3a5f; color: white; padding: 8px; text-align: left; }
          td { border: 1px solid #ccc; padding: 7px 8px; }
          tr:nth-child(even) td { background: #f5f5f5; }
          .total-row td { font-weight: bold; background: #e8f0fe; }
        </style>
      </head>
      <body>
        <h1>Infinexy Solution</h1>
        <p>Monthly Records — ${monthLabel}</p>
        <table>
          <thead>
            <tr>
              <th>#</th><th>Date</th><th>Customer Name</th>
              <th>Amount Received</th><th>Daily Target Amount</th>
              <th>Cust. Daily Amt. Target</th><th>Cust. Total Amt. Received</th>
              <th>Executive Name</th>
            </tr>
          </thead>
          <tbody>
            ${records
              .map(
                (r, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${formatDate(r.date)}</td>
                <td>${r.customerName}</td>
                <td>₹${r.amountReceived.toLocaleString("en-IN")}</td>
                <td>₹${r.dailyTarget.toLocaleString("en-IN")}</td>
                <td>${r.customerDailyTarget !== undefined ? `₹${r.customerDailyTarget.toLocaleString("en-IN")}` : "—"}</td>
                <td>${r.customerTotalReceived !== undefined ? `₹${r.customerTotalReceived.toLocaleString("en-IN")}` : "—"}</td>
                <td>${r.executiveName}</td>
              </tr>`,
              )
              .join("")}
            <tr class="total-row">
              <td colspan="3">TOTAL</td>
              <td>₹${totalAmount.toLocaleString("en-IN")}</td>
              <td>₹${totalTarget.toLocaleString("en-IN")}</td>
              <td></td><td></td><td></td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(printContent);
      win.document.close();
      win.print();
    }
  }

  const navItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: "records",
      label: "Records",
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: "executives",
      label: "Executives",
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className="w-64 flex-shrink-0 flex flex-col no-print"
        style={{
          background: "oklch(0.22 0.045 255)",
          color: "oklch(0.92 0.01 255)",
        }}
      >
        <div
          className="px-6 py-5 border-b"
          style={{ borderColor: "oklch(0.3 0.04 255)" }}
        >
          <div className="flex items-center gap-3">
            <img
              src="/assets/uploads/screenshot_2026-03-13_121927-019d2dac-5eb3-753c-8c3b-fa6af2f13c5c-1.png"
              alt="Infinexy Solutions"
              className="h-10 w-auto object-contain"
            />
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <button
              type="button"
              key={item.id}
              data-ocid={`nav.${item.id}.tab`}
              onClick={() => {
                setTab(item.id);
                setSelectedExec(null);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                background:
                  tab === item.id ? "oklch(0.52 0.2 255)" : "transparent",
                color: tab === item.id ? "white" : "oklch(0.75 0.03 255)",
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="px-3 pb-6">
          <div
            className="px-3 py-2 rounded-lg mb-3"
            style={{ background: "oklch(0.28 0.05 255)" }}
          >
            <p
              className="text-xs font-medium"
              style={{ color: "oklch(0.65 0.04 255)" }}
            >
              Logged in as
            </p>
            <p
              className="text-sm font-semibold"
              style={{ color: "oklch(0.95 0.01 255)" }}
            >
              Administrator
            </p>
          </div>
          <button
            type="button"
            data-ocid="nav.logout.button"
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{ color: "oklch(0.75 0.03 255)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "oklch(0.28 0.05 255)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-background overflow-auto">
        <motion.div
          key={tab + (selectedExec?.id ?? "")}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="p-6 md:p-8"
        >
          {/* ===== RECORDS TAB ===== */}
          {tab === "records" && (
            <div>
              <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div>
                  <h1 className="font-display text-2xl font-bold text-foreground">
                    Profit Records
                  </h1>
                  <p className="text-muted-foreground text-sm mt-0.5">
                    Monthly revenue and customer tracking
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap no-print">
                  <div className="flex items-center gap-1 border rounded-lg px-2 py-1.5 bg-card shadow-xs">
                    <button
                      type="button"
                      data-ocid="records.pagination_prev"
                      onClick={() => changeMonth(-1)}
                      className="p-1 hover:bg-muted rounded transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-medium px-2 min-w-[130px] text-center">
                      {monthLabel}
                    </span>
                    <button
                      type="button"
                      data-ocid="records.pagination_next"
                      onClick={() => changeMonth(1)}
                      className="p-1 hover:bg-muted rounded transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <Button
                    data-ocid="records.download.button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadCSV}
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" /> Export CSV
                  </Button>
                  <Button
                    data-ocid="records.print.button"
                    variant="outline"
                    size="sm"
                    onClick={handlePrint}
                    className="gap-2"
                  >
                    <Printer className="w-4 h-4" /> Print
                  </Button>
                  <Button
                    data-ocid="records.add.open_modal_button"
                    size="sm"
                    onClick={() => setAddRecordOpen(true)}
                    className="gap-2"
                    style={{
                      background: "oklch(0.52 0.2 255)",
                      color: "white",
                    }}
                  >
                    <Plus className="w-4 h-4" /> Add Record
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-card rounded-xl p-4 shadow-xs border">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    Total Records
                  </p>
                  <p className="text-2xl font-display font-bold text-foreground mt-1">
                    {records.length}
                  </p>
                </div>
                <div className="bg-card rounded-xl p-4 shadow-xs border">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    Total Received
                  </p>
                  <p className="text-2xl font-display font-bold text-foreground mt-1">
                    {formatCurrency(totalAmount)}
                  </p>
                </div>
                <div className="bg-card rounded-xl p-4 shadow-xs border">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    Total Target
                  </p>
                  <p className="text-2xl font-display font-bold text-foreground mt-1">
                    {formatCurrency(totalTarget)}
                  </p>
                </div>
              </div>

              {/* Table */}
              <div className="bg-card rounded-xl border shadow-xs overflow-hidden">
                {records.length === 0 ? (
                  <div
                    data-ocid="records.empty_state"
                    className="text-center py-16"
                  >
                    <LayoutDashboard className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">
                      No records for {monthLabel}
                    </p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      Add a record to get started.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead className="w-12 font-semibold">#</TableHead>
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold">
                          Customer Name
                        </TableHead>
                        <TableHead className="font-semibold">
                          Amount Received
                        </TableHead>
                        <TableHead className="font-semibold">
                          Daily Target Amount
                        </TableHead>
                        <TableHead className="font-semibold text-purple-700">
                          Cust. Daily Amt. Target
                        </TableHead>
                        <TableHead className="font-semibold text-orange-600">
                          Cust. Total Amt. Received
                        </TableHead>
                        <TableHead className="font-semibold">
                          Executive
                        </TableHead>
                        <TableHead className="font-semibold w-24 no-print">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.map((r: ProfitRecord, i: number) => (
                        <TableRow
                          key={r.id}
                          data-ocid={`records.item.${i + 1}`}
                        >
                          <TableCell className="text-muted-foreground font-mono text-xs">
                            {i + 1}
                          </TableCell>
                          <TableCell>{formatDate(r.date)}</TableCell>
                          <TableCell className="font-medium">
                            {r.customerName}
                          </TableCell>
                          <TableCell className="text-green-700 font-semibold">
                            {formatCurrency(r.amountReceived)}
                          </TableCell>
                          <TableCell className="text-blue-700">
                            {formatCurrency(r.dailyTarget)}
                          </TableCell>
                          <TableCell className="text-purple-700">
                            {r.customerDailyTarget !== undefined ? (
                              formatCurrency(r.customerDailyTarget)
                            ) : (
                              <span className="text-muted-foreground/50">
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-orange-600">
                            {r.customerTotalReceived !== undefined ? (
                              formatCurrency(r.customerTotalReceived)
                            ) : (
                              <span className="text-muted-foreground/50">
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell>{r.executiveName}</TableCell>
                          <TableCell className="no-print">
                            <div className="flex items-center gap-1">
                              <Button
                                data-ocid={`records.edit_button.${i + 1}`}
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                onClick={() => handleOpenEdit(r)}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                data-ocid={`records.delete_button.${i + 1}`}
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteRecord(r.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/30 font-semibold">
                        <TableCell
                          colSpan={3}
                          className="text-right pr-4 text-sm"
                        >
                          Monthly Total:
                        </TableCell>
                        <TableCell className="text-green-700 font-bold">
                          {formatCurrency(totalAmount)}
                        </TableCell>
                        <TableCell className="text-blue-700 font-bold">
                          {formatCurrency(totalTarget)}
                        </TableCell>
                        <TableCell colSpan={4} />
                      </TableRow>
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          )}

          {/* ===== EXECUTIVES TAB ===== */}
          {tab === "executives" && (
            <div>
              {selectedExec === null ? (
                /* Executive List View */
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h1 className="font-display text-2xl font-bold text-foreground">
                        Executives
                      </h1>
                      <p className="text-muted-foreground text-sm mt-0.5">
                        Manage executive accounts — click a row to view their
                        records
                      </p>
                    </div>
                    <Button
                      data-ocid="executives.add.open_modal_button"
                      size="sm"
                      onClick={() => setAddExecOpen(true)}
                      className="gap-2"
                      style={{
                        background: "oklch(0.52 0.2 255)",
                        color: "white",
                      }}
                    >
                      <Plus className="w-4 h-4" /> Add Executive
                    </Button>
                  </div>

                  <div className="bg-card rounded-xl border shadow-xs overflow-hidden">
                    {executives.length === 0 ? (
                      <div
                        data-ocid="executives.empty_state"
                        className="text-center py-16"
                      >
                        <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                        <p className="text-muted-foreground font-medium">
                          No executives yet
                        </p>
                        <p className="text-sm text-muted-foreground/70 mt-1">
                          Add an executive to get started.
                        </p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/40 hover:bg-muted/40">
                            <TableHead className="w-12 font-semibold">
                              #
                            </TableHead>
                            <TableHead className="font-semibold">
                              Name
                            </TableHead>
                            <TableHead className="font-semibold">
                              Username
                            </TableHead>
                            <TableHead className="font-semibold">
                              Total Records
                            </TableHead>
                            <TableHead className="font-semibold w-16">
                              Action
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {executives.map((ec: Executive, i: number) => (
                            <TableRow
                              key={ec.id}
                              data-ocid={`executives.item.${i + 1}`}
                              className="cursor-pointer hover:bg-muted/30 transition-colors"
                              onClick={() => setSelectedExec(ec)}
                            >
                              <TableCell className="text-muted-foreground font-mono text-xs">
                                {i + 1}
                              </TableCell>
                              <TableCell className="font-medium text-blue-600">
                                {ec.name}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {ec.username}
                              </TableCell>
                              <TableCell>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                  {getRecordsByExecutive(ec.username).length}{" "}
                                  records
                                </span>
                              </TableCell>
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <Button
                                  data-ocid={`executives.delete_button.${i + 1}`}
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                  onClick={() =>
                                    handleDeleteExec(ec.id, ec.username)
                                  }
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </>
              ) : (
                /* Executive Detail View */
                <>
                  <div className="mb-6">
                    <button
                      type="button"
                      data-ocid="executives.back.button"
                      onClick={() => setSelectedExec(null)}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back to Executives
                    </button>
                    <h1 className="font-display text-2xl font-bold text-foreground">
                      {selectedExec.name}
                    </h1>
                    <p className="text-muted-foreground text-sm mt-0.5">
                      @{selectedExec.username} — all records, sorted by date
                    </p>
                  </div>

                  {/* Exec Stats */}
                  {(() => {
                    const execRecords = getRecordsByExecutive(
                      selectedExec.username,
                    );
                    const execTotal = execRecords.reduce(
                      (s, r) => s + r.amountReceived,
                      0,
                    );
                    const execTarget = execRecords.reduce(
                      (s, r) => s + r.dailyTarget,
                      0,
                    );
                    return (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                          <div className="bg-card rounded-xl p-4 shadow-xs border">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                              Total Records
                            </p>
                            <p className="text-2xl font-display font-bold text-foreground mt-1">
                              {execRecords.length}
                            </p>
                          </div>
                          <div className="bg-card rounded-xl p-4 shadow-xs border">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                              Total Received
                            </p>
                            <p className="text-2xl font-display font-bold text-green-700 mt-1">
                              {formatCurrency(execTotal)}
                            </p>
                          </div>
                          <div className="bg-card rounded-xl p-4 shadow-xs border">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                              Total Target
                            </p>
                            <p className="text-2xl font-display font-bold text-blue-700 mt-1">
                              {formatCurrency(execTarget)}
                            </p>
                          </div>
                        </div>

                        <div className="bg-card rounded-xl border shadow-xs overflow-hidden">
                          {execRecords.length === 0 ? (
                            <div
                              data-ocid="executives.detail.empty_state"
                              className="text-center py-16"
                            >
                              <LayoutDashboard className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                              <p className="text-muted-foreground font-medium">
                                No records yet
                              </p>
                              <p className="text-sm text-muted-foreground/70 mt-1">
                                {selectedExec.name} hasn't added any records.
                              </p>
                            </div>
                          ) : (
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-muted/40 hover:bg-muted/40">
                                  <TableHead className="w-12 font-semibold">
                                    #
                                  </TableHead>
                                  <TableHead className="font-semibold">
                                    Date
                                  </TableHead>
                                  <TableHead className="font-semibold">
                                    Customer Name
                                  </TableHead>
                                  <TableHead className="font-semibold">
                                    Amount Received
                                  </TableHead>
                                  <TableHead className="font-semibold">
                                    Daily Target Amount
                                  </TableHead>
                                  <TableHead className="font-semibold text-purple-700">
                                    Cust. Daily Amt. Target
                                  </TableHead>
                                  <TableHead className="font-semibold text-orange-600">
                                    Cust. Total Amt. Received
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {execRecords.map((r, i) => (
                                  <TableRow
                                    key={r.id}
                                    data-ocid={`executives.detail.item.${i + 1}`}
                                  >
                                    <TableCell className="text-muted-foreground font-mono text-xs">
                                      {i + 1}
                                    </TableCell>
                                    <TableCell>{formatDate(r.date)}</TableCell>
                                    <TableCell className="font-medium">
                                      {r.customerName}
                                    </TableCell>
                                    <TableCell className="text-green-700 font-semibold">
                                      {formatCurrency(r.amountReceived)}
                                    </TableCell>
                                    <TableCell className="text-blue-700">
                                      {formatCurrency(r.dailyTarget)}
                                    </TableCell>
                                    <TableCell className="text-purple-700">
                                      {r.customerDailyTarget !== undefined ? (
                                        formatCurrency(r.customerDailyTarget)
                                      ) : (
                                        <span className="text-muted-foreground/50">
                                          —
                                        </span>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-orange-600">
                                      {r.customerTotalReceived !== undefined ? (
                                        formatCurrency(r.customerTotalReceived)
                                      ) : (
                                        <span className="text-muted-foreground/50">
                                          —
                                        </span>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </>
              )}
            </div>
          )}

          {/* ===== SETTINGS TAB ===== */}
          {tab === "settings" && (
            <div className="max-w-md">
              <div className="mb-6">
                <h1 className="font-display text-2xl font-bold text-foreground">
                  Settings
                </h1>
                <p className="text-muted-foreground text-sm mt-0.5">
                  Manage admin account settings
                </p>
              </div>
              <div className="bg-card rounded-xl border shadow-xs p-6">
                <h2 className="font-display font-semibold text-lg mb-4">
                  Change Admin Password
                </h2>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      data-ocid="settings.input"
                      type="password"
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      data-ocid="settings.input"
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      data-ocid="settings.input"
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  <Button
                    type="submit"
                    data-ocid="settings.submit_button"
                    className="w-full"
                    style={{
                      background: "oklch(0.52 0.2 255)",
                      color: "white",
                    }}
                  >
                    Update Password
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground mt-4 bg-muted/50 rounded-lg p-3">
                  ⚠️ After changing the password, you will be logged out and must
                  sign in with the new password.
                </p>
              </div>
            </div>
          )}
        </motion.div>

        <footer className="no-print px-8 py-4 border-t text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Infinexy Solution. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </footer>
      </main>

      {/* Add Record Modal */}
      <Dialog open={addRecordOpen} onOpenChange={setAddRecordOpen}>
        <DialogContent className="sm:max-w-md" data-ocid="records.add.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              Add Profit Record
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddRecord} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="recDate">Date *</Label>
              <Input
                id="recDate"
                data-ocid="records.add.input"
                type="date"
                value={recDate}
                onChange={(e) => setRecDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recCustomer">Customer Name *</Label>
              <Input
                id="recCustomer"
                data-ocid="records.add.input"
                placeholder="Enter customer name"
                value={recCustomer}
                onChange={(e) => setRecCustomer(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recAmount">Amount Received *</Label>
              <Input
                id="recAmount"
                data-ocid="records.add.input"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={recAmount}
                onChange={(e) => setRecAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recTarget">Daily Target Amount</Label>
              <Input
                id="recTarget"
                data-ocid="records.add.input"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={recTarget}
                onChange={(e) => setRecTarget(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="recCustDailyTarget"
                className="text-purple-700 font-medium"
              >
                Customer Daily Amount Target
              </Label>
              <Input
                id="recCustDailyTarget"
                data-ocid="records.add.input"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={recCustDailyTarget}
                onChange={(e) => setRecCustDailyTarget(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="recCustTotalReceived"
                className="text-orange-600 font-medium"
              >
                Customer Total Amount Received
              </Label>
              <Input
                id="recCustTotalReceived"
                data-ocid="records.add.input"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={recCustTotalReceived}
                onChange={(e) => setRecCustTotalReceived(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recExec">Executive</Label>
              <Select
                value={recExecUsername}
                onValueChange={setRecExecUsername}
              >
                <SelectTrigger data-ocid="records.add.select" id="recExec">
                  <SelectValue placeholder="Select executive (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {executives.map((ec) => (
                    <SelectItem key={ec.username} value={ec.username}>
                      {ec.name} ({ec.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                data-ocid="records.add.cancel_button"
                onClick={() => setAddRecordOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                data-ocid="records.add.submit_button"
                style={{ background: "oklch(0.52 0.2 255)", color: "white" }}
              >
                Add Record
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Record Modal */}
      <Dialog open={editRecordOpen} onOpenChange={setEditRecordOpen}>
        <DialogContent className="sm:max-w-md" data-ocid="records.edit.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Record</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditRecord} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="editDate">Date *</Label>
              <Input
                id="editDate"
                data-ocid="records.edit.input"
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editCustomer">Customer Name *</Label>
              <Input
                id="editCustomer"
                data-ocid="records.edit.input"
                placeholder="Enter customer name"
                value={editCustomer}
                onChange={(e) => setEditCustomer(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editAmount">Amount Received *</Label>
              <Input
                id="editAmount"
                data-ocid="records.edit.input"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editTarget">Daily Target Amount</Label>
              <Input
                id="editTarget"
                data-ocid="records.edit.input"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={editTarget}
                onChange={(e) => setEditTarget(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="editCustDailyTarget"
                className="text-purple-700 font-medium"
              >
                Customer Daily Amount Target
              </Label>
              <Input
                id="editCustDailyTarget"
                data-ocid="records.edit.input"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={editCustDailyTarget}
                onChange={(e) => setEditCustDailyTarget(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="editCustTotalReceived"
                className="text-orange-600 font-medium"
              >
                Customer Total Amount Received
              </Label>
              <Input
                id="editCustTotalReceived"
                data-ocid="records.edit.input"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={editCustTotalReceived}
                onChange={(e) => setEditCustTotalReceived(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editExec">Executive</Label>
              <Select
                value={editExecUsername}
                onValueChange={setEditExecUsername}
              >
                <SelectTrigger data-ocid="records.edit.select" id="editExec">
                  <SelectValue placeholder="Select executive (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {executives.map((ec) => (
                    <SelectItem key={ec.username} value={ec.username}>
                      {ec.name} ({ec.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                data-ocid="records.edit.cancel_button"
                onClick={() => setEditRecordOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                data-ocid="records.edit.submit_button"
                style={{ background: "oklch(0.52 0.2 255)", color: "white" }}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Executive Modal */}
      <Dialog open={addExecOpen} onOpenChange={setAddExecOpen}>
        <DialogContent
          className="sm:max-w-md"
          data-ocid="executives.add.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display">Add Executive</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddExec} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="execName">Full Name *</Label>
              <Input
                id="execName"
                data-ocid="executives.add.input"
                placeholder="Enter full name"
                value={execName}
                onChange={(e) => setExecName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="execUsername">Username *</Label>
              <Input
                id="execUsername"
                data-ocid="executives.add.input"
                placeholder="Enter username"
                value={execUsername}
                onChange={(e) => setExecUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="execPass">Password *</Label>
              <Input
                id="execPass"
                data-ocid="executives.add.input"
                type="password"
                placeholder="Enter password"
                value={execPassword}
                onChange={(e) => setExecPassword(e.target.value)}
                required
              />
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                data-ocid="executives.add.cancel_button"
                onClick={() => setAddExecOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                data-ocid="executives.add.submit_button"
                style={{ background: "oklch(0.52 0.2 255)", color: "white" }}
              >
                Add Executive
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

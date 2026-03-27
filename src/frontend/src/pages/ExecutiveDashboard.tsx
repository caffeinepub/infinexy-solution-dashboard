import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, KeyRound, LogOut, Plus, Settings } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { SessionUser } from "../lib/auth";
import {
  type ProfitRecord,
  addRecord,
  getExecutives,
  getRecordsByExecutive,
  saveExecutives,
} from "../lib/localStorage";

interface Props {
  session: SessionUser;
  onLogout: () => void;
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

export default function ExecutiveDashboard({ session, onLogout }: Props) {
  const [date, setDate] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [amountReceived, setAmountReceived] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);

  const [cpUsername, setCpUsername] = useState("");
  const [cpNewPassword, setCpNewPassword] = useState("");
  const [cpConfirmPassword, setCpConfirmPassword] = useState("");
  const [cpLoading, setCpLoading] = useState(false);

  const refresh = useCallback(() => setRefreshTick((t) => t + 1), []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  void refreshTick;
  const records: ProfitRecord[] = getRecordsByExecutive(session.username);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !customerName.trim() || !amountReceived) {
      toast.error("Please fill all required fields.");
      return;
    }
    addRecord({
      id: crypto.randomUUID(),
      date,
      customerName: customerName.trim(),
      amountReceived: Number.parseFloat(amountReceived),
      dailyTarget: 0,
      executiveName: session.name,
      executiveUsername: session.username,
    });
    toast.success("Record added successfully!");
    setDate("");
    setCustomerName("");
    setAmountReceived("");
    refresh();
  }

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!cpUsername.trim()) {
      toast.error("Please enter your username.");
      return;
    }
    if (cpUsername.trim() !== session.username) {
      toast.error("Username does not match your account.");
      return;
    }
    if (cpNewPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    if (cpNewPassword !== cpConfirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setCpLoading(true);
    const executives = getExecutives();
    const updated = executives.map((ex) =>
      ex.username === session.username
        ? { ...ex, password: cpNewPassword }
        : ex,
    );
    saveExecutives(updated);
    setCpLoading(false);
    toast.success(
      "Password updated. Please log in again with your new password.",
    );
    setCpUsername("");
    setCpNewPassword("");
    setCpConfirmPassword("");
    setTimeout(() => onLogout(), 1500);
  }

  const totalAmount = records.reduce((s, r) => s + r.amountReceived, 0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header
        className="px-6 py-4 flex items-center justify-between border-b shadow-xs"
        style={{ background: "oklch(0.22 0.045 255)" }}
      >
        <div className="flex items-center gap-3">
          <img
            src="/assets/uploads/screenshot_2026-03-13_121927-019d2dac-5eb3-753c-8c3b-fa6af2f13c5c-1.png"
            alt="Infinexy Solutions"
            className="h-8 w-auto object-contain"
          />
          <span
            className="text-xs ml-1"
            style={{ color: "oklch(0.65 0.04 255)" }}
          >
            Executive Portal
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs" style={{ color: "oklch(0.65 0.04 255)" }}>
              Logged in as
            </p>
            <p className="text-sm font-semibold text-white">{session.name}</p>
          </div>
          <Button
            data-ocid="exec.logout.button"
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="gap-2 text-white hover:bg-white/10"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-6 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Tabs defaultValue="records">
            <TabsList className="mb-6">
              <TabsTrigger
                value="records"
                data-ocid="exec.records.tab"
                className="gap-2"
              >
                <ClipboardList className="w-4 h-4" /> Records
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                data-ocid="exec.settings.tab"
                className="gap-2"
              >
                <Settings className="w-4 h-4" /> Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="records" className="space-y-8">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <Plus
                      className="w-5 h-5"
                      style={{ color: "oklch(0.52 0.2 255)" }}
                    />
                    Add New Record
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="execDate">Date *</Label>
                        <Input
                          id="execDate"
                          data-ocid="exec.record.input"
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="execCustomer">Customer Name *</Label>
                        <Input
                          id="execCustomer"
                          data-ocid="exec.record.input"
                          placeholder="Customer name"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="execAmount">Amount Received *</Label>
                        <Input
                          id="execAmount"
                          data-ocid="exec.record.input"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={amountReceived}
                          onChange={(e) => setAmountReceived(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button
                        type="submit"
                        data-ocid="exec.record.submit_button"
                        style={{
                          background: "oklch(0.52 0.2 255)",
                          color: "white",
                        }}
                        className="gap-2"
                      >
                        <Plus className="w-4 h-4" /> Add Record
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4 mb-2">
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
                  <p className="text-2xl font-display font-bold text-green-700 mt-1">
                    {formatCurrency(totalAmount)}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg font-semibold text-foreground">
                    My Records (All Time)
                  </h2>
                </div>

                <div className="bg-card rounded-xl border shadow-xs overflow-hidden">
                  {records.length === 0 ? (
                    <div
                      data-ocid="exec.records.empty_state"
                      className="text-center py-12"
                    >
                      <ClipboardList className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                      <p className="text-muted-foreground font-medium">
                        No records yet
                      </p>
                      <p className="text-sm text-muted-foreground/70 mt-1">
                        Add your first record above.
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                          <TableHead className="w-12 font-semibold">
                            #
                          </TableHead>
                          <TableHead className="font-semibold">Date</TableHead>
                          <TableHead className="font-semibold">
                            Customer Name
                          </TableHead>
                          <TableHead className="font-semibold">
                            Amount Received
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {records.map((r: ProfitRecord, i: number) => (
                          <TableRow
                            key={r.id}
                            data-ocid={`exec.records.item.${i + 1}`}
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
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/30">
                          <TableCell
                            colSpan={3}
                            className="text-right pr-4 text-sm font-semibold"
                          >
                            Total:
                          </TableCell>
                          <TableCell className="text-green-700 font-bold">
                            {formatCurrency(totalAmount)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <KeyRound
                      className="w-5 h-5"
                      style={{ color: "oklch(0.52 0.2 255)" }}
                    />
                    Change Password
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cpUsername">Username</Label>
                      <Input
                        id="cpUsername"
                        data-ocid="exec.cp.input"
                        placeholder="Enter your username to confirm"
                        value={cpUsername}
                        onChange={(e) => setCpUsername(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cpNewPassword">New Password</Label>
                      <Input
                        id="cpNewPassword"
                        data-ocid="exec.cp.input"
                        type="password"
                        placeholder="Enter new password (min 6 characters)"
                        value={cpNewPassword}
                        onChange={(e) => setCpNewPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cpConfirmPassword">
                        Confirm New Password
                      </Label>
                      <Input
                        id="cpConfirmPassword"
                        data-ocid="exec.cp.input"
                        type="password"
                        placeholder="Confirm new password"
                        value={cpConfirmPassword}
                        onChange={(e) => setCpConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      data-ocid="exec.cp.submit_button"
                      disabled={cpLoading}
                      style={{
                        background: "oklch(0.52 0.2 255)",
                        color: "white",
                      }}
                      className="gap-2"
                    >
                      <KeyRound className="w-4 h-4" />
                      {cpLoading ? "Updating..." : "Update Password"}
                    </Button>
                  </form>
                  <p className="text-xs text-muted-foreground mt-4 bg-muted/50 rounded-lg p-3">
                    ⚠️ After changing the password, you will be logged out
                    automatically and must sign in with the new password.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      <footer className="px-8 py-4 border-t text-center text-xs text-muted-foreground">
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
    </div>
  );
}

import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import type { SessionUser } from "./lib/auth";
import { initAdminCredentials } from "./lib/localStorage";
import AdminDashboard from "./pages/AdminDashboard";
import ExecutiveDashboard from "./pages/ExecutiveDashboard";
import LoginPage from "./pages/LoginPage";

export default function App() {
  const [session, setSession] = useState<SessionUser | null>(null);

  useEffect(() => {
    initAdminCredentials();
  }, []);

  if (!session) {
    return (
      <>
        <LoginPage onLogin={setSession} />
        <Toaster richColors />
      </>
    );
  }

  if (session.role === "admin") {
    return (
      <>
        <AdminDashboard session={session} onLogout={() => setSession(null)} />
        <Toaster richColors />
      </>
    );
  }

  return (
    <>
      <ExecutiveDashboard session={session} onLogout={() => setSession(null)} />
      <Toaster richColors />
    </>
  );
}

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { SessionUser } from "../lib/auth";
import {
  getAdminCredentials,
  getExecutives,
  initAdminCredentials,
} from "../lib/localStorage";

interface Props {
  onLogin: (session: SessionUser) => void;
}

export default function LoginPage({ onLogin }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please enter username and password.");
      return;
    }
    setError("");
    setLoading(true);

    initAdminCredentials();

    const adminCreds = getAdminCredentials();
    if (
      username.trim() === adminCreds.username &&
      password === adminCreds.password
    ) {
      setLoading(false);
      onLogin({
        role: "admin",
        username: adminCreds.username,
        name: "Administrator",
      });
      return;
    }

    const executives = getExecutives();
    const exec = executives.find(
      (e) => e.username === username.trim() && e.password === password,
    );
    if (exec) {
      setLoading(false);
      onLogin({ role: "executive", username: exec.username, name: exec.name });
      return;
    }

    setLoading(false);
    setError("Invalid username or password.");
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "oklch(0.22 0.045 255)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-2 pt-8">
            <div className="mx-auto mb-4 flex items-center justify-center">
              <img
                src="/assets/uploads/screenshot_2026-03-13_121927-019d2dac-5eb3-753c-8c3b-fa6af2f13c5c-1.png"
                alt="Infinexy Solutions"
                className="h-16 w-auto object-contain"
              />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Infinexy Solution
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Business Management Dashboard
            </p>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  data-ocid="login.input"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    data-ocid="login.input"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              {error && (
                <p
                  data-ocid="login.error_state"
                  className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md"
                >
                  {error}
                </p>
              )}
              <Button
                type="submit"
                data-ocid="login.submit_button"
                className="w-full"
                disabled={loading}
                style={{ background: "oklch(0.52 0.2 255)", color: "white" }}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            <p className="text-center text-xs text-muted-foreground mt-6">
              © {new Date().getFullYear()}. Built with love using{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition-colors"
              >
                caffeine.ai
              </a>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

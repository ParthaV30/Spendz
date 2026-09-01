"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loginUser } from "@/app/actions/authActions";
import { AlertCircle, Lock, Mail, ArrowRight, UserPlus, Eye, EyeOff } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite") || searchParams.get("token") || "";

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const res = await loginUser(formData);

    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else if (res.groupId) {
      router.push(`/groups/${res.groupId}/dashboard`);
    } else {
      router.push("/");
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 glass-panel p-8 rounded-3xl shadow-2xl border border-purple-500/20">
      <div className="text-center space-y-2">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/30 text-white font-black text-2xl">
          S
        </div>
        <h1 className="text-2xl font-black text-foreground tracking-tight">SPENDZ</h1>
        <p className="text-xs text-muted-foreground">Sign in to manage your personal & shared expenses</p>
      </div>

      {inviteToken && (
        <div className="flex items-center space-x-2 p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold">
          <UserPlus className="h-4 w-4 shrink-0" />
          <span>Signing in via Invitation (Joining as Room Member)</span>
        </div>
      )}

      {error && (
        <div className="flex items-center space-x-2 p-3 rounded-xl bg-destructive/20 border border-destructive/40 text-destructive text-sm font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="hidden" name="inviteToken" value={inviteToken} />

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="w-full bg-secondary/60 border border-border rounded-xl pl-9 pr-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              required
              placeholder="••••••••"
              className="w-full bg-secondary/60 border border-border rounded-xl pl-9 pr-10 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-purple-500/25 disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          <span>{loading ? "Signing in..." : "Sign In & Join Group"}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        Don't have an account?{" "}
        <Link href={inviteToken ? `/register?invite=${inviteToken}` : "/register"} className="font-semibold text-primary hover:underline">
          Register here
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-slate-950 to-purple-950 p-4">
      <Suspense fallback={<div className="text-center text-muted-foreground text-sm">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}

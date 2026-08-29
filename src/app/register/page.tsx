"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { registerUser } from "@/app/actions/authActions";
import { AlertCircle, Lock, Mail, User, ArrowRight, UserPlus } from "lucide-react";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite") || searchParams.get("token") || "";

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const res = await registerUser(formData);

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
          R
        </div>
        <h1 className="text-2xl font-black text-foreground tracking-tight">Create Account</h1>
        <p className="text-xs text-muted-foreground">
          {inviteToken ? "Join your room group as a member" : "Join ROOMMATE to start tracking shared expenses"}
        </p>
      </div>

      {inviteToken && (
        <div className="flex items-center space-x-2 p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold">
          <UserPlus className="h-4 w-4 shrink-0" />
          <span>Registering via Invitation (Joining as Room Member)</span>
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
          <label className="block text-xs font-semibold text-muted-foreground mb-1">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              name="name"
              type="text"
              required
              placeholder="John Doe"
              className="w-full bg-secondary/60 border border-border rounded-xl pl-9 pr-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

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
              type="password"
              required
              placeholder="••••••••"
              className="w-full bg-secondary/60 border border-border rounded-xl pl-9 pr-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-purple-500/25 disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          <span>{loading ? "Creating account..." : inviteToken ? "Join Group & Register" : "Register & Get Started"}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        Already have an account?{" "}
        <Link href={inviteToken ? `/login?invite=${inviteToken}` : "/login"} className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-slate-950 to-purple-950 p-4">
      <Suspense fallback={<div className="text-center text-muted-foreground text-sm">Loading...</div>}>
        <RegisterForm />
      </Suspense>
    </main>
  );
}

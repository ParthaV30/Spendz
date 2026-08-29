import { acceptInvitation } from "@/app/actions/groupActions";
import { getSessionUser } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck, AlertCircle, ArrowRight } from "lucide-react";

export default async function InvitationPage({ params }: { params: { token: string } }) {
  const user = await getSessionUser();

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full glass-panel p-8 rounded-3xl text-center space-y-6">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-foreground">You are invited to join a Group!</h2>
          <p className="text-xs text-muted-foreground">Please sign in or register to accept this invitation.</p>
          <div className="flex justify-center space-x-4">
            <Link href={`/login?invite=${params.token}`} className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl">
              Sign In
            </Link>
            <Link href={`/register?invite=${params.token}`} className="px-5 py-2.5 bg-secondary text-foreground text-sm font-semibold rounded-xl">
              Register
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const res = await acceptInvitation(params.token);

  if (res.error && res.groupId) {
    redirect(`/groups/${res.groupId}/dashboard`);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full glass-panel p-8 rounded-3xl text-center space-y-6 border border-purple-500/30">
        {res.error ? (
          <>
            <div className="mx-auto w-12 h-12 rounded-2xl bg-destructive/20 text-destructive flex items-center justify-center">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Invitation Error</h2>
            <p className="text-xs text-muted-foreground">{res.error}</p>
            <Link href="/" className="inline-flex items-center space-x-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl">
              <span>Go to Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        ) : (
          <>
            <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Joined Group Successfully! 🎉</h2>
            <p className="text-xs text-muted-foreground">
              You are now an active member of <strong>{res.groupName}</strong>.
            </p>
            <Link
              href={`/groups/${res.groupId}/dashboard`}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-purple-500/25"
            >
              <span>Open Group Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        )}
      </div>
    </main>
  );
}

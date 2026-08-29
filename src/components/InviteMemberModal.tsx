"use client";

import { useState } from "react";
import { X, Mail, Copy, Check, Link as LinkIcon, AlertCircle } from "lucide-react";
import { inviteMemberByEmail } from "@/app/actions/groupActions";

interface InviteMemberModalProps {
  groupId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function InviteMemberModal({ groupId, isOpen, onClose }: InviteMemberModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInviteUrl(null);

    if (!email.trim()) {
      setError("Please enter an email address");
      return;
    }

    setLoading(true);
    const res = await inviteMemberByEmail(groupId, email, role);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else if (res.inviteLink) {
      const fullUrl = `${window.location.origin}${res.inviteLink}`;
      setInviteUrl(fullUrl);
    } else if (res.message) {
      onClose();
      window.location.reload();
    }
  };

  const copyLink = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-border/40 pb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Mail className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Invite Roommate to Group</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="flex items-center space-x-2 p-3 rounded-xl bg-destructive/20 border border-destructive/40 text-destructive text-sm font-medium">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {inviteUrl ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/10 space-y-2">
              <span className="text-xs font-bold text-emerald-400">Invitation Link Generated!</span>
              <p className="text-xs text-muted-foreground">Share this secure token link with your roommate to join:</p>
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="text"
                  readOnly
                  value={inviteUrl}
                  className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground font-mono focus:outline-none"
                />
                <button
                  onClick={copyLink}
                  className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center justify-center shrink-0"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-lg"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Roommate Email Address</label>
              <input
                type="email"
                placeholder="roommate@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-secondary/60 border border-border rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Assigned Group Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "ADMIN" | "MEMBER")}
                className="w-full bg-secondary/60 border border-border rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="MEMBER">Member (Can add expenses & settle)</option>
                <option value="ADMIN">Admin (Can edit group, manage budgets, lock months)</option>
              </select>
            </div>

            <div className="pt-4 border-t border-border/40 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-purple-500/25 disabled:opacity-50 flex items-center space-x-2"
              >
                <LinkIcon className="h-4 w-4" />
                <span>{loading ? "Generating..." : "Generate Invitation Link"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

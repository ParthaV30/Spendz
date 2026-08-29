"use client";

import { useState } from "react";
import { X, User, Image as ImageIcon, Lock, Eye, EyeOff, Check, AlertCircle, Sparkles } from "lucide-react";
import { updateUserProfile } from "@/app/actions/userActions";

interface EditProfileModalProps {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  };
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_AVATARS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Arun",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Karthik",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Vijay",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Robot1",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Robot2",
  "https://api.dicebear.com/7.x/identicon/svg?seed=CoolStar",
  "https://api.dicebear.com/7.x/micah/svg?seed=Micah",
  "https://api.dicebear.com/7.x/personaa/svg?seed=Persona",
];

export default function EditProfileModal({ user, isOpen, onClose }: EditProfileModalProps) {
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState(
    user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`
  );
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    const res = await updateUserProfile(name, avatar, newPassword);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      setSuccess(true);
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="relative w-full max-w-lg rounded-3xl border border-purple-500/30 bg-card p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border/40 pb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <User className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Edit Profile & Avatar</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="flex items-center space-x-2 p-3.5 rounded-xl bg-destructive/20 border border-destructive/40 text-destructive text-sm font-medium">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center space-x-2 p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-sm font-semibold">
            <Check className="h-4 w-4 shrink-0" />
            <span>Profile updated successfully! Refreshing...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Preview & Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Profile Avatar Image
            </label>

            <div className="flex items-center space-x-4 p-3 rounded-2xl bg-secondary/40 border border-border/60">
              <div className="relative">
                <img
                  src={avatar}
                  alt="Avatar Preview"
                  className="h-16 w-16 rounded-full border-2 border-purple-500 object-cover shadow-lg"
                  onError={(e) => {
                    // Fallback on broken image link
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                      name
                    )}`;
                  }}
                />
                <div className="absolute -bottom-1 -right-1 p-1 bg-purple-600 rounded-full text-white shadow">
                  <Sparkles className="h-3 w-3" />
                </div>
              </div>

              <div className="flex-1 space-y-1">
                <p className="text-xs font-semibold text-foreground">Avatar Preview</p>
                <p className="text-[11px] text-muted-foreground">Pick a avatar preset below or paste a custom image URL.</p>
              </div>
            </div>

            {/* Presets */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground mb-2">Preset Avatars:</p>
              <div className="grid grid-cols-6 gap-2">
                {PRESET_AVATARS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatar(preset)}
                    className={`p-1 rounded-xl border-2 transition-all ${
                      avatar === preset ? "border-purple-500 bg-purple-500/20 scale-105" : "border-border hover:border-purple-500/50"
                    }`}
                  >
                    <img src={preset} alt={`Preset ${idx}`} className="h-9 w-9 rounded-full mx-auto" />
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Avatar URL */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Custom Image URL</label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="url"
                  placeholder="https://example.com/my-photo.jpg"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  className="w-full bg-secondary/60 border border-border rounded-xl pl-9 pr-3 py-2 text-foreground text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Display Name</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-secondary/60 border border-border rounded-xl pl-9 pr-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* New Password (Optional) with Password Eye Button Toggle */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              New Password <span className="text-[10px] text-muted-foreground font-normal">(Leave blank to keep current)</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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

          {/* Form buttons */}
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
              className="px-6 py-2 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-purple-500/25 disabled:opacity-50 flex items-center space-x-2"
            >
              <span>{loading ? "Saving..." : "Save Profile Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
